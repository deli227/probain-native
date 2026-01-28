import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook pour écouter les événements de reset d'onglet (double-tap sur onglet actif)
 *
 * @param onReset - Callback appelé quand l'utilisateur tap sur l'onglet déjà actif
 * @param paths - Liste des paths pour lesquels écouter (optionnel, par défaut écoute le path actuel)
 *
 * @example
 * useTabReset(() => {
 *   setSearchQuery('');
 *   setFilters({});
 * });
 */
export function useTabReset(onReset: () => void, paths?: string[]) {
  const location = useLocation();

  const handleTabReset = useCallback((event: CustomEvent<{ path: string }>) => {
    const eventPath = event.detail.path;

    // Si des paths spécifiques sont fournis, vérifier si l'événement correspond
    if (paths) {
      const matches = paths.some(p => eventPath.startsWith(p));
      if (matches) {
        onReset();
      }
    } else {
      // Sinon, vérifier si l'événement correspond au path actuel
      if (location.pathname.startsWith(eventPath)) {
        onReset();
      }
    }
  }, [onReset, paths, location.pathname]);

  useEffect(() => {
    window.addEventListener('tabReset', handleTabReset as EventListener);
    return () => {
      window.removeEventListener('tabReset', handleTabReset as EventListener);
    };
  }, [handleTabReset]);
}

/**
 * Hook pour reset automatique au changement d'onglet (quand on quitte la page)
 *
 * @param onLeave - Callback appelé quand l'utilisateur quitte la page
 * @param currentPath - Le path de la page actuelle
 *
 * @example
 * useTabLeave(() => {
 *   setSearchResults([]);
 * }, '/training');
 */
export function useTabLeave(onLeave: () => void, currentPath: string) {
  const location = useLocation();

  useEffect(() => {
    // Si on n'est plus sur le path actuel, appeler onLeave
    if (!location.pathname.startsWith(currentPath)) {
      onLeave();
    }
  }, [location.pathname, currentPath, onLeave]);
}
