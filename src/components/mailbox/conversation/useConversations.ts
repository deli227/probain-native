import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeGetUser } from "@/utils/asyncHelpers";
import { groupMessagesIntoConversations } from "./types";
import type { Message } from "@/types/message";

export function useConversations() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfileType, setUserProfileType] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("profile_type")
          .eq("id", user.id)
          .single();
        if (profile) {
          setUserProfileType(profile.profile_type);
        }
      }
    };
    getCurrentUser();
  }, []);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("internal_messages")
        .select(`
          id,
          subject,
          content,
          read,
          created_at,
          sender_id,
          recipient_id,
          sender:profiles!internal_messages_sender_id_fkey(id, first_name, last_name, profile_type, avatar_url),
          recipient:profiles!internal_messages_recipient_id_fkey(id, first_name, last_name, profile_type, avatar_url)
        `)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const msgs = data as unknown as Message[];

      // Collecter les IDs des profils établissement/formateur sans nom
      const profileIdsToResolve = new Set<string>();
      for (const msg of msgs) {
        for (const profile of [msg.sender, msg.recipient]) {
          if (profile && !profile.first_name && (profile.profile_type === "etablissement" || profile.profile_type === "formateur")) {
            profileIdsToResolve.add(profile.id);
          }
        }
      }

      // Résoudre les noms depuis les tables spécifiques
      if (profileIdsToResolve.size > 0) {
        const ids = Array.from(profileIdsToResolve);
        const nameMap = new Map<string, { name: string; avatar: string | null }>();

        const [estResult, trainerResult] = await Promise.all([
          supabase
            .from("establishment_profiles")
            .select("id, organization_name, avatar_url")
            .in("id", ids),
          supabase
            .from("trainer_profiles")
            .select("id, organization_name, avatar_url")
            .in("id", ids),
        ]);

        for (const row of estResult.data || []) {
          if (row.organization_name) {
            nameMap.set(row.id, { name: row.organization_name, avatar: row.avatar_url });
          }
        }
        for (const row of trainerResult.data || []) {
          if (row.organization_name) {
            nameMap.set(row.id, { name: row.organization_name, avatar: row.avatar_url });
          }
        }

        // Enrichir les profils avec les noms résolus
        for (const msg of msgs) {
          for (const profile of [msg.sender, msg.recipient]) {
            if (profile && nameMap.has(profile.id)) {
              const resolved = nameMap.get(profile.id)!;
              profile.first_name = resolved.name;
              profile.last_name = "";
              if (resolved.avatar && !profile.avatar_url) {
                profile.avatar_url = resolved.avatar;
              }
            }
          }
        }
      }

      return msgs;
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`conversations-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "internal_messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", userId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "internal_messages",
          filter: `sender_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const conversations = userId
    ? groupMessagesIntoConversations(messages || [], userId)
    : [];

  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: string[]) => {
      const { error } = await supabase
        .from("internal_messages")
        .update({ read: true })
        .in("id", messageIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("internal_messages")
        .delete()
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message",
        variant: "destructive",
      });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (messageIds: string[]) => {
      const { error } = await supabase
        .from("internal_messages")
        .delete()
        .in("id", messageIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast({
        title: "Conversation supprimée",
        description: "La conversation a été supprimée avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la conversation",
        variant: "destructive",
      });
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({
      recipientId,
      subject,
      content,
    }: {
      recipientId: string;
      subject: string;
      content: string;
    }) => {
      const { error } = await supabase.from("internal_messages").insert([
        {
          sender_id: userId,
          recipient_id: recipientId,
          subject,
          content,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    },
  });

  const markConversationAsRead = useCallback(
    (contactId: string) => {
      if (!userId) return;
      const conversation = conversations.find((c) => c.contact.id === contactId);
      if (!conversation) return;

      const unreadIds = conversation.messages
        .filter((m) => m.recipient_id === userId && !m.read)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        markAsReadMutation.mutate(unreadIds);
      }
    },
    [userId, conversations, markAsReadMutation]
  );

  return {
    userId,
    userProfileType,
    conversations,
    isLoading,
    markConversationAsRead,
    deleteMessage: deleteMessageMutation.mutate,
    deleteConversation: deleteConversationMutation.mutate,
    sendReply: sendReplyMutation.mutate,
    isSending: sendReplyMutation.isPending,
  };
}
