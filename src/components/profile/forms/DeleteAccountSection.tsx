import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteAccountSectionProps {
  userId: string | undefined;
}

export const DeleteAccountSection = ({ userId }: DeleteAccountSectionProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!userId) return;

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Session expired');
      }

      const response = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error || !response.data?.success) {
        throw new Error(response.data?.error || 'Failed to delete account');
      }

      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();

      toast({
        title: 'Compte supprimé',
        description: 'Votre compte a été supprimé avec succès.',
      });

      navigate('/');
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le compte. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-red-500/10 rounded-2xl p-5 border border-red-500/20 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-red-500/20">
          <Trash2 className="h-5 w-5 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Zone dangereuse</h3>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            className="w-full bg-red-600/80 hover:bg-red-600 border border-red-500/30 text-white"
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression en cours...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer mon compte
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-[#0d2847] border border-white/10">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <AlertDialogTitle className="text-white text-xl">
                Supprimer votre compte ?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-white/70">
              Cette action est <span className="text-red-400 font-semibold">irréversible</span>.
              Toutes vos données seront définitivement supprimées, incluant votre profil,
              vos formations, vos expériences et vos préférences.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="text-red-400/60 text-xs mt-3 text-center">
        La suppression de votre compte est définitive et irréversible.
      </p>
    </div>
  );
};
