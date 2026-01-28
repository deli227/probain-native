import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { Trash2, Reply, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { safeGetUser } from "@/utils/asyncHelpers";
import { Message } from "@/types/message";

interface MessageDialogProps {
  selectedMessage: Message | null;
  setSelectedMessage: (message: Message | null) => void;
  onDelete: (id: string) => void;
  queryKey: string;
}

export const MessageDialog = ({ 
  selectedMessage, 
  setSelectedMessage, 
  onDelete,
  queryKey
}: MessageDialogProps) => {
  const [replyContent, setReplyContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendReplyMutation = useMutation({
    mutationFn: async ({ recipientId, subject, content }: { recipientId: string, subject: string, content: string }) => {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("internal_messages")
        .insert([
          {
            sender_id: user.id,
            recipient_id: recipientId,
            subject,
            content,
          },
        ]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
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

  const handleReply = () => {
    if (!selectedMessage?.sender?.id || !replyContent.trim()) return;

    const recipientId = selectedMessage.sender.id;
    const subject = `Re: ${selectedMessage.subject}`;

    sendReplyMutation.mutate({
      recipientId,
      subject,
      content: replyContent,
    });
  };

  return (
    <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{selectedMessage?.subject}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="text-sm text-muted-foreground mb-2">
            {selectedMessage?.sender?.first_name && (
              <div>De: {selectedMessage.sender.first_name} {selectedMessage.sender.last_name}</div>
            )}
            {selectedMessage?.recipient?.first_name && (
              <div>À: {selectedMessage.recipient.first_name} {selectedMessage.recipient.last_name}</div>
            )}
            <div>
              {selectedMessage && format(new Date(selectedMessage.created_at), "PPP 'à' HH:mm", { locale: fr })}
            </div>
          </div>
          <div className="mt-4 whitespace-pre-wrap">{selectedMessage?.content}</div>
          
          <div className="mt-6">
            <Textarea
              placeholder="Écrire une réponse..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="destructive"
                onClick={() => selectedMessage && onDelete(selectedMessage.id)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
              <Button
                onClick={handleReply}
                className="flex items-center gap-2"
                disabled={!replyContent.trim() || sendReplyMutation.isPending}
              >
                {sendReplyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Reply className="h-4 w-4" />
                    Répondre
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};