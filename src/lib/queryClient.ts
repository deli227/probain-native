import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * Configuration du QueryClient pour TanStack Query avec persistance
 *
 * Options configurées:
 * - staleTime: 5 minutes - Durée pendant laquelle les données sont considérées comme fraîches
 * - gcTime: 24 heures - Durée avant que les données inactives soient supprimées du cache
 * - retry: 3 - Nombre de tentatives avec backoff exponentiel
 * - networkMode: 'offlineFirst' - Mode PWA: utilise le cache d'abord, puis revalide
 *
 * Persistance:
 * - Les données sont sauvegardées dans localStorage
 * - Survit aux rechargements de page et fermetures de navigateur
 * - Max age: 24 heures
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - données considérées fraîches
      gcTime: 1000 * 60 * 60 * 24, // 24 heures - garde en cache longtemps pour PWA
      retry: 3, // 3 tentatives avec backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponentiel
      refetchOnWindowFocus: false, // Désactivé pour PWA
      refetchOnReconnect: 'always', // Refetch quand on revient en ligne
      // IMPORTANT: Ne pas bloquer les requêtes initiales
      // refetchOnMount: true par défaut - permet aux nouvelles queries de fetch
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Persister pour sauvegarder le cache dans localStorage
 * Permet au profil d'être disponible immédiatement au chargement
 */
export const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'PROBAIN_QUERY_CACHE',
});
