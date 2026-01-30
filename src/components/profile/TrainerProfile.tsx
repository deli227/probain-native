import { ProfileHeader } from "./ProfileHeader";
import { ProfileStats } from "./ProfileStats";
import { ProfileCompletion } from "./ProfileCompletion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TrainerProfileForm } from "./forms/TrainerProfileForm";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { useProfile } from "@/contexts/ProfileContext";
import { useQuery } from "@tanstack/react-query";
import { logger } from "@/utils/logger";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, MapPin } from "lucide-react";

interface TrainerProfileUpdateValues {
  biography?: string;
  address?: {
    canton?: string;
    street?: string;
    cityZip?: string;
  };
  organization: {
    name: string;
    region?: string;
    website?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    linkedinUrl?: string;
    description?: string;
    certifications?: string[];
  };
}

const TrainerProfile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Utiliser les données du context (déjà en cache!)
  const {
    loading: contextLoading,
    baseProfile,
    trainerProfile,
    refreshProfile
  } = useProfile();

  const [sheetOpen, setSheetOpen] = useState(false);

  // Ouvrir le sheet d'édition via l'événement openProfileEdit (gear icon)
  useEffect(() => {
    const handleOpenEdit = () => setSheetOpen(true);
    window.addEventListener('openProfileEdit', handleOpenEdit);
    return () => window.removeEventListener('openProfileEdit', handleOpenEdit);
  }, []);

  // Ouvrir le sheet si navigué avec state openEdit: true
  useEffect(() => {
    if (location.state?.openEdit) {
      setSheetOpen(true);
      // Nettoyer le state pour éviter de réouvrir au retour
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openEdit]);

  // Charger le nombre d'élèves depuis trainer_students
  const { data: studentsCount = 0 } = useQuery({
    queryKey: ['trainer-students-count', baseProfile?.id],
    queryFn: async () => {
      if (!baseProfile?.id) return 0;

      const { count } = await supabase
        .from('trainer_students')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', baseProfile.id);

      return count || 0;
    },
    enabled: !!baseProfile?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Charger les formations à venir depuis sss_formations_cache
  const { data: upcomingFormations = [] } = useQuery({
    queryKey: ['trainer-upcoming-formations', trainerProfile?.organization_name],
    queryFn: async () => {
      if (!trainerProfile?.organization_name) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('sss_formations_cache')
        .select('id, titre, debut, fin, lieu, places_status, places_color, url')
        .eq('organisateur', trainerProfile.organization_name)
        .eq('active', true)
        .gte('debut', today)
        .order('debut', { ascending: true });
      return data || [];
    },
    enabled: !!trainerProfile?.organization_name,
    staleTime: 10 * 60 * 1000,
  });

  // Rediriger si pas authentifié
  useEffect(() => {
    if (!contextLoading && !baseProfile) {
      navigate('/auth');
    }
  }, [contextLoading, baseProfile, navigate]);

  const handleProfileUpdate = async (values: TrainerProfileUpdateValues) => {
    if (!baseProfile?.id) return;

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: baseProfile.id,
          biography: values.biography,
          canton: values.address?.canton,
          street: values.address?.street,
          city_zip: values.address?.cityZip,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      const { error: trainerError } = await supabase
        .from('trainer_profiles')
        .upsert({
          id: baseProfile.id,
          organization_name: values.organization.name,
          region: values.organization.region,
          website: values.organization.website,
          facebook_url: values.organization.facebookUrl,
          instagram_url: values.organization.instagramUrl,
          linkedin_url: values.organization.linkedinUrl,
          description: values.organization.description,
          certifications: values.organization.certifications,
          canton: values.address?.canton,
          updated_at: new Date().toISOString()
        });

      if (trainerError) throw trainerError;

      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès",
      });

      // Rafraîchir le profil
      await refreshProfile();
      setSheetOpen(false);
    } catch (error) {
      logger.error('Error updating trainer profile:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du profil",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    if (!baseProfile?.id) return;

    try {
      const { error } = await supabase
        .from('trainer_profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', baseProfile.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Succès",
        description: "Photo de profil mise à jour avec succès",
      });
    } catch (error) {
      logger.error('Error updating avatar:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de la photo de profil",
        variant: "destructive",
      });
    }
  };

  // Afficher le loading seulement si on n'a vraiment pas de données
  if (contextLoading && !baseProfile) {
    return <ProfileSkeleton />;
  }

  if (!baseProfile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-primary-dark md:bg-transparent pb-20 md:pb-6">
      <ProfileHeader
        firstName={trainerProfile?.organization_name || ""}
        lastName=""
        website={trainerProfile?.website}
        address={{
          street: baseProfile?.street || "",
          cityZip: baseProfile?.city_zip || "",
          canton: trainerProfile?.canton || baseProfile?.canton || ""
        }}
        facebookUrl={trainerProfile?.facebook_url}
        instagramUrl={trainerProfile?.instagram_url}
        linkedinUrl={trainerProfile?.linkedin_url}
        avatarUrl={trainerProfile?.avatar_url || "/placeholder.svg"}
        certifications={trainerProfile?.certifications || []}
        onAvatarUpdate={handleAvatarUpdate}
        actionButton={
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-primary font-bold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                MODIFIER PROFIL
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto bg-[#0a1628] w-full sm:max-w-xl p-0" closeButtonColor="white">
              <SheetHeader className="sticky top-0 z-10 space-y-1 bg-gradient-to-r from-primary to-primary-light p-5 text-white shadow-lg">
                <SheetTitle className="text-xl font-bold text-white">Modifier le profil formateur</SheetTitle>
              </SheetHeader>
              <div className="p-6">
                <TrainerProfileForm
                  onSubmit={handleProfileUpdate}
                  defaultValues={{
                    biography: baseProfile?.biography || "",
                    address: {
                      street: baseProfile?.street || "",
                      cityZip: baseProfile?.city_zip || "",
                      canton: trainerProfile?.canton || baseProfile?.canton || ""
                    },
                    organization: {
                      name: trainerProfile?.organization_name || "",
                      region: trainerProfile?.region || undefined,
                      website: trainerProfile?.website || "",
                      facebookUrl: trainerProfile?.facebook_url || "",
                      instagramUrl: trainerProfile?.instagram_url || "",
                      linkedinUrl: trainerProfile?.linkedin_url || "",
                      description: trainerProfile?.description || "",
                      certifications: trainerProfile?.certifications || []
                    }
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop: layout 2 colonnes */}
        <div className="md:flex md:gap-8 md:mt-8">
          {/* Colonne gauche: stats + completion */}
          <div className="md:w-80 md:flex-shrink-0">
            <ProfileStats
              stats={[
                { label: "Étudiants", value: studentsCount, icon: "students" },
              ]}
            />

            <ProfileCompletion
              items={[
                { label: "Photo de profil", completed: !!trainerProfile?.avatar_url },
                { label: "Nom organisation", completed: !!trainerProfile?.organization_name },
                { label: "Description", completed: !!trainerProfile?.description },
                { label: "Site web", completed: !!trainerProfile?.website },
                { label: "Canton", completed: !!trainerProfile?.canton || !!baseProfile?.canton },
              ]}
              className="mt-6"
            />
          </div>

          {/* Colonne droite: contenu */}
          <div className="md:flex-1 md:min-w-0">

        {/* Formations à venir */}
        {upcomingFormations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-white/80 font-semibold uppercase text-sm tracking-wider mb-4">
              Formations à venir
            </h3>
            <div className="space-y-3">
              {upcomingFormations.map((f) => {
                const formatDate = (dateStr: string | null) => {
                  if (!dateStr) return '';
                  try {
                    return format(new Date(dateStr), 'd MMM yyyy', { locale: fr });
                  } catch {
                    return dateStr;
                  }
                };

                const placesBadge = () => {
                  const colorMap: Record<string, string> = {
                    green: 'bg-green-100 text-green-700',
                    orange: 'bg-orange-100 text-orange-700',
                    red: 'bg-red-100 text-red-700',
                    gray: 'bg-gray-100 text-gray-500',
                  };
                  const labelMap: Record<string, string> = {
                    green: 'Disponible',
                    orange: 'Limité',
                    red: 'Complet',
                    gray: 'Indisponible',
                  };
                  const color = f.places_color || 'gray';
                  return (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${colorMap[color] || colorMap.gray}`}>
                      {labelMap[color] || 'Indisponible'}
                    </span>
                  );
                };

                return (
                  <div
                    key={f.id}
                    className="bg-white md:bg-white/10 md:backdrop-blur-sm md:border md:border-white/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => f.url && window.open(f.url, '_blank', 'noopener,noreferrer')}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 md:text-white truncate">{f.titre}</p>
                        {f.lieu && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <p className="text-sm text-gray-500 md:text-white/60 truncate">{f.lieu}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <p className="text-sm text-gray-400 md:text-white/50">
                            {formatDate(f.debut)}{f.fin && f.fin !== f.debut ? ` - ${formatDate(f.fin)}` : ''}
                          </p>
                        </div>
                      </div>
                      {placesBadge()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

          </div>
        </div>
      </div>

    </div>
  );
};

export default TrainerProfile;
