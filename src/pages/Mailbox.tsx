import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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

        // Récupérer le type de profil
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

  // Marquer un message comme lu
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
    // Marquer comme lu si c'est un message reçu non lu
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

  // Filtrer les messages
  const receivedMessages = messages?.filter(msg => msg?.recipient_id === userId) || [];
  const sentMessages = messages?.filter(msg => msg?.sender_id === userId) || [];
  const unreadCount = receivedMessages.filter(msg => !msg.read).length;

  // Vérifier si l'utilisateur peut répondre (sauveteurs peuvent répondre mais pas initier)
  const canReply = (message: Message) => {
    // Si c'est un message reçu, on peut toujours répondre
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
          ? 'border-l-primary bg-primary/5'
          : 'border-l-transparent'
      }`}
      onClick={() => handleOpenMessage(message)}
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isReceived && !message.read && (
                <Badge variant="default" className="bg-primary text-xs">Nouveau</Badge>
              )}
              <CardTitle className="text-base font-semibold">
                {message.subject}
              </CardTitle>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {isReceived ? (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>De: {message.sender?.first_name} {message.sender?.last_name}</span>
                  {message.sender?.profile_type && (
                    <Badge variant="outline" className="text-xs">
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
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(message.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
              </div>
            </div>
          </div>
          {!isReceived && message.read && (
            <CheckCircle className="h-4 w-4 text-green-500" title="Lu" />
          )}
        </div>
      </CardHeader>
    </Card>
  );

  if (isLoading) {
    return <LoadingScreen message="Chargement des messages..." />;
  }

  // Composant pour afficher le detail du message (reutilise dans Dialog et split-view)
  const MessageDetail = ({ message, isInline = false }: { message: Message | null, isInline?: boolean }) => (
    <div className={isInline ? "" : "mt-4"}>
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">De:</span>
            <span>{message?.sender?.first_name} {message?.sender?.last_name}</span>
            {message?.sender?.profile_type && (
              <Badge variant="outline" className="text-xs">
                {getProfileTypeLabel(message.sender.profile_type)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">A:</span>
            <span>{message?.recipient?.first_name} {message?.recipient?.last_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>
              {message && format(new Date(message.created_at), "EEEE d MMMM yyyy 'a' HH:mm", { locale: fr })}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 whitespace-pre-wrap min-h-[100px]">
        {message?.content}
      </div>

      {/* Zone de reponse - seulement pour les messages recus */}
      {message && canReply(message) && (
        <div className="mt-6 border-t pt-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Reply className="h-4 w-4" />
            Repondre
          </h4>
          <Textarea
            placeholder="Ecrivez votre reponse..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[120px] mb-3"
          />
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => deleteMessageMutation.mutate(message.id)}
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

      {/* Pour les messages envoyes, juste le bouton supprimer */}
      {message && !canReply(message) && (
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={() => deleteMessageMutation.mutate(message.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      )}
    </div>
  );

  // Liste des messages (utilisee dans les deux modes)
  const MessageList = ({ messages: msgList, isReceived }: { messages: Message[], isReceived: boolean }) => (
    <>
      {msgList.length === 0 ? (
        <div className="text-center py-12">
          {isReceived ? (
            <>
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun message recu</p>
              <p className="text-sm text-gray-400 mt-1">
                Les formateurs et etablissements peuvent vous contacter ici
              </p>
            </>
          ) : (
            <>
              <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun message envoye</p>
              <p className="text-sm text-gray-400 mt-1">
                Vos reponses apparaitront ici
              </p>
            </>
          )}
        </div>
      ) : (
        msgList.map(message => (
          <MessageCard key={message.id} message={message} isReceived={isReceived} />
        ))
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-primary-dark">
      {/* Header compact */}
      <div className="relative bg-gradient-to-br from-primary via-probain-blue to-primary-dark py-5 md:py-6 px-4 overflow-hidden">
        {/* Cercle décoratif */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex flex-col items-center gap-2">
            {/* Icône compacte */}
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

      {/* Content - Split view sur desktop */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Dialog pour mobile uniquement */}
        {isMobile && (
          <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedMessage?.subject}</DialogTitle>
              </DialogHeader>
              <MessageDetail message={selectedMessage} />
            </DialogContent>
          </Dialog>
        )}

        {/* Layout split-view sur desktop */}
        <div className="flex flex-col md:flex-row md:gap-6 md:h-[calc(100vh-12rem)]">
          {/* Liste des messages - pleine largeur sur mobile, 1/3 sur desktop */}
          <div className="w-full md:w-1/3 md:min-w-[320px] md:max-w-[400px]">
            <Card className="bg-white md:h-full md:overflow-hidden rounded-2xl shadow-xl border-0">
              <Tabs defaultValue="received" className="w-full h-full flex flex-col">
                <div className="p-3 flex-shrink-0">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 p-1 rounded-xl">
                    <TabsTrigger value="received" className="flex items-center gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-probain-blue data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Reçus</span> ({receivedMessages.length})
                      {unreadCount > 0 && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-primary text-[10px] sm:text-xs ml-1 shadow-sm">{unreadCount}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="sent" className="flex items-center gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-probain-blue data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                      <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Envoyés</span> ({sentMessages.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="received" className="p-4 flex-1 md:overflow-y-auto">
                  <MessageList messages={receivedMessages} isReceived={true} />
                </TabsContent>

                <TabsContent value="sent" className="p-4 flex-1 md:overflow-y-auto">
                  <MessageList messages={sentMessages} isReceived={false} />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Detail du message - visible uniquement sur desktop */}
          <div className="hidden md:block md:flex-1">
            <Card className="bg-white h-full overflow-y-auto rounded-2xl shadow-xl border-0">
              {selectedMessage ? (
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4 text-gray-900">{selectedMessage.subject}</h2>
                  <MessageDetail message={selectedMessage} isInline={true} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="p-6 bg-gray-50 rounded-2xl mb-4">
                    <MessageSquare className="h-16 w-16" />
                  </div>
                  <p className="text-lg font-medium">Sélectionnez un message</p>
                  <p className="text-sm text-gray-400">Cliquez sur un message pour voir son contenu</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mailbox;
