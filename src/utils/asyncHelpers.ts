/**
 * Helpers pour gérer les appels async avec timeout
 * Évite les requêtes qui restent en pending infini (problème PWA)
 */

/**
 * Ajoute un timeout à n'importe quelle Promise
 * Évite les appels qui restent en pending infini
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  ms: number = 5000,
  errorMessage: string = 'Timeout dépassé'
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), ms)
  );
  return Promise.race([promise, timeout]);
};

/**
 * Wrapper pour les appels Supabase Auth - utilise getSession (cache local, instantané)
 * getSession() est préféré car il utilise le localStorage et ne fait pas de requête réseau
 * getUser() fait une requête réseau à chaque appel, ce qui cause des timeouts en cascade
 */
export const safeGetUser = async (supabase: any, _timeoutMs: number = 5000) => {
  try {
    // Utiliser getSession qui est instantané (cache local)
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      return { data: { user: null }, error };
    }
    return { data: { user: session?.user || null }, error: null };
  } catch (error) {
    return { data: { user: null }, error };
  }
};

/**
 * Wrapper pour les appels Supabase DB avec timeout et retry automatique
 * Gère les cold starts de Supabase et les connexions lentes
 */
export const safeQuery = async <T>(
  queryBuilder: (() => Promise<T>) | Promise<T>,
  timeoutMs: number = 8000,
  maxRetries: number = 2
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Si c'est une fonction, l'appeler pour obtenir une nouvelle Promise
      // Sinon utiliser la Promise directement (compatibilité ascendante)
      const promise = typeof queryBuilder === 'function' ? queryBuilder() : queryBuilder;
      return await withTimeout(promise, timeoutMs, 'Query timeout');
    } catch (error: unknown) {
      lastError = error;
      // Ne pas retry si ce n'est pas un timeout
      const errorMessage = error instanceof Error ? error.message : '';
      if (!errorMessage.includes('timeout') && !errorMessage.includes('Timeout')) {
        throw error;
      }
      // Attendre un peu avant de retry (backoff exponentiel)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError;
};
