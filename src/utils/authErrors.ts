
import { AuthError } from "@supabase/supabase-js";

export const getErrorMessage = (error: AuthError) => {
  switch (error.message) {
    case "Invalid login credentials":
      return "Email ou mot de passe incorrect. Veuillez vérifier vos informations.";
    case "User not found":
      return "Aucun utilisateur trouvé avec ces informations.";
    case "Email not confirmed":
      return "Veuillez vérifier votre adresse email avant de vous connecter.";
    case "Invalid grant":
      return "Identifiants de connexion invalides.";
    default:
      return "Une erreur est survenue. Veuillez réessayer.";
  }
};
