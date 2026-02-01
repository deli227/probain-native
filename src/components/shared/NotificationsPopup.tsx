import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, Newspaper, GraduationCap, Briefcase, X, CheckCheck, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ProfileType = 'maitre_nageur' | 'formateur' | 'etablissement';

interface NotificationsPopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profileType: ProfileType;
  unreadMessages: number;
  newFluxPosts: number;
  onMarkFluxAsSeen: () => void;
  // Props optionnelles pour Rescuer uniquement
  newFormationsCount?: number;
  newJobsCount?: number;
  onMarkFormationsAsSeen?: () => Promise<void>;
  onMarkJobsAsSeen?: () => Promise<void>;
  onMarkAllAsSeen?: () => Promise<void>;
  // Alertes recyclage (Rescuer uniquement)
  recyclingExpiredCount?: number;
  recyclingExpiringSoonCount?: number;
  recyclingReminderCount?: number;
  notifyRecycling?: boolean;
  // Ne pas afficher le badge tant que les donnees ne sont pas chargees
  isNotificationsReady?: boolean;
}

// Routes de mail selon le type de profil
const MAIL_ROUTES: Record<ProfileType, string> = {
  maitre_nageur: '/rescuer/mail',
  formateur: '/trainer-profile/mail',
  etablissement: '/establishment-profile/mail',
};

