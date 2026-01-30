import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  type: "message" | "conversation";
}

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  type,
}: DeleteConfirmDialogProps) => {
  const isConversation = type === "conversation";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#0a1628] border-white/10 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Supprimer {isConversation ? "la conversation" : "le message"} ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/60">
            {isConversation
              ? "Tous les messages de cette conversation seront supprimés définitivement."
              : "Ce message sera supprimé définitivement."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
