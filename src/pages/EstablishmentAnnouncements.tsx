import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JobPostings } from "@/components/profile/EstablishmentJobPostings";
import { safeGetUser } from "@/utils/asyncHelpers";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { Megaphone } from "lucide-react";

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
    <div className="min-h-screen bg-primary-dark pb-12 md:pb-0">
      {/* Header compact */}
      <div className="relative bg-gradient-to-br from-primary via-probain-blue to-primary-dark px-4 py-3 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-400/20 rounded-xl border border-white/10">
              <Megaphone className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">MES ANNONCES</h1>
              <p className="text-[11px] text-white/40">Gérez vos offres d'emploi</p>
            </div>
          </div>
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