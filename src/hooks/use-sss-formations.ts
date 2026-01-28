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
  placesColor?: 'red' | 'orange' | 'green' | 'gray';  // Indicateur de disponibilite
  prix: string;
  source?: string;
  url?: string;
  raw?: boolean;
  description?: string;
}

export interface SSSFormationsResponse {
  success: boolean;
  formations: SSSFormation[];
  count: number;
  source: string;
  scrapedAt: string;
  error?: string;
  note?: string;
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
 * Helper pour ajouter un timeout à une promesse
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de la requête')), timeoutMs)
    ),
  ]);
}

/**
 * Hook pour récupérer les formations SSS via la Edge Function Supabase
 * React Query gère nativement la déduplication des requêtes et le cache
 */
export function useSSSFormations(filters?: { region?: string; type?: string }) {
  return useQuery({
    queryKey: ["sss-formations", filters],
    queryFn: async (): Promise<SSSFormation[]> => {
      logger.log("🔍 [Hook SSS] Appel Edge Function avec filtres:", filters);

      // Appeler la Edge Function Supabase avec timeout de 30 secondes
      const { data, error } = await withTimeout(
        supabase.functions.invoke("sss-scraper", {
          body: { filters },
        }),
        30000
      );

      if (error) {
        logger.error("❌ [Hook SSS] Erreur Edge Function:", error);
        throw new Error("Impossible de récupérer les formations SSS. Veuillez réessayer.");
      }

      logger.log("✅ [Hook SSS] Réponse reçue:", data);

      const response = data as SSSFormationsResponse;

      if (!response.success) {
        logger.error("❌ [Hook SSS] Réponse en erreur:", response.error);
        throw new Error(response.error || "Erreur lors de la récupération des formations");
      }

      logger.log(`📊 [Hook SSS] ${response.formations?.length || 0} formations reçues de l'API`);

      const formations = response.formations || [];
      logger.log(`✅ [Hook SSS] Retour de ${formations.length} formations au composant`);
      return formations;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes - données considérées fraîches
    gcTime: 1000 * 60 * 30, // 30 minutes - garder en cache plus longtemps
    refetchOnWindowFocus: false,
    retry: 1, // Réduit à 1 retry pour éviter les attentes longues
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Backoff exponentiel: 1s, 2s... max 10s
  });
}

/**
 * Filtrer les formations par région et/ou type
 */
function filterFormations(formations: SSSFormation[], filters?: { region?: string; type?: string }): SSSFormation[] {
  let result = [...formations];

  // Filtrer par région si spécifié
  if (filters?.region) {
    result = result.filter(f =>
      f.lieu?.toLowerCase().includes(filters.region!.toLowerCase())
    );
  }

  // Filtrer par type si spécifié
  if (filters?.type) {
    result = result.filter(f =>
      f.titre?.toLowerCase().includes(filters.type!.toLowerCase())
    );
  }

  return result;
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
      // Pour l'instant, on retourne un placeholder
      // Une Edge Function dédiée pourrait être créée pour scraper les détails
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
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Fonction pour forcer le rafraîchissement des données
 */
export async function refreshSSSFormations(): Promise<SSSFormation[]> {
  const { data, error } = await supabase.functions.invoke("sss-scraper", {
    body: { forceRefresh: true },
  });

  if (error) {
    throw new Error("Erreur lors du rafraîchissement");
  }

  const response = data as SSSFormationsResponse;
  return response.formations;
}

/**
 * Fonction pour vérifier si la Edge Function SSS est disponible
 */
export async function checkSSSApiHealth(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("sss-scraper", {
      body: { healthCheck: true },
    });
    return !error && data?.success !== false;
  } catch {
    return false;
  }
}
