
import { useEffect, useState } from "react";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle, Loader2, Mail, Clock, UserCheck } from "lucide-react";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { SocialLoginButtons } from "./SocialLoginButtons";

/**
 * Décode les séquences Unicode échappées dans une chaîne.
 * Gère: \u00E9, \\u00E9, /u00E9 -> é
 */
function decodeUnicodeEscapes(text: string | null): string {
  if (!text) return '';

  try {
    let result = text;

    // Pattern pour \uXXXX, \\uXXXX, /uXXXX
    result = result.replace(/[/\\]+u([0-9a-fA-F]{4})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    // Pattern de secours pour \uXXXX (backslash littéral)
    result = result.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    return result;
  } catch {
    return text;
  }
}

interface AuthFormProps {
  activeTab: "sign_in" | "sign_up";
  setActiveTab: (value: "sign_in" | "sign_up") => void;
  errorMessage: string;
}

type ProfileType = "rescuer" | "trainer" | "establishment" | null;

export const AuthForm = ({ activeTab, setActiveTab, errorMessage }: AuthFormProps) => {
  const { toast } = useToast();

  // State pour le flow d'inscription
  const [selectedProfileType, setSelectedProfileType] = useState<ProfileType>(null);
  const [trainers, setTrainers] = useState<string[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [claimEmail, setClaimEmail] = useState<string>("");
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  // State pour la réinitialisation du mot de passe
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  // State pour le formulaire sauveteur personnalisé
  const [rescuerEmail, setRescuerEmail] = useState("");
  const [rescuerPassword, setRescuerPassword] = useState("");
  const [rescuerPasswordConfirm, setRescuerPasswordConfirm] = useState("");
  const [isSubmittingRescuer, setIsSubmittingRescuer] = useState(false);

  // State pour la modal de confirmation
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogType, setConfirmDialogType] = useState<"rescuer" | "trainer" | "establishment" | null>(null);

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail || !forgotPasswordEmail.includes("@")) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingForgot(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Email envoyé",
        description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe.",
      });

      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  // Charger les formateurs depuis sss_formations_cache
  useEffect(() => {
    if (selectedProfileType === "trainer") {
      loadTrainers();
    }
  }, [selectedProfileType]);

  const loadTrainers = async () => {
    setIsLoadingTrainers(true);
    try {
      const { data, error } = await supabase
        .from("sss_formations_cache")
        .select("organisateur")
        .not("organisateur", "is", null);

      if (error) throw error;

      // Extraire les valeurs uniques, décoder l'Unicode et les trier
      const uniqueTrainers = [...new Set(
        data
          .map((item: { organisateur: string | null }) => decodeUnicodeEscapes(item.organisateur))
          .filter((name): name is string => name !== null && name.trim() !== "")
      )].sort((a, b) => a.localeCompare(b, "fr"));

      setTrainers(uniqueTrainers);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des formateurs",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTrainers(false);
    }
  };

  const handleClaimSubmit = async () => {
    if (!claimEmail || !claimEmail.includes("@")) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    if (selectedProfileType === "trainer" && !selectedTrainer) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un formateur dans la liste",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingClaim(true);
    try {
      const { error } = await supabase
        .from("account_claim_requests")
        .insert({
          type: selectedProfileType === "trainer" ? "trainer" : "establishment",
          email: claimEmail,
          selected_trainer_name: selectedProfileType === "trainer" ? selectedTrainer : null,
          status: "pending",
        });

      if (error) throw error;

      setClaimSubmitted(true);

      // Afficher la modal de confirmation selon le type
      setConfirmDialogType(selectedProfileType === "trainer" ? "trainer" : "establishment");
      setShowConfirmDialog(true);
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de votre demande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const resetSignupFlow = () => {
    setSelectedProfileType(null);
    setSelectedTrainer("");
    setClaimEmail("");
    setClaimSubmitted(false);
    // Reset aussi le formulaire sauveteur
    setRescuerEmail("");
    setRescuerPassword("");
    setRescuerPasswordConfirm("");
  };

  // Écouter les erreurs d'authentification
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // Vérifier si c'est une requête vers l'API Supabase Auth
      if (args[0]?.toString().includes('auth/v1')) {
        const clonedResponse = response.clone();

        // Si erreur d'authentification
        if (!response.ok) {
          try {
            const errorData = await clonedResponse.json();

            if (errorData.error || errorData.msg) {
              const errorMessage = errorData.error_description || errorData.msg || errorData.error;

              // Traduire le message d'erreur
              let frenchMessage = "Une erreur est survenue. Veuillez réessayer.";

              if (errorMessage.includes("Invalid login credentials") || errorMessage.includes("Invalid credentials")) {
                frenchMessage = "Email ou mot de passe incorrect. Veuillez vérifier vos informations.";
              } else if (errorMessage.includes("Email not confirmed")) {
                frenchMessage = "Veuillez vérifier votre adresse email avant de vous connecter.";
              } else if (errorMessage.includes("User already registered")) {
                frenchMessage = "Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.";
              } else if (errorMessage.includes("Password should be at least")) {
                frenchMessage = "Le mot de passe doit contenir au moins 6 caractères.";
              } else if (errorMessage.includes("Signup requires a valid password")) {
                frenchMessage = "Veuillez entrer un mot de passe valide.";
              } else if (errorMessage.includes("Unable to validate email address")) {
                frenchMessage = "Adresse email invalide. Veuillez vérifier le format.";
              }

              // Afficher le toast d'erreur
              toast({
                title: "Erreur d'authentification",
                description: frenchMessage,
                variant: "destructive",
              });
            }
          } catch (e) {
            // Ignorer les erreurs de parsing JSON
          }
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [toast]);

  // Rendu du formulaire de sélection de profil (inscription)
  const renderProfileTypeSelection = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-white text-base mb-4 block">
          Quel type de profil souhaitez-vous créer ?
        </Label>
        <RadioGroup
          value={selectedProfileType || ""}
          onValueChange={(value) => setSelectedProfileType(value as ProfileType)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors">
            <RadioGroupItem value="rescuer" id="rescuer" className="border-white text-white" />
            <Label htmlFor="rescuer" className="text-white cursor-pointer flex-1">
              <span className="font-medium">Sauveteur</span>
              <span className="block text-sm text-white/70">Je suis un maître-nageur sauveteur</span>
            </Label>
          </div>
          <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors">
            <RadioGroupItem value="trainer" id="trainer" className="border-white text-white" />
            <Label htmlFor="trainer" className="text-white cursor-pointer flex-1">
              <span className="font-medium">Formateur</span>
              <span className="block text-sm text-white/70">Je suis un organisme de formation SSS</span>
            </Label>
          </div>
          <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors">
            <RadioGroupItem value="establishment" id="establishment" className="border-white text-white" />
            <Label htmlFor="establishment" className="text-white cursor-pointer flex-1">
              <span className="font-medium">Établissement</span>
              <span className="block text-sm text-white/70">Je représente une piscine ou un centre aquatique</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const handleRescuerSignup = async () => {
    // Validation
    if (!rescuerEmail || !rescuerEmail.includes("@")) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    if (!rescuerPassword || rescuerPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    if (rescuerPassword !== rescuerPasswordConfirm) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingRescuer(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: rescuerEmail,
        password: rescuerPassword,
        options: {
          data: {
            profile_type: 'maitre_nageur'
          },
          // Rediriger vers /auth après confirmation email
          // Auth.tsx gère la redirection vers /onboarding si besoin
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });

      if (error) {
        let frenchMessage = "Une erreur est survenue. Veuillez réessayer.";

        if (error.message.includes("User already registered")) {
          frenchMessage = "Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.";
        } else if (error.message.includes("Invalid email")) {
          frenchMessage = "Adresse email invalide. Veuillez vérifier le format.";
        } else if (error.message.includes("Signups not allowed")) {
          frenchMessage = "Les inscriptions sont désactivées. Contactez l'administrateur.";
        } else if (error.message.includes("Email rate limit")) {
          frenchMessage = "Trop de tentatives. Veuillez réessayer dans quelques minutes.";
        }

        toast({
          title: "Erreur d'inscription",
          description: frenchMessage,
          variant: "destructive",
        });
        return;
      }

      // Vérifier si l'utilisateur a été créé (Supabase peut retourner success sans créer l'user)
      if (!data.user) {
        toast({
          title: "Attention",
          description: "Si cet email existe déjà, vérifiez votre boîte mail ou connectez-vous.",
        });
        return;
      }

      // Reset le formulaire
      setRescuerEmail("");
      setRescuerPassword("");
      setRescuerPasswordConfirm("");

      // Si l'utilisateur est deja confirme (email verification desactivee dans Supabase),
      // pas besoin d'afficher le dialog "Verifiez votre email"
      if (data.user.email_confirmed_at || data.session) {
        toast({
          title: "Inscription reussie !",
          description: "Votre compte a ete cree avec succes. Bienvenue !",
        });
        return;
      }

      // Sinon, afficher la modal de confirmation email
      setConfirmDialogType("rescuer");
      setShowConfirmDialog(true);

    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRescuer(false);
    }
  };

  // Rendu du formulaire pour sauveteur (formulaire personnalisé)
  const renderRescuerForm = () => (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="sm"
        onClick={resetSignupFlow}
        className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au choix du profil
      </Button>

      <div className="space-y-4">
        <div>
          <Label htmlFor="rescuer-email" className="text-white mb-2 block">
            Adresse email
          </Label>
          <Input
            id="rescuer-email"
            type="email"
            placeholder="Votre adresse email"
            value={rescuerEmail}
            onChange={(e) => setRescuerEmail(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rescuer-password" className="text-white mb-2 block">
            Mot de passe
          </Label>
          <Input
            id="rescuer-password"
            type="password"
            placeholder="Votre mot de passe"
            value={rescuerPassword}
            onChange={(e) => setRescuerPassword(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <PasswordStrengthIndicator password={rescuerPassword} />
        </div>

        <div>
          <Label htmlFor="rescuer-password-confirm" className="text-white mb-2 block">
            Confirmer le mot de passe
          </Label>
          <Input
            id="rescuer-password-confirm"
            type="password"
            placeholder="Confirmez votre mot de passe"
            value={rescuerPasswordConfirm}
            onChange={(e) => setRescuerPasswordConfirm(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>

        <Button
          onClick={handleRescuerSignup}
          disabled={isSubmittingRescuer}
          className="w-full"
        >
          {isSubmittingRescuer ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Inscription en cours...
            </>
          ) : (
            "S'inscrire"
          )}
        </Button>

        <p className="text-center text-white/70 text-sm">
          Vous avez déjà un compte ?{" "}
          <button
            type="button"
            onClick={() => {
              resetSignupFlow();
              setActiveTab("sign_in");
            }}
            className="text-white underline hover:text-white/80"
          >
            Connectez-vous
          </button>
        </p>
      </div>
    </div>
  );

  // Rendu du formulaire pour formateur (claim)
  const renderTrainerClaimForm = () => {
    if (claimSubmitted) {
      return (
        <div className="space-y-4 text-center py-6">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
          <h3 className="text-white text-xl font-semibold">Demande envoyée !</h3>
          <p className="text-white/80">
            Votre demande de compte formateur a été transmise à notre équipe.
            Vous recevrez une réponse par email dans les plus brefs délais.
          </p>
          <Button
            onClick={resetSignupFlow}
            className="mt-4"
          >
            Retour à l'accueil
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={resetSignupFlow}
          className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au choix du profil
        </Button>

        <div className="space-y-4">
          <div>
            <Label htmlFor="trainer-select" className="text-white mb-2 block">
              Sélectionnez votre organisme de formation
            </Label>
            {isLoadingTrainers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <span className="ml-2 text-white">Chargement des formateurs...</span>
              </div>
            ) : (
              <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Choisissez votre organisme..." />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer} value={trainer}>
                      {trainer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="claim-email" className="text-white mb-2 block">
              Votre adresse email
            </Label>
            <Input
              id="claim-email"
              type="email"
              placeholder="votre@email.com"
              value={claimEmail}
              onChange={(e) => setClaimEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <Button
            onClick={handleClaimSubmit}
            disabled={isSubmittingClaim || !selectedTrainer || !claimEmail}
            className="w-full"
          >
            {isSubmittingClaim ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Envoi en cours...
              </>
            ) : (
              "Demander mon compte formateur"
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Rendu du formulaire pour établissement (claim)
  const renderEstablishmentClaimForm = () => {
    if (claimSubmitted) {
      return (
        <div className="space-y-4 text-center py-6">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
          <h3 className="text-white text-xl font-semibold">Demande envoyée !</h3>
          <p className="text-white/80">
            Votre demande de compte établissement a été transmise à notre équipe.
            Vous serez contacté par email pour finaliser la création de votre compte.
          </p>
          <Button
            onClick={resetSignupFlow}
            className="mt-4"
          >
            Retour à l'accueil
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={resetSignupFlow}
          className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au choix du profil
        </Button>

        <div className="bg-white/10 rounded-lg p-4 mb-4">
          <p className="text-white/90 text-sm">
            Par mesure de sécurité, la création de compte établissement se fait en externe.
            Laissez-nous votre email et notre équipe vous contactera pour finaliser votre inscription.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="establishment-email" className="text-white mb-2 block">
              Votre adresse email professionnelle
            </Label>
            <Input
              id="establishment-email"
              type="email"
              placeholder="contact@etablissement.com"
              value={claimEmail}
              onChange={(e) => setClaimEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <Button
            onClick={handleClaimSubmit}
            disabled={isSubmittingClaim || !claimEmail}
            className="w-full"
          >
            {isSubmittingClaim ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Envoi en cours...
              </>
            ) : (
              "Envoyer la demande"
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Rendu du contenu de l'onglet inscription
  const renderSignupContent = () => {
    if (!selectedProfileType) {
      return renderProfileTypeSelection();
    }

    switch (selectedProfileType) {
      case "rescuer":
        return renderRescuerForm();
      case "trainer":
        return renderTrainerClaimForm();
      case "establishment":
        return renderEstablishmentClaimForm();
      default:
        return renderProfileTypeSelection();
    }
  };

  return (
    <div className="bg-[#1a365d]/90 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-2xl space-y-6 border border-blue-400/20">
      <Tabs value={activeTab} onValueChange={(value: "sign_in" | "sign_up") => {
        setActiveTab(value);
        if (value === "sign_in") {
          resetSignupFlow();
        }
        // Réinitialiser le formulaire mot de passe oublié
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10 p-1.5 rounded-xl h-14 mb-6">
          <TabsTrigger
            value="sign_in"
            className="text-white/70 font-semibold rounded-lg h-full flex items-center justify-center data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            Connexion
          </TabsTrigger>
          <TabsTrigger
            value="sign_up"
            className="text-white/70 font-semibold rounded-lg h-full flex items-center justify-center data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            Inscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sign_in">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {showForgotPassword ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setShowForgotPassword(false)}
                className="text-white hover:text-white hover:bg-white/10 p-0 h-auto mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
              </Button>

              <div className="space-y-4">
                <p className="text-white/80 text-sm">
                  Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>

                <div>
                  <Label htmlFor="forgot-email" className="text-white mb-2 block">
                    Adresse email
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Votre adresse email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <Button
                  onClick={handleForgotPassword}
                  disabled={isSubmittingForgot}
                  className="w-full"
                >
                  {isSubmittingForgot ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer les instructions"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <SupabaseAuth
                supabaseClient={supabase}
                view="sign_in"
                showLinks={false}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#2563eb',
                        brandAccent: '#1d4ed8',
                        inputText: '#ffffff',
                        inputPlaceholder: 'rgba(255, 255, 255, 0.6)',
                      },
                    },
                  },
                  style: {
                    button: {
                      borderRadius: '8px',
                      height: '44px',
                      fontSize: '15px',
                      fontWeight: '500',
                    },
                    input: {
                      borderRadius: '8px',
                      height: '44px',
                      color: '#ffffff',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    label: {
                      color: '#ffffff',
                    },
                    anchor: {
                      color: '#ffffff',
                    },
                  },
                }}
                localization={{
                  variables: {
                    sign_in: {
                      email_label: 'Adresse email',
                      password_label: 'Mot de passe',
                      button_label: 'Se connecter',
                      email_input_placeholder: 'Votre adresse email',
                      password_input_placeholder: 'Votre mot de passe',
                    },
                  },
                }}
                providers={[]}
              />

              {/* Connexion sociale */}
              <div className="mt-4">
                <SocialLoginButtons mode="sign_in" />
              </div>

              <div className="mt-4 space-y-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-white/70 hover:text-white text-sm underline block mx-auto"
                >
                  Mot de passe oublié ?
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("sign_up")}
                  className="text-white/70 hover:text-white text-sm underline block mx-auto"
                >
                  Pas encore de compte ? Inscrivez-vous
                </button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="sign_up">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          {renderSignupContent()}
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation d'inscription */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            {confirmDialogType === "rescuer" && (
              <>
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <DialogTitle className="text-xl font-bold text-center">
                  Vérifiez votre boîte mail !
                </DialogTitle>
                <DialogDescription className="text-center space-y-3 pt-2">
                  <p>
                    Un email de confirmation vient de vous être envoyé.
                  </p>
                  <p className="font-medium text-primary">
                    Cliquez sur le lien dans l'email pour activer votre compte.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pensez à vérifier vos spams si vous ne le trouvez pas.
                  </p>
                </DialogDescription>
              </>
            )}
            {confirmDialogType === "trainer" && (
              <>
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <DialogTitle className="text-xl font-bold text-center">
                  Demande envoyée !
                </DialogTitle>
                <DialogDescription className="text-center space-y-3 pt-2">
                  <p>
                    Votre demande de compte formateur a été transmise à notre équipe.
                  </p>
                  <p className="font-medium text-primary">
                    Un administrateur va traiter votre demande dans les plus brefs délais.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Vous recevrez vos identifiants de connexion par email une fois votre compte validé.
                  </p>
                </DialogDescription>
              </>
            )}
            {confirmDialogType === "establishment" && (
              <>
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <UserCheck className="w-8 h-8 text-purple-600" />
                </div>
                <DialogTitle className="text-xl font-bold text-center">
                  Demande envoyée !
                </DialogTitle>
                <DialogDescription className="text-center space-y-3 pt-2">
                  <p>
                    Votre demande de compte établissement a été transmise à notre équipe.
                  </p>
                  <p className="font-medium text-primary">
                    Un administrateur va traiter votre demande et vous contactera par email.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    La création de votre compte sera finalisée après vérification de vos informations.
                  </p>
                </DialogDescription>
              </>
            )}
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                if (confirmDialogType === "rescuer") {
                  resetSignupFlow();
                  setActiveTab("sign_in");
                }
              }}
              className="px-8"
            >
              J'ai compris
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
