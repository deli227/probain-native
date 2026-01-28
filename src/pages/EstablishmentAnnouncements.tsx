import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JobPostings } from "@/components/profile/EstablishmentJobPostings";
import { safeGetUser } from "@/utils/asyncHelpers";
import { LoadingScreen } from "@/components/shared/LoadingScreen";

const EstablishmentAnnouncements = () => {
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (user) {
        setEstablishmentId(user.id);
      }
    };

    fetchUser();
  }, []);

  if (!establishmentId) {
    return <LoadingScreen message="Chargement des annonces..." />;
  }

  return (
    <div className="min-h-screen bg-primary-dark">
      {/* Header */}
      <div className="bg-gradient-to-r from-probain-blue to-primary p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Mes Annonces</h1>
          <p className="text-white/70 text-sm mt-1">Gérez vos offres d'emploi</p>
        </div>
      </div>

      {/* Content avec padding */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <JobPostings establishmentId={establishmentId} />
      </div>
    </div>
  );
};

export default EstablishmentAnnouncements;