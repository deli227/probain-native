import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, Trash2, Reply, User, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { safeGetUser } from "@/utils/asyncHelpers";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { useIsMobile } from "@/hooks/use-mobile";
import { Message } from "@/types/message";

// ─── Helper functions (outside component to avoid recreating) ───

const getProfileTypeLabel = (type: string | null) => {
  switch (type) {
    case "maitre_nageur": return "Sauveteur";
    case "formateur": return "Formateur";
    case "etablissement": return "Établissement";
    default: return "Utilisateur";
  }
};

// ─── Extracted components (stable references, no unmount/remount) ───

interface MessageCardProps {
  message: Message;
  isReceived: boolean;
  isSelected: boolean;
  onOpen: (message: Message) => void;
}

const MessageCard = ({ message, isReceived, isSelected, onOpen }: MessageCardProps) => (
  <div
    className={`mb-3 cursor-pointer rounded-xl border transition-all ${
      isSelected
        ? 'bg-white/15 border-white/30 ring-1 ring-probain-blue/50'
        : isReceived && !message.read
          ? 'bg-white/15 border-l-4 border-l-probain-blue border-t-white/10 border-r-white/10 border-b-white/10'
          : 'bg-white/5 border-white/10 hover:bg-white/10'
    }`}
    onClick={() => onOpen(message)}
  >
    <div className="py-3 px-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isReceived && !message.read && (
              <Badge variant="default" className="bg-primary text-xs flex-shrink-0">Nouveau</Badge>
            )}
            <span className="text-base font-semibold text-white truncate">
              {message.subject}
            </span>
          </div>
          <div className="text-sm text-white/50 space-y-1">
            {isReceived ? (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">De: {message.sender?.first_name} {message.sender?.last_name}</span>
                {message.sender?.profile_type && (
                  <Badge variant="outline" className="text-xs border-white/20 text-white/60 flex-shrink-0">
                    {getProfileTypeLabel(message.sender.profile_type)}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">À: {message.recipient?.first_name} {message.recipient?.last_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-white/40">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>{format(new Date(message.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
            </div>
          </div>
        </div>
        {!isReceived && message.read && (
          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" title="Lu" />
        )}
      </div>
    </div>
  </div>
);

interface MessageDetailProps {
  message: Message | null;
  isInline?: boolean;
  replyContent: string;
  onReplyContentChange: (value: string) => void;
  onReply: () => void;
  onDelete: (id: string) => void;
  canReply: boolean;
  isReplying: boolean;
}

const MessageDetail = ({ message, isInline, replyContent, onReplyContentChange, onReply, onDelete, canReply, isReplying }: MessageDetailProps) => (
  <div className={isInline ? "" : "mt-4"}>
    <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
      <div className="text-sm text-white/50 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white/70">De:</span>
          <span className="text-white">{message?.sender?.first_name} {message?.sender?.last_name}</span>
          {message?.sender?.profile_type && (
            <Badge variant="outline" className="text-xs border-white/20 text-white/60">
              {getProfileTypeLabel(message.sender.profile_type)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-white/70">À:</span>
          <span className="text-white">{message?.recipient?.first_name} {message?.recipient?.last_name}</span>
        </div>
        <div className="flex items-center gap-2 text-white/40">
          <Clock className="h-3 w-3" />
          <span>
            {message && format(new Date(message.created_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
          </span>
        </div>
      </div>
    </div>

    <div className="bg-white/5 border border-white/10 rounded-xl p-4 whitespace-pre-wrap min-h-[100px] text-white">
      {message?.content}
    </div>

    {/* Zone de réponse */}
    {message && canReply && (
      <div className="mt-6 border-t border-white/10 pt-4">
        <h4 className="font-medium mb-2 flex items-center gap-2 text-white">
          <Reply className="h-4 w-4" />
          Répondre
        </h4>
        <Textarea
          placeholder="Écrivez votre réponse..."
          value={replyContent}
          onChange={(e) => onReplyContentChange(e.target.value)}
          className="min-h-[120px] mb-3 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 rounded-xl"
        />
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => onDelete(message.id)}
            className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
          <Button
            onClick={onReply}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
            disabled={!replyContent.trim() || isReplying}
          >
            <Send className="h-4 w-4 mr-2" />
            {isReplying ? "Envoi..." : "Envoyer"}
          </Button>
        </div>
      </div>
    )}

    {/* Pour les messages envoyés, juste le bouton supprimer */}
    {message && !canReply && (
      <div className="mt-6 flex justify-end">
        <Button
          variant="outline"
          onClick={() => onDelete(message.id)}
          className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </div>
    )}
  </div>
);

interface MessageListProps {
  messages: Message[];
  isReceived: boolean;
  selectedMessageId: string | null;
  onOpen: (message: Message) => void;
}

const MessageList = ({ messages: msgList, isReceived, selectedMessageId, onOpen }: MessageListProps) => (
  <>
    {msgList.length === 0 ? (
      <div className="text-center py-12">
        {isReceived ? (
          <>
            <Mail className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">Aucun message reçu</p>
            <p className="text-sm text-white/30 mt-1">
              Les formateurs et établissements peuvent vous contacter ici
            </p>
          </>
        ) : (
          <>
            <Send className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">Aucun message envoyé</p>
            <p className="text-sm text-white/30 mt-1">
              Vos réponses apparaîtront ici
            </p>
          </>
        )}
      </div>
    ) : (
      msgList.map(message => (
        <MessageCard
          key={message.id}
          message={message}
          isReceived={isReceived}
          isSelected={message.id === selectedMessageId}
          onOpen={onOpen}
        />
      ))
    )}
  </>
);

// ─── Main Mailbox component ───

const Mailbox = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfileType, setUserProfileType] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

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
          sender:profiles!internal_messages_sender_id_fkey(id, first_name, last_name, profile_type),
          recipient:profiles!internal_messages_recipient_id_fkey(id, first_name, last_name, profile_type)
        `)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("internal_messages")
        .update({ read: true })
        .eq("id", messageId);

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

  const sendReplyMutation = useMutation({
    mutationFn: async ({ recipientId, subject, content }: { recipientId: string, subject: string, content: string }) => {
      const { error } = await supabase
        .from("internal_messages")
        .insert([
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
      setReplyContent("");
      setSelectedMessage(null);
      toast({
        title: "Message envoyé",
        description: "Votre réponse a été envoyée avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la réponse",
        variant: "destructive",
      });
    },
  });

  const handleOpenMessage = (message: Message) => {
    setSelectedMessage(message);
    setReplyContent("");
    if (message.recipient_id === userId && !message.read) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleReply = () => {
    if (!selectedMessage?.sender_id || !replyContent.trim()) return;

    const recipientId = selectedMessage.sender_id;
    const subject = selectedMessage.subject.startsWith("Re:")
      ? selectedMessage.subject
      : `Re: ${selectedMessage.subject}`;

    sendReplyMutation.mutate({
      recipientId,
      subject,
      content: replyContent,
    });
  };

  const receivedMessages = messages?.filter(msg => msg?.recipient_id === userId) || [];
  const sentMessages = messages?.filter(msg => msg?.sender_id === userId) || [];
  const unreadCount = receivedMessages.filter(msg => !msg.read).length;

  const canReplyToMessage = (message: Message) => {
    return message.recipient_id === userId;
  };

  if (isLoading) {
    return <LoadingScreen message="Chargement des messages..." />;
  }

  return (
    <div className="min-h-screen bg-primary-dark pb-20 md:pb-6">
      {/* Header compact */}
      <div className="relative bg-gradient-to-br from-primary via-probain-blue to-primary-dark py-5 md:py-6 px-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl blur-md opacity-40" />
              <div className="relative bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
                <Mail className="h-5 w-5 md:h-6 md:w-6 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
              MESSAGERIE
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Dialog mobile */}
        {isMobile && (
          <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#0a1628] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl text-white">{selectedMessage?.subject}</DialogTitle>
              </DialogHeader>
              {selectedMessage && (
                <MessageDetail
                  message={selectedMessage}
                  replyContent={replyContent}
                  onReplyContentChange={setReplyContent}
                  onReply={handleReply}
                  onDelete={(id) => deleteMessageMutation.mutate(id)}
                  canReply={canReplyToMessage(selectedMessage)}
                  isReplying={sendReplyMutation.isPending}
                />
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Layout split-view desktop */}
        <div className="flex flex-col md:flex-row md:gap-6 md:h-[calc(100vh-12rem)]">
          {/* Liste des messages */}
          <div className="w-full md:w-1/3 md:min-w-[320px] md:max-w-[400px]">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl md:h-full md:overflow-hidden">
              <Tabs defaultValue="received" className="w-full h-full flex flex-col">
                <div className="p-3 flex-shrink-0">
                  <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 p-1 rounded-xl">
                    <TabsTrigger value="received" className="flex items-center gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-probain-blue data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Reçus</span> ({receivedMessages.length})
                      {unreadCount > 0 && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-primary text-[10px] sm:text-xs ml-1 shadow-sm">{unreadCount}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="flex items-center gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-probain-blue data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                      <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Envoyés</span> ({sentMessages.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="received" className="p-4 flex-1 md:overflow-y-auto">
                  <MessageList
                    messages={receivedMessages}
                    isReceived={true}
                    selectedMessageId={selectedMessage?.id ?? null}
                    onOpen={handleOpenMessage}
                  />
                </TabsContent>

                <TabsContent value="sent" className="p-4 flex-1 md:overflow-y-auto">
                  <MessageList
                    messages={sentMessages}
                    isReceived={false}
                    selectedMessageId={selectedMessage?.id ?? null}
                    onOpen={handleOpenMessage}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Détail du message - desktop */}
          <div className="hidden md:block md:flex-1">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl h-full overflow-y-auto">
              {selectedMessage ? (
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 text-white">{selectedMessage.subject}</h2>
                  <MessageDetail
                    message={selectedMessage}
                    isInline={true}
                    replyContent={replyContent}
                    onReplyContentChange={setReplyContent}
                    onReply={handleReply}
                    onDelete={(id) => deleteMessageMutation.mutate(id)}
                    canReply={canReplyToMessage(selectedMessage)}
                    isReplying={sendReplyMutation.isPending}
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/30">
                  <div className="p-6 bg-white/5 rounded-2xl mb-4 border border-white/10">
                    <MessageSquare className="h-16 w-16" />
                  </div>
                  <p className="text-lg font-medium text-white/50">Sélectionnez un message</p>
                  <p className="text-sm text-white/30">Cliquez sur un message pour voir son contenu</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mailbox;
