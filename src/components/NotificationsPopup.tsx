import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap, ArrowRight, X, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { safeGetUser } from "@/utils/asyncHelpers";

interface NotificationsPopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  // Nouvelles props pour le système de notifications
  newFormationsCount?: number;
  newJobsCount?: number;
  onMarkFormationsAsSeen?: () => Promise<void>;
  onMarkJobsAsSeen?: () => Promise<void>;
  onMarkAllAsSeen?: () => Promise<void>;
}

interface JobPosting {
  id: string;
  title: string;
  location: string;
  created_at: string;
}

interface Formation {
  id: number;
  titre: string;
  lieu: string;
  created_at: string;
}

export const NotificationsPopup = ({
  isOpen,
  onOpenChange,
  children,
  newFormationsCount = 0,
  newJobsCount = 0,
  onMarkFormationsAsSeen,
  onMarkJobsAsSeen,
  onMarkAllAsSeen,
}: NotificationsPopupProps) => {
  const navigate = useNavigate();
  const [newJobs, setNewJobs] = useState<JobPosting[]>([]);
  const [newFormations, setNewFormations] = useState<Formation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNewNotifications();
    }
  }, [isOpen]);

  const fetchNewNotifications = async () => {
    setIsLoading(true);
    try {
      // Récupérer le statut de notification de l'utilisateur
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: status } = await supabase
        .from('user_notification_status')
        .select('last_seen_formations_at, last_seen_jobs_at')
        .eq('user_id', user.id)
        .single();

      // IMPORTANT: Si pas de statut, utiliser NOW() comme fallback
      // NE PAS utiliser Date(0) car cela compterait TOUTES les formations comme "nouvelles"
      const now = new Date().toISOString();
      const lastSeenFormations = status?.last_seen_formations_at || now;
      const lastSeenJobs = status?.last_seen_jobs_at || now;

      // Récupérer les nouvelles offres d'emploi
      const { data: jobsData } = await supabase
        .from("job_postings")
        .select("id, title, location, created_at")
        .gt("created_at", lastSeenJobs)
        .order("created_at", { ascending: false })
        .limit(5);

      if (jobsData) {
        setNewJobs(jobsData);
      }

      // Récupérer les nouvelles formations
      const { data: formationsData } = await supabase
        .from("sss_formations_cache")
        .select("id, titre, lieu, created_at")
        .eq("active", true)
        .gt("created_at", lastSeenFormations)
        .order("created_at", { ascending: false })
        .limit(5);

      if (formationsData) {
        setNewFormations(formationsData);
      }
    } catch {
      // Erreur silencieuse - les notifications s'afficheront à 0
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "Il y a moins d'une heure";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays === 1) return "Hier";
    return `Il y a ${diffInDays} jours`;
  };

  const handleJobClick = async () => {
    // Marquer les emplois comme vus avant de naviguer
    if (onMarkJobsAsSeen) {
      await onMarkJobsAsSeen();
    }
    onOpenChange(false);
    navigate("/jobs");
  };

  const handleFormationsClick = async () => {
    // Marquer les formations comme vues avant de naviguer
    if (onMarkFormationsAsSeen) {
      await onMarkFormationsAsSeen();
    }
    onOpenChange(false);
    navigate("/training");
  };

  const handleMarkAllAsSeen = async () => {
    if (onMarkAllAsSeen) {
      await onMarkAllAsSeen();
    }
    setNewJobs([]);
    setNewFormations([]);
  };

  const totalNotifications = newFormationsCount + newJobsCount;

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 mr-4"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary to-primary-dark">
            <h3 className="font-semibold text-white text-sm">
              Notifications {totalNotifications > 0 && `(${totalNotifications})`}
            </h3>
            <div className="flex items-center gap-2">
              {totalNotifications > 0 && (
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
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Chargement...
              </div>
            ) : totalNotifications === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Aucune nouvelle notification
              </div>
            ) : (
              <>
                {/* Nouvelles formations */}
                {newFormationsCount > 0 && (
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
                    {/* Aperçu des formations */}
                    {newFormations.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {newFormations.slice(0, 2).map((formation) => (
                          <div key={formation.id} className="text-xs text-green-700 truncate pl-11">
                            • {formation.titre}
                          </div>
                        ))}
                        {newFormationsCount > 2 && (
                          <div className="text-xs text-green-600 pl-11">
                            + {newFormationsCount - 2} autre{newFormationsCount - 2 > 1 ? 's' : ''}...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Nouvelles offres d'emploi */}
                {newJobsCount > 0 && (
                  <div
                    className="p-3 bg-yellow-50 hover:bg-yellow-100 cursor-pointer transition-colors rounded-lg border border-yellow-200"
                    onClick={handleJobClick}
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
                    {/* Aperçu des emplois */}
                    {newJobs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {newJobs.slice(0, 2).map((job) => (
                          <div key={job.id} className="text-xs text-yellow-700 truncate pl-11">
                            • {job.title} - {job.location}
                          </div>
                        ))}
                        {newJobsCount > 2 && (
                          <div className="text-xs text-yellow-600 pl-11">
                            + {newJobsCount - 2} autre{newJobsCount - 2 > 1 ? 's' : ''}...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Liens rapides si pas de nouvelles notifications */}
                {newFormationsCount === 0 && newJobsCount === 0 && (
                  <>
                    <div
                      className="p-2 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors rounded border border-gray-200"
                      onClick={handleFormationsClick}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-gray-600" />
                          <p className="text-xs text-gray-700">Voir les formations</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                    </div>
                    <div
                      className="p-2 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors rounded border border-gray-200"
                      onClick={handleJobClick}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gray-600" />
                          <p className="text-xs text-gray-700">Voir les offres d'emploi</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
