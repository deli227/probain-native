import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ProfileSkeleton } from "@/components/skeletons";

const AddFormation = lazy(() => import("@/pages/AddFormation"));
const AddExperience = lazy(() => import("@/pages/AddExperience"));
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { RescuerProfileHeader } from "@/components/profile/RescuerProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileCompletion } from "@/components/profile/ProfileCompletion";
import { ExperienceCarousel } from "@/components/profile/ExperienceCarousel";
import { FormationCarousel } from "@/components/profile/FormationCarousel";
import { AvailabilitySection } from "@/components/profile/AvailabilitySection";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { useAvailabilities } from "@/hooks/use-availabilities";
import { useProfile } from "@/contexts/ProfileContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { fetchAvailabilities } = useAvailabilities();

  // Utiliser les données du context (déjà en cache!)
  const {
    profileType,
    loading: contextLoading,
    baseProfile,
    rescuerProfile,
    refreshProfile,
    updateProfileOptimistic
  } = useProfile();

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showSpecificDates, setShowSpecificDates] = useState(false);
  const [isAlwaysAvailable, setIsAlwaysAvailable] = useState(false);
  const [isActuallyAvailableToday, setIsActuallyAvailableToday] = useState(false);
  const [userAvailabilityDates, setUserAvailabilityDates] = useState<Date[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showAddFormation, setShowAddFormation] = useState(false);
  const [showAddExperience, setShowAddExperience] = useState(false);

  // Écouter l'événement personnalisé pour ouvrir le Sheet
  useEffect(() => {
    const handleOpenProfileEdit = () => {
      setIsSheetOpen(true);
    };

    window.addEventListener('openProfileEdit', handleOpenProfileEdit);
    return () => {
      window.removeEventListener('openProfileEdit', handleOpenProfileEdit);
    };
  }, []);

  // Ouvrir automatiquement le Sheet si state.openEdit est true (navigation depuis une autre page)
  useEffect(() => {
    if (location.state?.openEdit) {
      setIsSheetOpen(true);
      // Nettoyer le state pour éviter la réouverture
      navigate('/profile', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Déterminer si c'est le profil de l'utilisateur actuel
  const isOwnProfile = !id || id === baseProfile?.id;

  // Charger les formations (brevets/certifications)
  const { data: formations = [] } = useQuery({
    queryKey: ['formations', baseProfile?.id],
    queryFn: async () => {
      if (!baseProfile?.id) return [];
      const { data, error } = await supabase
        .from('formations')
        .select('*')
        .eq('user_id', baseProfile.id)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!baseProfile?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Charger les expériences
  const { data: experiences = [] } = useQuery({
    queryKey: ['experiences', baseProfile?.id],
    queryFn: async () => {
      if (!baseProfile?.id) return [];
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', baseProfile.id)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!baseProfile?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Rediriger si pas authentifié ou mauvais type de profil
  useEffect(() => {
    if (!contextLoading && !baseProfile) {
      navigate('/auth');
      return;
    }

    if (!contextLoading && baseProfile && !baseProfile.onboarding_completed) {
      navigate('/onboarding');
      return;
    }
  }, [contextLoading, baseProfile, navigate]);

  // Initialiser les états de disponibilité depuis les données du context
  useEffect(() => {
    if (rescuerProfile) {
      if (rescuerProfile.availability_status !== null) {
        setIsAvailable(rescuerProfile.availability_status);
      }
      if (rescuerProfile.is_always_available !== null) {
        setIsAlwaysAvailable(rescuerProfile.is_always_available);
      }
    }
  }, [rescuerProfile]);

  // Charger les disponibilités spécifiques et calculer la disponibilité du jour
  useEffect(() => {
    const loadAvailabilitiesAndCalculateToday = async () => {
      if (!rescuerProfile || !baseProfile?.id) return;

      const dates = await fetchAvailabilities(baseProfile.id);
      setUserAvailabilityDates(dates);

      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      let availableToday = false;

      if (rescuerProfile.is_always_available) {
        availableToday = true;
      } else if (!rescuerProfile.availability_status) {
        availableToday = false;
      } else if (rescuerProfile.availability_status && !rescuerProfile.is_always_available) {
        availableToday = dates.some(date => {
          const dateString = date.toISOString().split('T')[0];
          return dateString === todayString;
        });
      }

      setIsActuallyAvailableToday(availableToday);
    };

    loadAvailabilitiesAndCalculateToday();
  }, [rescuerProfile, baseProfile?.id, fetchAvailabilities]);

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    if (!baseProfile?.id) return;

    try {
      const { error } = await supabase
        .from('rescuer_profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', baseProfile.id);

      if (error) throw error;

      // Rafraîchir le profil pour mettre à jour le cache
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

  const toggleAvailability = async () => {
    if (!baseProfile?.id) return;

    const newAvailabilityStatus = !isAvailable;
    setIsAvailable(newAvailabilityStatus);

    try {
      const { error } = await supabase
        .from('rescuer_profiles')
        .update({
          availability_status: newAvailabilityStatus,
          ...(newAvailabilityStatus === false && { is_always_available: false })
        })
        .eq('id', baseProfile.id);

      if (error) {
        setIsAvailable(!newAvailabilityStatus);
        throw error;
      }

      toast({
        title: "Statut mis à jour",
        description: newAvailabilityStatus ? "Vous êtes maintenant disponible" : "Vous êtes maintenant indisponible",
      });

      if (!newAvailabilityStatus) {
        setIsActuallyAvailableToday(false);
      }

      // Rafraîchir le profil
      refreshProfile();
    } catch (error) {
      logger.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre statut de disponibilité",
        variant: "destructive",
      });
    }

    if (!newAvailabilityStatus) {
      setShowSpecificDates(false);
      setSelectedDates([]);
      setIsAlwaysAvailable(false);
    }
  };

  const toggleAlwaysAvailable = async () => {
    if (!baseProfile?.id) return;

    const newIsAlwaysAvailable = !isAlwaysAvailable;
    setIsAlwaysAvailable(newIsAlwaysAvailable);

    try {
      const { error } = await supabase
        .from('rescuer_profiles')
        .update({
          is_always_available: newIsAlwaysAvailable,
          ...(newIsAlwaysAvailable && { availability_status: true })
        })
        .eq('id', baseProfile.id);

      if (error) {
        setIsAlwaysAvailable(!newIsAlwaysAvailable);
        throw error;
      }

      toast({
        title: "Disponibilité mise à jour",
        description: newIsAlwaysAvailable ? "Vous êtes disponible tout le temps" : "Disponibilités spécifiques activées",
      });

      if (newIsAlwaysAvailable) {
        setIsActuallyAvailableToday(true);
      }

      refreshProfile();
    } catch (error) {
      logger.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre disponibilité",
        variant: "destructive",
      });
    }

    if (newIsAlwaysAvailable) {
      setSelectedDates([]);
      setIsAvailable(true);
    } else {
      setShowSpecificDates(false);
    }
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
    setSelectedDates(dates || []);
  };

  const handleSpecificDatesToggle = async () => {
    if (!baseProfile?.id) return;

    const newShowSpecificDates = !showSpecificDates;
    setShowSpecificDates(newShowSpecificDates);

    if (newShowSpecificDates) {
      setIsAlwaysAvailable(false);
      setIsAvailable(true);

      try {
        const { error } = await supabase
          .from('rescuer_profiles')
          .update({
            is_always_available: false,
            availability_status: true,
          })
          .eq('id', baseProfile.id);

        if (error) {
          setShowSpecificDates(false);
          throw error;
        }
      } catch (error) {
        logger.error("Erreur:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'activer les dates spécifiques",
          variant: "destructive",
        });
      }
    } else {
      setSelectedDates([]);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleProfileUpdated = async () => {
    await refreshProfile();
    // Invalider aussi les formations et expériences
    queryClient.invalidateQueries({ queryKey: ['formations', baseProfile?.id] });
    queryClient.invalidateQueries({ queryKey: ['experiences', baseProfile?.id] });
  };

  // Afficher le skeleton seulement si on n'a vraiment pas de données
  if (contextLoading && !baseProfile) {
    return <ProfileSkeleton />;
  }

  // Si pas de données après le loading, afficher le skeleton (redirection en cours)
  if (!baseProfile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-primary-dark md:bg-transparent pb-20 md:pb-6">
      <div className="relative max-w-[1920px] mx-auto">
        {isOwnProfile && (
          <div className="absolute top-3 right-3 z-10">
            <div
              className="group relative cursor-pointer"
              onClick={toggleAvailability}
            >
              <div
                className={`
                  w-4 h-4 rounded-full
                  ${isActuallyAvailableToday
                    ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]'
                    : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                  }
                  transition-all duration-300
                  group-hover:scale-125
                  group-hover:shadow-[0_0_15px_rgba(34,197,94,0.8)]
                  ${!isActuallyAvailableToday && 'group-hover:shadow-[0_0_15px_rgba(239,68,68,0.8)]'}
                `}
              />
              <div
                className={`
                  absolute inset-0 rounded-full
                  ${isActuallyAvailableToday ? 'bg-green-500' : 'bg-red-500'}
                  animate-ping opacity-30
                `}
              />
              <div className="absolute right-0 top-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className={`
                  whitespace-nowrap px-2 py-1 rounded text-xs font-medium text-white
                  ${isActuallyAvailableToday ? 'bg-green-600' : 'bg-red-600'}
                  shadow-lg
                `}>
                  {isActuallyAvailableToday ? 'Disponible aujourd\'hui' : 'Indisponible aujourd\'hui'}
                </div>
              </div>
            </div>
          </div>
        )}

        <RescuerProfileHeader
          firstName={rescuerProfile?.first_name || baseProfile?.first_name || ""}
          lastName={rescuerProfile?.last_name || baseProfile?.last_name || ""}
          age={baseProfile?.birth_date ? calculateAge(baseProfile.birth_date) : undefined}
          biography={baseProfile?.biography || ""}
          address={{
            street: baseProfile?.street || "",
            cityZip: baseProfile?.city_zip || "",
            canton: baseProfile?.canton || ""
          }}
          avatarUrl={rescuerProfile?.avatar_url || "/placeholder.svg"}
          onAvatarUpdate={isOwnProfile ? handleAvatarUpdate : undefined}
          certifications={[]}
          phone={baseProfile?.phone}
          phoneVisible={rescuerProfile?.phone_visible}
          viewerIsEstablishment={profileType === 'etablissement'}
          actionButton={isOwnProfile ? (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-primary font-bold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  MODIFIER
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto bg-[#0a1628] w-full sm:max-w-xl p-0" closeButtonColor="white" onOpenAutoFocus={(e) => e.preventDefault()}>
                <SheetHeader className="sticky top-0 z-20 space-y-1 bg-gradient-to-r from-primary to-primary-light p-5 text-white shadow-lg">
                  <SheetTitle className="text-xl font-bold text-white">Modifier le profil</SheetTitle>
                  <SheetDescription className="text-white/80 text-sm">
                    Personnalisez vos informations
                  </SheetDescription>
                </SheetHeader>
                <div className="p-6">
                <ProfileForm
                  defaultValues={{
                    firstName: rescuerProfile?.first_name || baseProfile?.first_name || "",
                    lastName: rescuerProfile?.last_name || baseProfile?.last_name || "",
                    biography: baseProfile?.biography || "",
                    birthDate: baseProfile?.birth_date ? new Date(baseProfile.birth_date) : undefined,
                    address: {
                      street: baseProfile?.street || "",
                      cityZip: baseProfile?.city_zip || "",
                      canton: baseProfile?.canton || ""
                    },
                    phone: baseProfile?.phone || "",
                    phoneVisible: rescuerProfile?.phone_visible || false
                  }}
                  onProfileUpdated={handleProfileUpdated}
                  onSaveComplete={() => setIsSheetOpen(false)}
                />
                </div>
              </SheetContent>
            </Sheet>
          ) : undefined}
        />

        <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8">
          {/* Desktop: layout 2 colonnes */}
          <div className="md:flex md:gap-8 md:mt-8">
            {/* Colonne gauche desktop: stats + completion */}
            <div className="md:w-80 md:flex-shrink-0">
              <ProfileStats
                stats={[
                  { label: "Formations", value: formations.length, icon: "certifications" },
                  { label: "Expériences", value: experiences.length, icon: "experience" },
                ]}
              />

              {isOwnProfile && (
                <ProfileCompletion
                  items={[
                    { label: "Photo de profil", completed: !!rescuerProfile?.avatar_url },
                    { label: "Prénom", completed: !!(rescuerProfile?.first_name || baseProfile?.first_name) },
                    { label: "Nom", completed: !!(rescuerProfile?.last_name || baseProfile?.last_name) },
                    { label: "Biographie", completed: !!baseProfile?.biography },
                    { label: "Canton", completed: !!baseProfile?.canton },
                    { label: "Formations", completed: formations.length > 0 },
                  ]}
                  className="mt-6"
                />
              )}
            </div>

            {/* Colonne droite desktop: contenu principal */}
            <div className="md:flex-1 md:min-w-0">
              <ExperienceCarousel onAddClick={() => setShowAddExperience(true)} />
              <FormationCarousel onAddClick={() => setShowAddFormation(true)} />

              {isOwnProfile && (
                <AvailabilitySection
                  isAvailable={isAvailable}
                  isAlwaysAvailable={isAlwaysAvailable}
                  showSpecificDates={showSpecificDates}
                  selectedDates={selectedDates}
                  toggleAvailability={toggleAvailability}
                  toggleAlwaysAvailable={toggleAlwaysAvailable}
                  handleSpecificDatesToggle={handleSpecificDatesToggle}
                  handleDateSelect={handleDateSelect}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlays Add Formation / Experience - rendus dans Profile pour éviter le démontage */}
      {showAddFormation && (
        <Suspense fallback={null}>
          <AddFormation
            onClose={() => setShowAddFormation(false)}
            onSuccess={() => setShowAddFormation(false)}
          />
        </Suspense>
      )}
      {showAddExperience && (
        <Suspense fallback={null}>
          <AddExperience
            onClose={() => setShowAddExperience(false)}
            onSuccess={() => setShowAddExperience(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Profile;
