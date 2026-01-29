import { memo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, UserPen, X, LogOut } from "lucide-react";
import { LOGO_PATH } from "@/utils/constants";
import { NotificationsPopup } from "@/components/shared/NotificationsPopup";
import { useRescuerNotifications } from "@/hooks/use-rescuer-notifications";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useFluxNotifications } from "@/hooks/useFluxNotifications";
import { useRecyclingReminders } from "@/hooks/use-recycling-reminders";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MobileHeaderProps {
  profileType: 'maitre_nageur' | 'formateur' | 'etablissement';
}

export const MobileHeader = memo(({ profileType }: MobileHeaderProps) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Hooks pour notifications
  const {
    counts,
    markFormationsAsSeen,
    markJobsAsSeen,
    markAllAsSeen,
  } = useRescuerNotifications();
  const { unreadCount: unreadMessages } = useUnreadMessages();
  const { newPostsCount, markAsSeen: markFluxAsSeen } = useFluxNotifications();
  const { expiredCount: recyclingExpiredCount, expiringSoonCount: recyclingExpiringSoonCount, reminderCount: recyclingReminderCount } = useRecyclingReminders();

  // Préférences de notifications (pour toggle recyclage)
  const [userId, setUserId] = useState<string | undefined>();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, []);
  const { preferences } = useNotificationPreferences(userId);

  // Route du profil selon le type
  const getProfileRoute = () => {
    switch (profileType) {
      case 'maitre_nageur': return '/profile';
      case 'formateur': return '/trainer-profile';
      case 'etablissement': return '/establishment-profile';
      default: return '/profile';
    }
  };

  // Handler pour modifier le profil
  const handleEditProfile = () => {
    setIsSettingsOpen(false);
    const profileRoute = getProfileRoute();

    // Si on est déjà sur la page profil, déclencher un événement personnalisé
    if (location.pathname === profileRoute) {
      window.dispatchEvent(new CustomEvent('openProfileEdit'));
    } else {
      // Sinon, naviguer vers la page profil avec le state
      navigate(profileRoute, { state: { openEdit: true } });
    }
  };

  // Handler pour la déconnexion
  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsSettingsOpen(false);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Deconnexion reussie",
        description: "A bientot sur Probain !",
      });

      // Rediriger vers la page d'authentification
      navigate('/auth', { replace: true });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se deconnecter. Veuillez reessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Rendu du popup de notifications (composant unifie pour tous les profils)
  const renderNotificationsPopup = () => (
    <NotificationsPopup
      isOpen={isNotificationsOpen}
      onOpenChange={setIsNotificationsOpen}
      profileType={profileType}
      unreadMessages={unreadMessages}
      newFluxPosts={newPostsCount}
      onMarkFluxAsSeen={markFluxAsSeen}
      // Props Rescuer uniquement
      newFormationsCount={counts.formations}
      newJobsCount={counts.jobs}
      onMarkFormationsAsSeen={markFormationsAsSeen}
      onMarkJobsAsSeen={markJobsAsSeen}
      onMarkAllAsSeen={markAllAsSeen}
      recyclingExpiredCount={recyclingExpiredCount}
      recyclingExpiringSoonCount={recyclingExpiringSoonCount}
      recyclingReminderCount={recyclingReminderCount}
      notifyRecycling={preferences?.notify_recycling ?? true}
    />
  );

  return (
    <header className="bg-primary text-white md:hidden sticky top-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }} role="banner">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0" aria-label="Accueil Probain">
            <img
              src={LOGO_PATH}
              alt="Probain Logo"
              className="h-9 w-auto"
            />
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-1" role="toolbar" aria-label="Actions rapides">
            {/* Menu Settings - seulement Modifier mon profil */}
            <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-2 rounded-full hover:bg-primary-light transition-colors"
                  aria-label="Paramètres"
                  aria-expanded={isSettingsOpen}
                  aria-haspopup="dialog"
                >
                  <Settings className="h-5 w-5 text-white" aria-hidden="true" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-56 p-0 mr-2"
                align="end"
                sideOffset={8}
              >
                <div className="flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary to-primary-dark rounded-t-md">
                    <span className="font-semibold text-white text-sm">Parametres</span>
                    <button
                      onClick={() => setIsSettingsOpen(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Options */}
                  <div className="p-2 space-y-1">
                    {/* Modifier mon profil */}
                    <button
                      onClick={handleEditProfile}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-left"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-probain-yellow shadow-sm">
                        <UserPen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Modifier mon profil</p>
                        <p className="text-xs text-gray-500">Biographie, photo, infos</p>
                      </div>
                    </button>

                    {/* Separateur */}
                    <div className="border-t border-gray-100 my-2" />

                    {/* Deconnexion */}
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors text-left group"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 shadow-sm group-hover:bg-red-200 transition-colors">
                        <LogOut className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-red-600">
                          {isLoggingOut ? "Deconnexion..." : "Se deconnecter"}
                        </p>
                        <p className="text-xs text-gray-500">Quitter l'application</p>
                      </div>
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Cloche Notifications - visible */}
            {renderNotificationsPopup()}
          </div>
        </div>
      </div>
    </header>
  );
});

MobileHeader.displayName = "MobileHeader";
