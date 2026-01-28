import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { logger } from "@/utils/logger";
import { Loader2, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";

const SetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Vérifier si l'utilisateur a une session valide (via le magic link)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error("Erreur session:", error);
          throw error;
        }

        if (session?.user) {
          logger.log("Session valide trouvée pour:", session.user.email);
          setIsValidSession(true);
        } else {
          logger.warn("Aucune session trouvée");
          toast({
            title: "Lien invalide ou expiré",
            description: "Veuillez demander un nouveau lien de connexion.",
            variant: "destructive",
          });
          navigate("/auth");
        }
      } catch (error) {
        logger.error("Erreur lors de la vérification de session:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue. Veuillez réessayer.",
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    // Écouter les changements d'état d'auth (notamment PASSWORD_RECOVERY)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.log("Auth event sur SetPassword:", event);

      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (session?.user) {
          setIsValidSession(true);
          setIsLoading(false);
        }
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!password || password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      logger.log("Mot de passe mis à jour avec succès");
      setIsSuccess(true);

      toast({
        title: "Mot de passe défini",
        description: "Votre compte est maintenant actif !",
      });

      // Attendre un peu pour montrer le succès, puis rediriger
      setTimeout(() => {
        navigate("/onboarding");
      }, 2000);

    } catch (error: unknown) {
      logger.error("Erreur updateUser:", error);

      let message = "Une erreur est survenue. Veuillez réessayer.";
      if (error instanceof Error) {
        if (error.message.includes("same_password")) {
          message = "Le nouveau mot de passe doit être différent de l'ancien.";
        } else if (error.message.includes("weak_password")) {
          message = "Le mot de passe est trop faible. Utilisez au moins 6 caractères.";
        }
      }

      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Vérification de votre lien..." />;
  }

  if (!isValidSession) {
    return <LoadingScreen message="Redirection..." />;
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-lg p-8 rounded-lg shadow-xl text-center">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Compte activé !
          </h1>
          <p className="text-white/80 mb-6">
            Votre mot de passe a été défini avec succès. Vous allez être redirigé vers la configuration de votre profil.
          </p>
          <div className="flex items-center justify-center gap-2 text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirection en cours...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <img
            src="/lovable-uploads/32069037-2f3a-44ac-9105-33ae1d029573.png"
            alt="Probain Logo"
            className="h-24 w-auto"
          />
        </div>

        {/* Formulaire */}
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-lg shadow-xl">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Bienvenue sur Pro Bain !
            </h1>
            <p className="text-white/70">
              Définissez votre mot de passe pour activer votre compte
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-white mb-2 block">
                Nouveau mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-white mb-2 block">
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Indicateur de force du mot de passe */}
            {password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-green-500' : 'bg-white/20'}`} />
                  <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-white/20'}`} />
                  <div className={`h-1 flex-1 rounded ${password.length >= 10 && /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-white/20'}`} />
                  <div className={`h-1 flex-1 rounded ${password.length >= 12 && /[!@#$%^&*]/.test(password) ? 'bg-green-500' : 'bg-white/20'}`} />
                </div>
                <p className="text-xs text-white/50">
                  {password.length < 6 ? "Trop court" :
                   password.length < 8 ? "Acceptable" :
                   password.length < 10 ? "Bon" : "Excellent"}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className="w-full mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Activation en cours...
                </>
              ) : (
                "Activer mon compte"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
