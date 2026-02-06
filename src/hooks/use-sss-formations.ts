import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface SSSFormation {
  id: string;
  titre: string;
  date: string;
  lieu: string;
  organisateur: string;
  places: string;
  placesColor?: 'red' | 'orange' | 'green' | 'gray';
  prix: string;
  source?: string;
  url?: string;
  raw?: boolean;
  description?: string;
}

export interface SSSFormationDetails {
  titre: string;
  description: string;
  date: string;
  lieu: string;
  prix: string;
  places: string;
  organisateur: string;
  prerequis: string;
  duree: string;
}

/**
 * Combine debut et fin en une seule chaîne de date lisible
 */
function formatDateRange(debut: string | null, fin: string | null): string {
  if (debut && fin && debut !== fin) {
    return `${debut} - ${fin}`;
  }
  return debut || fin || '';
}

/**
 * Hook pour récupérer les formations SSS depuis la table sss_formations_cache
 * Les données sont insérées par le scraper GitHub Actions (branche séparée)
 * Le filtrage est fait côté client dans Training.tsx
 */
export function useSSSFormations() {
  return useQuery({
    queryKey: ["sss-formations"],
    queryFn: async (): Promise<SSSFormation[]> => {
      logger.log("🔍 [Hook SSS] Query table sss_formations_cache...");

      const { data, error } = await supabase
        .from('sss_formations_cache')
        .select('*')
        .eq('active', true)
        .order('debut', { ascending: true });

      if (error) {
        logger.error("❌ [Hook SSS] Erreur query:", error);
        throw new Error("Impossible de récupérer les formations SSS.");
      }

      const formations: SSSFormation[] = (data || []).map(row => ({
        id: String(row.id),
        titre: row.titre,
        date: formatDateRange(row.debut, row.fin),
        lieu: row.lieu || '',
        organisateur: row.organisateur || '',
        places: row.places || '',
        placesColor: (row.places_color as SSSFormation['placesColor']) || undefined,
        prix: '',
        url: row.url || '',
      }));

      logger.log(`✅ [Hook SSS] ${formations.length} formations chargées depuis la table`);
      return formations;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook pour récupérer les détails d'une formation SSS
 * Note: Pour l'instant, retourne les infos de base car le scraping détaillé
 * nécessiterait une Edge Function supplémentaire
 */
export function useSSSFormationDetails(id: string, formationUrl: string) {
  return useQuery({
    queryKey: ["sss-formation-details", id],
    queryFn: async (): Promise<SSSFormationDetails> => {
      return {
        titre: "Formation SSS",
        description: "Détails disponibles sur le site SSS",
        date: "",
        lieu: "",
        prix: "",
        places: "",
        organisateur: "Société Suisse de Sauvetage",
        prerequis: "Voir sur le site SSS",
        duree: "",
      };
    },
    enabled: !!id && !!formationUrl,
    staleTime: 1000 * 60 * 30,
  });
}
