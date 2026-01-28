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
import { safeGetUser } from "@/utils/asyncHelpers";

interface SendMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: Array<{
    student_id: string;
    student: {
      first_name: string;
      last_name: string;
    };
  }>;
}

export const SendMessageDialog = ({
  isOpen,
  onClose,
  selectedStudents,
}: SendMessageDialogProps) => {
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
      if (!user) throw new Error("Non authentifié");

      // Envoyer le message à chaque étudiant sélectionné
      const promises = selectedStudents.map(({ student_id }) =>
        supabase.from("internal_messages").insert({
          sender_id: user.id,
          recipient_id: student_id,
          subject,
          content: message,
        })
      );

      await Promise.all(promises);

      toast({
        title: "Succès",
        description: "Messages envoyés avec succès",
      });
      
      setSubject("");
      setMessage("");
      onClose();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer les messages",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Envoyer un message</DialogTitle>
          <DialogDescription>
            Envoi à {selectedStudents.length} élève{selectedStudents.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              placeholder="Sujet"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Textarea
              placeholder="Votre message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
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
            disabled={isSending}
          >
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};