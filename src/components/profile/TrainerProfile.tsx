import { ProfileHeader } from "./ProfileHeader";
import { ProfileStats } from "./ProfileStats";
import { ProfileCompletion } from "./ProfileCompletion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TrainerProfileForm } from "./forms/TrainerProfileForm";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { TrainerCourses } from "./TrainerCourses";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { useProfile } from "@/contexts/ProfileContext";
import { useQuery } from "@tanstack/react-query";
import { logger } from "@/utils/logger";

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

  // Utiliser les données du context (déjà en cache!)
  const {
    loading: contextLoading,
    baseProfile,
    trainerProfile,
    refreshProfile
  } = useProfile();

  const [sheetOpen, setSheetOpen] = useState(false);

  // Charger les stats (courses count, students count)
  const { data: stats = { coursesCount: 0, studentsCount: 0 } } = useQuery({
    queryKey: ['trainer-stats', baseProfile?.id],
    queryFn: async () => {
      if (!baseProfile?.id) return { coursesCount: 0, studentsCount: 0 };

      // Fetch courses count
      const { count: courses } = await supabase
        .from('formations')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', baseProfile.id);

      // Fetch unique students count
      const { data: formationsData } = await supabase
        .from('formations')
        .select('id')
        .eq('trainer_id', baseProfile.id);

      let studentsCount = 0;
      if (formationsData && formationsData.length > 0) {
        const { data: reservations } = await supabase
          .from('reservations')
          .select('user_id')
          .in('formation_id', formationsData.map(f => f.id));

        const uniqueStudents = new Set(reservations?.map(r => r.user_id) || []);
        studentsCount = uniqueStudents.size;
      }

      return { coursesCount: courses || 0, studentsCount };
    },
    enabled: !!baseProfile?.id,
    staleTime: 5 * 60 * 1000,
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
    <div className="min-h-screen bg-primary-dark pb-20 md:pb-6">
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
            <SheetContent className="overflow-y-auto bg-gray-100 w-full sm:max-w-xl p-0">
              <SheetHeader className="sticky top-0 z-10 space-y-1 bg-gradient-to-r from-primary to-primary-light p-5 text-white shadow-lg">
                <SheetTitle className="text-xl font-bold text-white">Modifier le profil formateur</SheetTitle>
              </SheetHeader>
              <div className="p-6 space-y-6">
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
        <ProfileStats
          stats={[
            { label: "Formations", value: stats.coursesCount, icon: "courses" },
            { label: "Étudiants", value: stats.studentsCount, icon: "students" },
            { label: "Certifications", value: trainerProfile?.certifications?.length || 0, icon: "certifications" },
          ]}
        />

        <ProfileCompletion
          items={[
            { label: "Photo de profil", completed: !!trainerProfile?.avatar_url },
            { label: "Nom organisation", completed: !!trainerProfile?.organization_name },
            { label: "Description", completed: !!trainerProfile?.description },
            { label: "Certifications", completed: (trainerProfile?.certifications?.length || 0) > 0 },
            { label: "Site web", completed: !!trainerProfile?.website },
            { label: "Canton", completed: !!trainerProfile?.canton || !!baseProfile?.canton },
          ]}
          className="mt-6"
        />

        <TrainerCourses />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-primary to-transparent md:hidden">
        <div className="max-w-7xl mx-auto">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-primary font-bold rounded-full transition-colors duration-200 shadow-lg"
              >
                MODIFIER PROFIL
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto bg-gray-100 w-full sm:max-w-xl p-0">
              <SheetHeader className="sticky top-0 z-10 space-y-1 bg-gradient-to-r from-primary to-primary-light p-5 text-white shadow-lg">
                <SheetTitle className="text-xl font-bold text-white">Modifier le profil formateur</SheetTitle>
              </SheetHeader>
              <div className="p-6 space-y-6">
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
        </div>
      </div>
    </div>
  );
};

export default TrainerProfile;
