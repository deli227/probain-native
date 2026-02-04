import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthForm } from "@/components/auth/AuthForm";
import { SignupSteps } from "@/components/auth/SignupSteps";
import { getErrorMessage } from "@/utils/authErrors";
import { ProfileRouter } from "@/components/shared/ProfileRouter";
import { logger } from "@/utils/logger";
import { Skeleton } from "@/components/ui/skeleton";

// Detecter si on a un token_hash dans l'URL (confirmation email PKCE)
const hasTokenInUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return !!(params.get('token_hash') && params.get('type') === 'signup');
};

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState("");

  // Lire le mode depuis le state de navigation (signup ou login)
  const initialMode = (location.state as { mode?: string })?.mode === "signup" ? "sign_up" : "sign_in";
  const [activeTab, setActiveTab] = useState<"sign_in" | "sign_up">(initialMode);
  const [isVerifyingToken, setIsVerifyingToken] = useState(hasTokenInUrl);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Verification OTP uniquement si token_hash present dans l'URL
  useEffect(() => {
    if (!isVerifyingToken) return;

    const verifyToken = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenHash = params.get('token_hash');
        const type = params.get('type');

        if (tokenHash && type === 'signup') {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'signup'
          });

          if (error) {
            toast({
              title: "Erreur de confirmation",
              description: error.message || "Le lien de confirmation est invalide ou expiré.",
              variant: "destructive",
            });
          } else if (data.session) {
            toast({
              title: "Email confirmé !",
              description: "Votre compte est maintenant actif. Bienvenue !",
            });
            setIsAuthenticated(true);
            window.history.replaceState(null, '', '/auth');
          }
        }
      } catch (error: unknown) {
        logger.error("Erreur lors de la vérification du token:", error);
        const message = getErrorMessage(error);
        setErrorMessage(message);
        toast({
          title: "Erreur d'authentification",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsVerifyingToken(false);
      }
    };

    verifyToken();
  }, [isVerifyingToken, toast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log("Auth event:", event, session);

      if (event === "SIGNED_IN" && session) {
        setIsAuthenticated(true);
        setErrorMessage("");

        // Si c'est une confirmation d'email (nouveau compte), rediriger directement vers onboarding
        // Vérifier si l'utilisateur vient de confirmer son email (pas d'onboarding complété)
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, profile_type_selected')
          .eq('id', session.user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          // Redirection directe vers l'onboarding sans passer par ProfileRouter
          navigate('/onboarding', { replace: true });
          return;
        }
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setErrorMessage("");
      } else if (event === "PASSWORD_RECOVERY") {
        toast({
          title: "Récupération de mot de passe",
          description: "Vérifiez vos emails pour réinitialiser votre mot de passe",
        });
      } else if (event === "USER_UPDATED") {
        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été mises à jour avec succès",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [toast, navigate]);

  if (isVerifyingToken) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center p-4 safe-top safe-bottom relative overflow-hidden">
        {/* Fond avec dégradé */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#0a1628]" />

        {/* Orbe lumineuse centrale */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.2) 40%, transparent 70%)',
            animation: 'pulse-loading 3s ease-in-out infinite',
          }}
        />

        <div className="relative w-full max-w-md space-y-8 animate-fade-in z-10">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton variant="wave" className="h-24 w-48 rounded-xl bg-white/5" />
            <Skeleton variant="wave" className="h-4 w-32 rounded-full bg-white/5" />
          </div>
          <div className="space-y-4">
            <Skeleton variant="wave" className="h-12 w-full rounded-xl bg-white/5" />
            <Skeleton variant="wave" className="h-12 w-full rounded-xl bg-white/5" />
            <Skeleton variant="wave" className="h-12 w-full rounded-xl bg-white/5" />
          </div>
        </div>


      </div>
    );
  }

  if (isAuthenticated) {
    return <ProfileRouter />;
  }

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col safe-top safe-bottom relative overflow-hidden">
      {/* Fond avec dégradé profond */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#0a1628]" />

      {/* Orbes lumineuses animées */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grande orbe bleue centrale */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.2) 40%, transparent 70%)',
            animation: 'pulse-glow 4s ease-in-out infinite',
          }}
        />

        {/* Orbe cyan en haut à droite */}
        <div
          className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, rgba(6, 182, 212, 0.1) 50%, transparent 70%)',
            animation: 'float-slow 8s ease-in-out infinite',
          }}
        />

        {/* Orbe violette en bas à gauche */}
        <div
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(124, 58, 237, 0.1) 50%, transparent 70%)',
            animation: 'float-slow 10s ease-in-out infinite reverse',
          }}
        />

        {/* Petites particules lumineuses */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full opacity-60 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-50 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-violet-400 rounded-full opacity-40 animate-ping" style={{ animationDuration: '5s', animationDelay: '2s' }} />

        {/* Lignes de lumière diagonales */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-10"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, transparent 45%, rgba(59, 130, 246, 0.3) 50%, transparent 55%, transparent 100%)',
            animation: 'shimmer 8s linear infinite',
          }}
        />
      </div>

      {/* Effet de vagues en bas */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden opacity-20 pointer-events-none">
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60 L1440,120 L0,120 Z"
            fill="url(#wave-gradient)"
            className="animate-wave"
          />
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Header avec logo */}
      <div className="relative flex-shrink-0 pt-8 md:pt-12 pb-4 px-4 z-10">
        <div className="flex flex-col items-center space-y-4 animate-fade-in-up">
          {/* Logo avec halo lumineux */}
          <div className="relative">
            <div
              className="absolute inset-0 blur-2xl opacity-60"
              style={{
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%)',
                transform: 'scale(1.5)',
              }}
            />
            <img
              src="/lovable-uploads/32069037-2f3a-44ac-9105-33ae1d029573.png"
              alt="Probain Logo"
              className="relative h-24 md:h-28 w-auto drop-shadow-2xl"
            />
          </div>

          {/* Tagline */}
          <p className="text-sm md:text-base text-center font-light tracking-wide text-white/70">
            Securite aquatique en Suisse
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="relative flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 px-4 pb-8 overflow-y-auto z-10">
        {/* Carte d'authentification */}
        <div className="relative w-full max-w-md animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {/* Halo subtil derrière la carte */}
          <div
            className="absolute -inset-8 rounded-3xl opacity-40 blur-3xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)',
            }}
          />

          {/* Contenu de la carte */}
          <div className="relative">
            <AuthForm
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              errorMessage={errorMessage}
            />
          </div>
        </div>

        {activeTab === "sign_up" && (
          <div className="hidden lg:block animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <SignupSteps />
          </div>
        )}
      </div>

      {/* Footer avec liens légaux (requis par Apple) */}
      <div className="relative flex-shrink-0 py-4 px-4 space-y-2 z-10">
        <div className="flex justify-center items-center gap-4 text-xs">
          <a
            href="/terms"
            className="text-white/50 hover:text-cyan-400 underline transition-colors duration-300"
          >
            Conditions d'utilisation
          </a>
          <span className="text-white/20">|</span>
          <a
            href="/privacy"
            className="text-white/50 hover:text-cyan-400 underline transition-colors duration-300"
          >
            Politique de confidentialite
          </a>
          <span className="text-white/20">|</span>
          <a
            href="mailto:contact@probain.ch"
            className="text-white/50 hover:text-cyan-400 underline transition-colors duration-300"
          >
            Support
          </a>
        </div>
        <p className="text-white/30 text-xs text-center">
          2026 Probain. Tous droits reserves.
        </p>
      </div>


    </div>
  );
};

export default Auth;
