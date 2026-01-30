import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, Trash2, Reply, User, Clock, CheckCircle } from "lucide-react";
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
import { Message } from "@/types/message";

const EstablishmentMailbox = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (user) {
        setUserId(user.id);
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

  const canReply = (message: Message) => {
    return message.recipient_id === userId;
  };

  const getProfileTypeLabel = (type: string | null) => {
    switch (type) {
      case "maitre_nageur": return "Sauveteur";
      case "formateur": return "Formateur";
      case "etablissement": return "Établissement";
      default: return "Utilisateur";
    }
  };

  const MessageCard = ({ message, isReceived }: { message: Message, isReceived: boolean }) => (
    <Card
      className={`mb-3 cursor-pointer hover:shadow-md transition-all border-l-4 ${
        isReceived && !message.read
          ? 'border-l-primary bg-primary/5 md:bg-white/15 md:border-l-probain-blue'
          : 'border-l-transparent md:bg-white/5 md:hover:bg-white/10'
      } md:border md:border-white/10 md:rounded-xl`}
      onClick={() => handleOpenMessage(message)}
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isReceived && !message.read && (
                <Badge variant="default" className="bg-primary text-xs">Nouveau</Badge>
              )}
              <CardTitle className="text-base font-semibold md:text-white">
                {message.subject}
              </CardTitle>
            </div>
            <div className="text-sm text-muted-foreground md:text-white/50 space-y-1">
              {isReceived ? (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>De: {message.sender?.first_name} {message.sender?.last_name}</span>
                  {message.sender?.profile_type && (
                    <Badge variant="outline" className="text-xs md:border-white/20 md:text-white/60">
                      {getProfileTypeLabel(message.sender.profile_type)}
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>À: {message.recipient?.first_name} {message.recipient?.last_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 md:text-white/40">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(message.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
              </div>
            </div>
          </div>
          {!isReceived && message.read && (
            <CheckCircle className="h-4 w-4 text-green-500 md:text-green-400" title="Lu" />
          )}
        </div>
      </CardHeader>
    </Card>
  );

  if (isLoading) {
    return <LoadingScreen message="Chargement des messages..." />;
  }

  return (
    <div className="min-h-screen bg-primary-dark md:bg-transparent">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark py-8 md:py-6 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex flex-col items-center gap-3 md:gap-2">
            <div className="bg-white/10 p-4 md:p-2.5 rounded-full md:rounded-xl relative md:border md:border-white/20">
              <Mail className="h-10 w-10 md:h-6 md:w-6 text-white" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-yellow-400 text-primary text-xs px-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-xl font-bold text-white tracking-wide md:tracking-tight">
              MESSAGERIE
            </h1>
            <p className="text-white/70 text-sm md:text-xs max-w-md md:hidden">
              Gérez vos échanges avec les candidats
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl md:max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedMessage?.subject}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">De:</span>
                    <span>{selectedMessage?.sender?.first_name} {selectedMessage?.sender?.last_name}</span>
                    {selectedMessage?.sender?.profile_type && (
                      <Badge variant="outline" className="text-xs">
                        {getProfileTypeLabel(selectedMessage.sender.profile_type)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">À:</span>
                    <span>{selectedMessage?.recipient?.first_name} {selectedMessage?.recipient?.last_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>
                      {selectedMessage && format(new Date(selectedMessage.created_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4 whitespace-pre-wrap min-h-[100px]">
                {selectedMessage?.content}
              </div>

              {selectedMessage && canReply(selectedMessage) && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Reply className="h-4 w-4" />
                    Répondre
                  </h4>
                  <Textarea
                    placeholder="Écrivez votre réponse..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[120px] mb-3"
                  />
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => deleteMessageMutation.mutate(selectedMessage.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                    <Button
                      onClick={handleReply}
                      className="bg-primary hover:bg-primary/90"
                      disabled={!replyContent.trim() || sendReplyMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sendReplyMutation.isPending ? "Envoi..." : "Envoyer"}
                    </Button>
                  </div>
                </div>
              )}

              {selectedMessage && !canReply(selectedMessage) && (
                <div className="mt-6 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => deleteMessageMutation.mutate(selectedMessage.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Card className="bg-white md:bg-white/10 md:backdrop-blur-xl md:border md:border-white/10">
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 md:bg-white/5 md:border md:border-white/10">
              <TabsTrigger value="received" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white md:text-white/60 md:data-[state=active]:bg-gradient-to-r md:data-[state=active]:from-primary md:data-[state=active]:to-probain-blue">
                <Mail className="h-4 w-4" />
                Reçus ({receivedMessages.length})
                {unreadCount > 0 && (
                  <Badge className="bg-yellow-400 text-primary text-xs ml-1">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white md:text-white/60 md:data-[state=active]:bg-gradient-to-r md:data-[state=active]:from-primary md:data-[state=active]:to-probain-blue">
                <Send className="h-4 w-4" />
                Envoyés ({sentMessages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="p-4">
              {receivedMessages.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-300 md:text-white/20 mx-auto mb-4" />
                  <p className="text-muted-foreground md:text-white/50">Aucun message reçu</p>
                </div>
              ) : (
                receivedMessages.map(message => (
                  <MessageCard key={message.id} message={message} isReceived={true} />
                ))
              )}
            </TabsContent>

            <TabsContent value="sent" className="p-4">
              {sentMessages.length === 0 ? (
                <div className="text-center py-12">
                  <Send className="h-12 w-12 text-gray-300 md:text-white/20 mx-auto mb-4" />
                  <p className="text-muted-foreground md:text-white/50">Aucun message envoyé</p>
                </div>
              ) : (
                sentMessages.map(message => (
                  <MessageCard key={message.id} message={message} isReceived={false} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default EstablishmentMailbox;
