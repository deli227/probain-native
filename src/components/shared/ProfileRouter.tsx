
import { Navigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/contexts/ProfileContext';
import { LoadingScreen } from './LoadingScreen';
import { memo, useEffect } from 'react';

// Clé sessionStorage pour persister l'état entre remounts
const PROFILE_LOADED_KEY = 'probain_profile_loaded_session';

// Vérifier si on a déjà chargé un profil cette session (survit aux remounts)
const hasLoadedProfileThisSession = (): boolean => {
  try {
    return sessionStorage.getItem(PROFILE_LOADED_KEY) === 'true';
  } catch {
    return false;
  }
};

export const ProfileRouter = memo(() => {
  const { profileType, profileTypeSelected, onboardingCompleted, loading } = useProfile();
  const location = useLocation();

  // Marquer le profil comme chargé quand on en a un
  useEffect(() => {
    if (profileType) {
      try {
        sessionStorage.setItem(PROFILE_LOADED_KEY, 'true');
      } catch {
        // Ignorer
      }
    }
  }, [profileType]);

  // JAMAIS bloquer si on a déjà chargé un profil cette session
  // Cela évite le bug quand l'utilisateur revient d'un lien externe
  const alreadyLoaded = hasLoadedProfileThisSession();

  if (loading && !profileType && !alreadyLoaded) {
    return <LoadingScreen message="Chargement de votre profil..." />;
  }

  if (!profileTypeSelected) {
    // Éviter la boucle de redirection si on est déjà sur /auth
    if (location.pathname === '/auth') {
      return null; // Laisser AuthRoute gérer l'affichage
    }
    return <Navigate to="/auth" replace />;
  }

  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  switch (profileType) {
    case 'formateur':
      return <Navigate to="/trainer-profile" replace />;
    case 'etablissement':
      return <Navigate to="/establishment-profile" replace />;
    case 'maitre_nageur':
      return <Navigate to="/profile" replace />;
    default:
      // Type de profil non reconnu - renvoyer vers l'authentification
      // Éviter la boucle si on est déjà sur /auth
      if (location.pathname === '/auth') {
        return null;
      }
      return <Navigate to="/auth" replace />;
  }
});

ProfileRouter.displayName = "ProfileRouter";
