
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { supabase } from "@/integrations/supabase/client";
import { ProfileProvider, useProfile } from "@/contexts/ProfileContext";
import { ProfileRouter } from "@/components/shared/ProfileRouter";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { InstallPWAPrompt } from "@/components/shared/InstallPWAPrompt";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAppResume } from "@/hooks/useAppResume";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { queryClient, persister } from "@/lib/queryClient";

// Navbars - chargées immédiatement car souvent utilisées
import Navbar from "@/components/Navbar";
import TrainerNavbar from "@/components/navbar/TrainerNavbar";
import RescuerNavbar from "@/components/navbar/RescuerNavbar";
import EstablishmentNavbar from "@/components/navbar/EstablishmentNavbar";

// Lazy loading des pages pour réduire la taille du bundle initial
const Index = lazy(() => import("@/pages/Index"));
const Profile = lazy(() => import("@/pages/Profile"));
const TrainerProfile = lazy(() => import("@/components/profile/TrainerProfile"));
const EstablishmentProfile = lazy(() => import("@/components/profile/EstablishmentProfile"));
const EstablishmentAnnouncements = lazy(() => import("@/pages/EstablishmentAnnouncements"));
const EstablishmentRescuers = lazy(() => import("@/pages/EstablishmentRescuers"));
const TrainerStudents = lazy(() => import("@/components/profile/TrainerStudents").then(m => ({ default: m.TrainerStudents })));
const Jobs = lazy(() => import("@/pages/Jobs"));
const Training = lazy(() => import("@/pages/Training"));
const Auth = lazy(() => import("@/pages/Auth"));
const OnboardingWizard = lazy(() => import("@/components/onboarding/OnboardingWizard").then(m => ({ default: m.OnboardingWizard })));
const Mailbox = lazy(() => import("@/pages/Mailbox"));
const EstablishmentMailbox = lazy(() => import("@/components/mailbox/EstablishmentMailbox"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Settings = lazy(() => import("@/pages/Settings"));
const Flux = lazy(() => import("@/pages/Flux"));
const TermsOfUse = lazy(() => import("@/pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const SetPassword = lazy(() => import("@/pages/SetPassword"));
const AddFormation = lazy(() => import("@/pages/AddFormation"));
const AddExperience = lazy(() => import("@/pages/AddExperience"));

// Plus besoin de sessionStorage - TanStack Query gère le cache

// Fonction pour détecter les tokens d'auth dans l'URL
// PKCE flow: token_hash dans query params (?token_hash=...)
// Legacy flow: access_token dans hash fragment (#access_token=...)
const hasAuthTokensInUrl = () => {
  const hash = window.location.hash;
  const search = window.location.search;
  return hash.includes('access_token=') ||
         hash.includes('type=signup') ||
         search.includes('token_hash=') ||
         search.includes('type=signup');
};

function AppRoutes() {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const { profileTypeSelected, onboardingCompleted, profileType, loading } = useProfile();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessingAuthTokens, setIsProcessingAuthTokens] = useState(hasAuthTokensInUrl());
  const sessionRef = useRef(null);
  const initHandledRef = useRef(false); // Pour éviter les race conditions

  // Gestion du retour sur l'app après lien externe (FIX PWA)
  useAppResume();

  const isLandingPage = location.pathname === "/";
  const isAuthPage = location.pathname === "/auth";
  const isOnboardingPage = location.pathname === "/onboarding";
  const isTrainerProfile = location.pathname.startsWith("/trainer-profile");
  const isEstablishmentProfile = location.pathname.startsWith("/establishment-profile");

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      sessionRef.current = newSession;
      setSession(newSession);

      // Si on avait des tokens dans l'URL et qu'on a maintenant une session, les tokens ont été traités
      if (isProcessingAuthTokens && newSession) {
        setIsProcessingAuthTokens(false);
        // Nettoyer l'URL pour éviter le retraitement (hash ou query params)
        if (window.location.hash.includes('access_token') ||
            window.location.search.includes('token_hash')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      // Marquer l'initialisation comme terminée (une seule fois)
      if (!initHandledRef.current) {
        initHandledRef.current = true;
        setIsInitializing(false);
      }
    });

    // Fallback: si onAuthStateChange ne répond pas en 1.5 secondes, continuer sans session
    const fallbackTimeout = setTimeout(() => {
      if (isMounted && !initHandledRef.current) {
        initHandledRef.current = true;
        setIsInitializing(false);
      }
    }, 1500);

    // Fallback: si le traitement des tokens prend trop longtemps (5 sec), abandonner
    const tokenProcessingTimeout = setTimeout(() => {
      if (isMounted) {
        setIsProcessingAuthTokens(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      clearTimeout(tokenProcessingTimeout);
      subscription.unsubscribe();
    };
  }, [isProcessingAuthTokens]);

  if (isInitializing) {
    return <LoadingScreen message="Initialisation de l'application..." />;
  }

  const renderNavbar = () => {
    // Pas de navbar sur les pages publiques/auth/onboarding
    if (isLandingPage || isAuthPage || isOnboardingPage) return null;

    // Attendre que le profil soit chargé pour éviter les flashs de navbar
    if (loading || !profileType) return null;

    // Pour les pages spécifiques à un type de profil (basé sur le path)
    if (isTrainerProfile) return <TrainerNavbar />;
    if (isEstablishmentProfile) return <EstablishmentNavbar />;

    // Pour les pages partagées (flux, settings, jobs, training, etc.)
    // Utiliser profileType comme source de vérité
    if (profileType === 'formateur') return <TrainerNavbar />;
    if (profileType === 'etablissement') return <EstablishmentNavbar />;
    if (profileType === 'maitre_nageur') return <RescuerNavbar />;

    // Fallback (ne devrait pas arriver si l'utilisateur est connecté)
    return null;
  };

  const ProtectedRoute = ({ children }) => {
    // Attendre que le profil soit chargé avant de décider
    if (loading) {
      return <LoadingScreen message="Chargement..." />;
    }
    // Attendre le traitement des tokens d'auth si présents dans l'URL
    if (isProcessingAuthTokens) {
      return <LoadingScreen message="Connexion en cours..." />;
    }
    if (!session) {
      return <Navigate to="/auth" replace />;
    }
    return children;
  };

  const AuthRoute = ({ children }) => {
    if (session) {
      // Attendre que le profil soit chargé avant de rediriger
      if (loading) {
        return <LoadingScreen message="Chargement de votre profil..." />;
      }
      // Si l'utilisateur n'a pas encore sélectionné son type de profil,
      // le laisser sur la page Auth pour compléter son inscription
      if (!profileTypeSelected) {
        return children;
      }
      return <ProfileRouter />;
    }
    return children;
  };

  // Determiner si on doit utiliser le DashboardLayout (pages protegees avec profil)
  // Attendre que loading soit false pour éviter les flashs
  const shouldUseDashboardLayout = session && profileType && !loading && !isLandingPage && !isAuthPage && !isOnboardingPage;

  // Wrapper pour le contenu avec ou sans DashboardLayout
  const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    if (shouldUseDashboardLayout && profileType) {
      return (
        <DashboardLayout profileType={profileType as 'formateur' | 'etablissement' | 'maitre_nageur'}>
          {renderNavbar()}
          {children}
        </DashboardLayout>
      );
    }
    return (
      <>
        {renderNavbar()}
        {children}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <OfflineIndicator />
      <InstallPWAPrompt />
      <ContentWrapper>
      <Suspense fallback={<LoadingScreen message="Chargement..." />}>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/auth/set-password" element={<SetPassword />} />
        <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              {profileTypeSelected ? (
                !onboardingCompleted ? (
                  <OnboardingWizard />
                ) : (
                  <ProfileRouter />
                )
              ) : loading ? (
                <LoadingScreen message="Chargement du profil..." />
              ) : (
                <Navigate to="/auth" replace />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              {profileType === 'maitre_nageur' ? <Profile /> : <ProfileRouter />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer-profile"
          element={
            <ProtectedRoute>
              {profileType === 'formateur' ? <TrainerProfile /> : <ProfileRouter />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/establishment-profile"
          element={
            <ProtectedRoute>
              {profileType === 'etablissement' ? <EstablishmentProfile /> : <ProfileRouter />}
            </ProtectedRoute>
          }
        />
        <Route path="/establishment-profile/announcements" element={<ProtectedRoute><EstablishmentAnnouncements /></ProtectedRoute>} />
        <Route path="/establishment-profile/rescuers" element={<ProtectedRoute><EstablishmentRescuers /></ProtectedRoute>} />
        <Route path="/establishment-profile/mail" element={<ProtectedRoute><EstablishmentMailbox /></ProtectedRoute>} />
        <Route path="/trainer-profile/students" element={<ProtectedRoute><TrainerStudents /></ProtectedRoute>} />
        <Route path="/trainer-profile/mail" element={<ProtectedRoute><Mailbox /></ProtectedRoute>} />
        <Route path="/rescuer/mail" element={<ProtectedRoute><Mailbox /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
        <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/flux" element={<ProtectedRoute><Flux /></ProtectedRoute>} />
        <Route path="/add-formation" element={<ProtectedRoute><AddFormation /></ProtectedRoute>} />
        <Route path="/add-experience" element={<ProtectedRoute><AddExperience /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      </ContentWrapper>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24, // 24 heures
        }}
      >
        <ProfileProvider>
          <AppRoutes />
        </ProfileProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
