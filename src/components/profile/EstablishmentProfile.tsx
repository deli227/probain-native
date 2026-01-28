import { ProfileHeader } from "./ProfileHeader";
import { ProfileStats } from "./ProfileStats";
import { ProfileCompletion } from "./ProfileCompletion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EstablishmentProfileForm } from "./forms/EstablishmentProfileForm";
import { JobPostings } from "./EstablishmentJobPostings";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/contexts/ProfileContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { logger } from "@/utils/logger";

interface EstablishmentFormValues {
  organization: {
    name: string;
    website?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    linkedinUrl?: string;
  };
  address: {
    street?: string;
    cityZip?: string;
    canton?: string;
  };
}

const EstablishmentProfile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Utiliser les données du context (déjà en cache!)
  const {
    loading: contextLoading,
    baseProfile,
    establishmentProfile,
    refreshProfile
  } = useProfile();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Charger les stats (jobs count, applications count)
  const { data: stats = { jobsCount: 0, applicationsCount: 0 } } = useQuery({
    queryKey: ['establishment-stats', establishmentProfile?.id],
    queryFn: async () => {
      if (!establishmentProfile?.id) return { jobsCount: 0, applicationsCount: 0 };

      // Fetch jobs count
      const { count: jobs } = await supabase
        .from('job_postings')
        .select('*', { count: 'exact', head: true })
        .eq('establishment_id', establishmentProfile.id);

      // Fetch applications count
      const { data: jobIds } = await supabase
        .from('job_postings')
        .select('id')
        .eq('establishment_id', establishmentProfile.id);

      let applicationsCount = 0;
      if (jobIds && jobIds.length > 0) {
        const { count: applications } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .in('job_posting_id', jobIds.map(j => j.id));

        applicationsCount = applications || 0;
      }

      return { jobsCount: jobs || 0, applicationsCount };
    },
    enabled: !!establishmentProfile?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Rediriger si pas authentifié
  useEffect(() => {
    if (!contextLoading && !baseProfile) {
      navigate('/auth');
    }
  }, [contextLoading, baseProfile, navigate]);

  // Afficher le loading seulement si on n'a vraiment pas de données
  if (contextLoading && !baseProfile) {
    return <ProfileSkeleton />;
  }

  if (!baseProfile || !establishmentProfile) {
    return <ProfileSkeleton />;
  }

  const handleAvatarUpdate = async (url: string) => {
    try {
      const { error } = await supabase
        .from('establishment_profiles')
        .update({ avatar_url: url })
        .eq('id', establishmentProfile.id);

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
        description: "Une erreur est survenue lors de la mise à jour de l'avatar",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: EstablishmentFormValues) => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('establishment_profiles')
        .update({
          organization_name: values.organization.name,
          website: values.organization.website,
          facebook_url: values.organization.facebookUrl,
          instagram_url: values.organization.instagramUrl,
          linkedin_url: values.organization.linkedinUrl,
          street: values.address.street,
          city_zip: values.address.cityZip,
          canton: values.address.canton,
          updated_at: new Date().toISOString()
        })
        .eq('id', establishmentProfile.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès",
      });
      setSheetOpen(false);
    } catch (error) {
      logger.error('Error updating establishment profile:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du profil",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark pb-20 md:pb-6">
      <ProfileHeader
        firstName={establishmentProfile.organization_name || ""}
        lastName=""
        address={{
          street: establishmentProfile.street || "",
          cityZip: establishmentProfile.city_zip || "",
          canton: establishmentProfile.canton || ""
        }}
        website={establishmentProfile.website}
        facebookUrl={establishmentProfile.facebook_url}
        instagramUrl={establishmentProfile.instagram_url}
        linkedinUrl={establishmentProfile.linkedin_url}
        avatarUrl={establishmentProfile.avatar_url || "/placeholder.svg"}
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
                <SheetTitle className="text-xl font-bold text-white">Modifier le profil établissement</SheetTitle>
              </SheetHeader>
              <div className="p-6 space-y-6">
                <EstablishmentProfileForm
                  onSubmit={onSubmit}
                  defaultValues={{
                    organization: {
                      name: establishmentProfile.organization_name || "",
                      website: establishmentProfile.website || "",
                      facebookUrl: establishmentProfile.facebook_url || "",
                      instagramUrl: establishmentProfile.instagram_url || "",
                      linkedinUrl: establishmentProfile.linkedin_url || "",
                    },
                    address: {
                      street: establishmentProfile.street || "",
                      cityZip: establishmentProfile.city_zip || "",
                      canton: establishmentProfile.canton || ""
                    }
                  }}
                  isSubmitting={isSubmitting}
                />
              </div>
            </SheetContent>
          </Sheet>
        }
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <ProfileStats
          stats={[
            { label: "Annonces", value: stats.jobsCount, icon: "jobs" },
            { label: "Candidatures", value: stats.applicationsCount, icon: "applications" },
          ]}
        />

        <ProfileCompletion
          items={[
            { label: "Photo de profil", completed: !!establishmentProfile.avatar_url },
            { label: "Nom organisation", completed: !!establishmentProfile.organization_name },
            { label: "Adresse", completed: !!establishmentProfile.street || !!establishmentProfile.city_zip },
            { label: "Canton", completed: !!establishmentProfile.canton },
            { label: "Site web", completed: !!establishmentProfile.website },
            { label: "Réseaux sociaux", completed: !!establishmentProfile.facebook_url || !!establishmentProfile.instagram_url || !!establishmentProfile.linkedin_url },
          ]}
          className="mt-6"
        />

        <JobPostings establishmentId={establishmentProfile.id} />
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
                <SheetTitle className="text-xl font-bold text-white">Modifier le profil établissement</SheetTitle>
              </SheetHeader>
              <div className="p-6 space-y-6">
                <EstablishmentProfileForm
                  onSubmit={onSubmit}
                  defaultValues={{
                    organization: {
                      name: establishmentProfile.organization_name || "",
                      website: establishmentProfile.website || "",
                      facebookUrl: establishmentProfile.facebook_url || "",
                      instagramUrl: establishmentProfile.instagram_url || "",
                      linkedinUrl: establishmentProfile.linkedin_url || "",
                    },
                    address: {
                      street: establishmentProfile.street || "",
                      cityZip: establishmentProfile.city_zip || "",
                      canton: establishmentProfile.canton || ""
                    }
                  }}
                  isSubmitting={isSubmitting}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default EstablishmentProfile;
