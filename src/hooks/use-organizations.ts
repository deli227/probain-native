import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface Organization {
  id: string;
  organization_name: string;
  canton: string | null;
  city_zip: string | null;
}

/**
 * Hook pour récupérer la liste des organisations (formateurs) disponibles
 * Ces organisations proviennent de sss_formations_cache (données scrapées du site SSS)
 * et de trainer_profiles (formateurs qui ont créé un compte)
 */
export const useOrganizations = () => {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async (): Promise<Organization[]> => {
      try {
        // 1. Récupérer les organisations depuis sss_formations_cache (données scrapées)
        const { data: sssData, error: sssError } = await supabase
          .from("sss_formations_cache")
          .select("id, organisateur, lieu")
          .eq("active", true)
          .not("organisateur", "is", null);

        if (sssError) {
          logger.error("[useOrganizations] Erreur sss_formations_cache:", sssError);
        }

        // 2. Récupérer aussi les trainer_profiles (formateurs avec compte)
        const { data: trainerData, error: trainerError } = await supabase
          .from("trainer_profiles")
          .select("id, organization_name, canton, city_zip");

        if (trainerError) {
          logger.error("[useOrganizations] Erreur trainer_profiles:", trainerError);
        }

        // 3. Combiner et dédupliquer par nom d'organisation
        const uniqueOrgs = new Map<string, Organization>();

        // Ajouter les organisations SSS
        (sssData || []).forEach((item) => {
          if (item.organisateur && !uniqueOrgs.has(item.organisateur)) {
            uniqueOrgs.set(item.organisateur, {
              id: item.id.toString(),
              organization_name: item.organisateur,
              canton: null,
              city_zip: item.lieu || null,
            });
          }
        });

        // Ajouter/remplacer par les trainer_profiles (plus de détails)
        (trainerData || []).forEach((trainer) => {
          if (trainer.organization_name) {
            uniqueOrgs.set(trainer.organization_name, {
              id: trainer.id,
              organization_name: trainer.organization_name,
              canton: trainer.canton,
              city_zip: trainer.city_zip,
            });
          }
        });

        // Trier par nom
        const sortedOrgs = Array.from(uniqueOrgs.values()).sort((a, b) =>
          a.organization_name.localeCompare(b.organization_name, "fr")
        );

        logger.log(`[useOrganizations] ${sortedOrgs.length} organisations uniques trouvées`);
        logger.log("[useOrganizations] Sources: SSS=${sssData?.length || 0}, Trainers=${trainerData?.length || 0}");

        return sortedOrgs;
      } catch (error) {
        logger.error("[useOrganizations] Erreur fetch:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
