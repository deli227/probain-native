import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { safeGetUser } from "@/utils/asyncHelpers";

interface SendRescuerMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rescuer: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export const SendRescuerMessageDialog = ({
  isOpen,
  onClose,
  rescuer,
}: SendRescuerMessageDialogProps) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("internal_messages")
        .insert({
          sender_id: user.id,
          recipient_id: rescuer.id,
          subject,
          content: message,
          read: false,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Succès",
        description: `Message envoyé à ${rescuer.first_name} ${rescuer.last_name}`,
      });

      setSubject("");
      setMessage("");
      onClose();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Vérifiez vos permissions.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Envoyer un message</DialogTitle>
          <DialogDescription>
            Message à {rescuer.first_name} {rescuer.last_name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              placeholder="Sujet du message"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>
          <div className="grid gap-2">
            <Textarea
              placeholder="Écrivez votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              disabled={isSending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !message.trim()}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              "Envoyer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
