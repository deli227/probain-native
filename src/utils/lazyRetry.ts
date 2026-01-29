import { lazy, ComponentType } from 'react';

/**
 * Wrapper autour de React.lazy qui re-essaie les imports en cas d'echec.
 * Quand un chunk Vite devient invalide (apres un deploiement), l'import echoue.
 * Ce wrapper re-essaie jusqu'a maxRetries fois, puis force un reload unique.
 */
export function lazyRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  maxRetries = 2,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const hasReloaded = sessionStorage.getItem('chunk_reload');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const module = await importFn();
        // Succes - nettoyer le flag de reload si present
        sessionStorage.removeItem('chunk_reload');
        return module;
      } catch (error) {
        if (attempt < maxRetries) {
          // Attendre avant de re-essayer (backoff exponentiel)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        // Tous les retries echoues - forcer un reload unique pour obtenir les nouveaux chunks
        if (!hasReloaded) {
          sessionStorage.setItem('chunk_reload', 'true');
          window.location.reload();
          // Retourner une promise qui ne resout jamais pour eviter que React ne throw
          return new Promise<{ default: T }>(() => {});
        }

        // Deja reloade une fois et toujours en echec - laisser l'erreur remonter
        sessionStorage.removeItem('chunk_reload');
        throw error;
      }
    }

    // Unreachable mais TypeScript l'exige
    throw new Error('lazyRetry: unreachable');
  });
}
