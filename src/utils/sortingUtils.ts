/**
 * Utilitaire de tri pour les certifications et jobs
 *
 * Ordre des brevets (du plus haut au plus bas):
 * 1. Expert BLS AED (le plus élevé)
 * 2. Expert Pool
 * 3. Expert Lac
 * 4. Expert Rivière
 * 5. Module Rivière
 * 6. Module Lac
 * 7. Pro Pool
 * 8. BLS AED
 * 9. Plus Pool
 * 10. Base Pool (le plus bas)
 */

// Mapping des priorités de certification (1 = plus haut, 10 = plus bas)
export const CERTIFICATION_PRIORITY: Record<string, number> = {
  'Expert BLS AED': 1,
  'Expert BLS-AED': 1,
  'Expert Pool': 2,
  'Expert Lac': 3,
  'Expert Rivière': 4,
  'Module Rivière': 5,
  'Module Lac': 6,
  'Pro Pool': 7,
  'BLS AED': 8,
  'BLS-AED': 8,
  'Plus Pool': 9,
  'Base Pool': 10,
};

// Priorité par défaut pour les brevets non reconnus (affichés en dernier)
const DEFAULT_PRIORITY = 999;

/**
 * Trie les certifications par niveau (du plus haut au plus bas)
 * Les brevets non reconnus sont placés à la fin
 */
export function sortCertificationsByLevel<T extends { title?: string; name?: string }>(
  certifications: T[]
): T[] {
  return [...certifications].sort((a, b) => {
    const titleA = a.title || a.name || '';
    const titleB = b.title || b.name || '';

    const priorityA = CERTIFICATION_PRIORITY[titleA] ?? DEFAULT_PRIORITY;
    const priorityB = CERTIFICATION_PRIORITY[titleB] ?? DEFAULT_PRIORITY;

    return priorityA - priorityB;
  });
}

/**
 * Trie les jobs par date (du plus récent au plus ancien)
 */
export function sortJobsByDate<T extends { created_at?: string }>(
  jobs: T[]
): T[] {
  return [...jobs].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA; // Plus récent en premier
  });
}

/**
 * Retourne la priorité d'un brevet (utile pour affichage)
 */
export function getCertificationPriority(certificationName: string): number {
  return CERTIFICATION_PRIORITY[certificationName] ?? DEFAULT_PRIORITY;
}

/**
 * Vérifie si un brevet est reconnu dans le système
 */
export function isKnownCertification(certificationName: string): boolean {
  return certificationName in CERTIFICATION_PRIORITY;
}
