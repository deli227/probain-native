import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2, Eye, EyeOff, AlertTriangle } from "lucide-react";
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

interface ChangePasswordSectionProps {
  darkMode?: boolean;
}

export const ChangePasswordSection = ({ darkMode = false }: ChangePasswordSectionProps) => {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const validatePassword = (): boolean => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir les deux champs",
        variant: "destructive",
      });
      return false;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleRequestChange = () => {
    if (validatePassword()) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmChange = async () => {
    setShowConfirmDialog(false);
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès",
      });

      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de modifier le mot de passe",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDialog = (
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent className={darkMode ? "bg-[#0d2847] border-white/20 text-white" : ""}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${darkMode ? "bg-amber-500/20" : "bg-amber-100"}`}>
              <AlertTriangle className={`h-5 w-5 ${darkMode ? "text-amber-400" : "text-amber-600"}`} />
            </div>
            <AlertDialogTitle className={darkMode ? "text-white" : ""}>
              Confirmer le changement
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className={darkMode ? "text-white/60" : ""}>
            Vous allez modifier votre mot de passe de connexion. Cette action prendra effet immédiatement. Voulez-vous continuer ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className={darkMode ? "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" : ""}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmChange}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Oui, modifier
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (darkMode) {
    return (
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-purple-500/20">
            <KeyRound className="h-5 w-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Mot de passe</h3>
        </div>
        <p className="text-white/60 text-sm mb-4">
          Modifiez votre mot de passe de connexion
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-white/70 mb-1.5 block">Nouveau mot de passe</label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                className="bg-white/10 border-white/20 rounded-xl h-12 text-base text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-white/70 mb-1.5 block">Confirmer le mot de passe</label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
                className="bg-white/10 border-white/20 rounded-xl h-12 text-base text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleRequestChange}
            disabled={isUpdating || !newPassword || !confirmPassword}
            className="w-full h-12 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-medium transition-all"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Modification en cours...
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4 mr-2" />
                Modifier le mot de passe
              </>
            )}
          </Button>
        </div>

        {confirmDialog}
      </div>
    );
  }

  // Light mode (établissement)
  return (
    <div className="rounded-2xl border p-5 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-purple-100">
          <KeyRound className="h-5 w-5 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold">Mot de passe</h3>
      </div>
      <p className="text-muted-foreground text-sm">
        Modifiez votre mot de passe de connexion
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Nouveau mot de passe</label>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              className="h-12 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Confirmer le mot de passe</label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez le mot de passe"
              className="h-12 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleRequestChange}
          disabled={isUpdating || !newPassword || !confirmPassword}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Modification en cours...
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4 mr-2" />
              Modifier le mot de passe
            </>
          )}
        </Button>
      </div>

      {confirmDialog}
    </div>
  );
};
