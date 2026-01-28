
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { MessageDialog } from "./MessageDialog";
import { MessageCard } from "./MessageCard";
import { useToast } from "@/hooks/use-toast";
import { safeGetUser } from "@/utils/asyncHelpers";

const RescuerMailbox = () => {
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["rescuer-messages"],
    queryFn: async () => {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error("Non authentifié");

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
          sender:profiles!internal_messages_sender_id_fkey(id, first_name, last_name, profile_type),
          recipient:profiles!internal_messages_recipient_id_fkey(id, first_name, last_name, profile_type)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { messages: data, userId: user.id };
    }
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
      queryClient.invalidateQueries({ queryKey: ["rescuer-messages"] });
      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès",
      });
      setSelectedMessage(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message",
        variant: "destructive",
      });
    },
  });

  // Filtrer les messages reçus (où l'utilisateur actuel est le destinataire)
  const receivedMessages = messages?.messages?.filter(
    msg => msg?.recipient_id === messages?.userId &&
          ['etablissement', 'formateur'].includes(msg?.sender?.profile_type || '')
  ) || [];

  // Filtrer les messages envoyés (où l'utilisateur actuel est l'expéditeur)
  const sentMessages = messages?.messages?.filter(
    msg => msg?.sender_id === messages?.userId &&
          ['etablissement', 'formateur'].includes(msg?.recipient?.profile_type || '')
  ) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Ma messagerie</h1>
      
      <MessageDialog 
        selectedMessage={selectedMessage}
        setSelectedMessage={setSelectedMessage}
        onDelete={(id) => deleteMessageMutation.mutate(id)}
        queryKey="rescuer-messages"
      />

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Messages reçus ({receivedMessages.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Messages envoyés ({sentMessages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          {receivedMessages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              Aucun message reçu
            </div>
          ) : (
            receivedMessages.map(message => (
              <MessageCard 
                key={message.id} 
                message={message} 
                onClick={() => setSelectedMessage(message)}
                onDelete={(id) => deleteMessageMutation.mutate(id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {sentMessages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              Aucun message envoyé
            </div>
          ) : (
            sentMessages.map(message => (
              <MessageCard 
                key={message.id} 
                message={message} 
                onClick={() => setSelectedMessage(message)}
                onDelete={(id) => deleteMessageMutation.mutate(id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RescuerMailbox;