export const NotificationsPopup = ({
  isOpen,
  onOpenChange,
  profileType,
  unreadMessages,
  newFluxPosts,
  onMarkFluxAsSeen,
  newFormationsCount = 0,
  newJobsCount = 0,
  onMarkFormationsAsSeen,
  onMarkJobsAsSeen,
  onMarkAllAsSeen,
  recyclingExpiredCount = 0,
  recyclingExpiringSoonCount = 0,
  recyclingReminderCount = 0,
  notifyRecycling = true,
  isNotificationsReady = true,
}: NotificationsPopupProps) => {
  const navigate = useNavigate();

  // Rescuer voit formations et jobs, les autres non
  const isRescuer = profileType === 'maitre_nageur';
  const totalRecyclingAlerts = recyclingExpiredCount + recyclingExpiringSoonCount + recyclingReminderCount;
  const effectiveRecyclingAlerts = notifyRecycling ? totalRecyclingAlerts : 0;

  // Calcul du total selon le type de profil
  const totalNotifications = isRescuer
    ? unreadMessages + newFluxPosts + newFormationsCount + newJobsCount + effectiveRecyclingAlerts
    : unreadMessages + newFluxPosts;

  const handleMailClick = () => {
    onOpenChange(false);
    navigate(MAIL_ROUTES[profileType]);
  };

  const handleFluxClick = () => {
    onMarkFluxAsSeen();
    onOpenChange(false);
    navigate("/flux");
  };

  const handleFormationsClick = async () => {
    if (onMarkFormationsAsSeen) {
      await onMarkFormationsAsSeen();
    }
    onOpenChange(false);
    navigate("/training");
  };

  const handleJobsClick = async () => {
    if (onMarkJobsAsSeen) {
      await onMarkJobsAsSeen();
    }
    onOpenChange(false);
    navigate("/jobs");
  };

  const handleMarkAllAsSeen = async () => {
    onMarkFluxAsSeen();
    if (isRescuer && onMarkAllAsSeen) {
      await onMarkAllAsSeen();
    }
  };

  // Pour Trainer/Establishment, on ne montre le bouton que si flux > 0
  // Pour Rescuer, on le montre si des notifs dismissibles existent (pas recyclage)
  const dismissibleNotifications = isRescuer
    ? unreadMessages + newFluxPosts + newFormationsCount + newJobsCount
    : newFluxPosts;
  const showMarkAllButton = dismissibleNotifications > 0;

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-full hover:bg-primary-light relative text-white">
          <Bell className="h-5 w-5 text-white" />
          {isNotificationsReady && totalNotifications > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-[18px] min-w-[18px] px-1 flex items-center justify-center bg-yellow-400 text-primary text-[10px] font-bold rounded-full border-2 border-primary leading-none">
              {totalNotifications > 99 ? '99+' : totalNotifications}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 mr-4"
        align="end"
        sideOffset={8}
      >
        <div className={`flex flex-col ${isRescuer ? 'max-h-[500px]' : 'max-h-[400px]'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary to-primary-dark">
            <h3 className="font-semibold text-white text-sm">
              Notifications {totalNotifications > 0 && `(${totalNotifications})`}
            </h3>
            <div className="flex items-center gap-2">
              {showMarkAllButton && (
                <button
                  onClick={handleMarkAllAsSeen}
                  className="text-white/80 hover:text-white transition-colors text-xs flex items-center gap-1"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => onOpenChange(false)}
                className="text-white hover:text-white/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {totalNotifications === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Aucune nouvelle notification
              </div>
            ) : (
              <>
                {/* Messages non lus */}
                {unreadMessages > 0 && (
                  <div
                    className="p-3 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors rounded-lg border border-red-200"
                    onClick={handleMailClick}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-500 text-white p-2 rounded-full">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-red-800">
                            {unreadMessages} message{unreadMessages > 1 ? 's' : ''} non lu{unreadMessages > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-red-600">
                            Cliquez pour voir
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-red-500 text-white text-xs">
                        New
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Nouvelles formations - Rescuer uniquement */}
                {isRescuer && newFormationsCount > 0 && (
                  <div
                    className="p-3 bg-green-50 hover:bg-green-100 cursor-pointer transition-colors rounded-lg border border-green-200"
                    onClick={handleFormationsClick}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500 text-white p-2 rounded-full">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-green-800">
                            {newFormationsCount} nouvelle{newFormationsCount > 1 ? 's' : ''} formation{newFormationsCount > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-green-600">
                            Cliquez pour voir
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-500 text-white text-xs">
                        New
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Alertes recyclage - Rescuer uniquement (masquées si désactivées) */}
                {isRescuer && notifyRecycling && totalRecyclingAlerts > 0 && (
                  <div
                    className="p-3 bg-orange-50 hover:bg-orange-100 cursor-pointer transition-colors rounded-lg border border-orange-200"
                    onClick={() => {
                      onOpenChange(false);
                      navigate("/profile");
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-500 text-white p-2 rounded-full">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-orange-800">
                            {recyclingExpiredCount > 0 && (
                              <>{recyclingExpiredCount} recyclage{recyclingExpiredCount > 1 ? 's' : ''} expiré{recyclingExpiredCount > 1 ? 's' : ''}</>
                            )}
                            {recyclingExpiredCount > 0 && recyclingExpiringSoonCount > 0 && ' · '}
                            {recyclingExpiringSoonCount > 0 && (
                              <>{recyclingExpiringSoonCount} à renouveler bientôt</>
                            )}
                            {(recyclingExpiredCount > 0 || recyclingExpiringSoonCount > 0) && recyclingReminderCount > 0 && ' · '}
                            {recyclingReminderCount > 0 && (
                              <>{recyclingReminderCount} rappel{recyclingReminderCount > 1 ? 's' : ''}</>
                            )}
                          </p>
                          <p className="text-xs text-orange-600">
                            Voir vos formations
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nouvelles offres d'emploi - Rescuer uniquement */}
                {isRescuer && newJobsCount > 0 && (
                  <div
                    className="p-3 bg-yellow-50 hover:bg-yellow-100 cursor-pointer transition-colors rounded-lg border border-yellow-200"
                    onClick={handleJobsClick}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-500 text-white p-2 rounded-full">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-yellow-800">
                            {newJobsCount} nouvelle{newJobsCount > 1 ? 's' : ''} offre{newJobsCount > 1 ? 's' : ''} d'emploi
                          </p>
                          <p className="text-xs text-yellow-600">
                            Cliquez pour voir
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500 text-white text-xs">
                        New
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Nouveaux posts flux */}
                {newFluxPosts > 0 && (
                  <div
                    className="p-3 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors rounded-lg border border-blue-200"
                    onClick={handleFluxClick}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500 text-white p-2 rounded-full">
                          <Newspaper className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-blue-800">
                            {newFluxPosts} nouveau{newFluxPosts > 1 ? 'x' : ''} post{newFluxPosts > 1 ? 's' : ''} dans le flux
                          </p>
                          <p className="text-xs text-blue-600">
                            Cliquez pour voir
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-blue-500 text-white text-xs">
                        New
                      </Badge>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
