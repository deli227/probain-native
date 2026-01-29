export type RecyclingStatus = 'valid' | 'reminder' | 'expiring_soon' | 'expired' | 'no_recycling' | 'unknown';

export interface RecyclingInfo {
  status: RecyclingStatus;
  nextRecyclingDue: Date | null;
  daysRemaining: number | null;
  recyclingPeriodYears: number | null;
  deadlineYear: number | null;
}

/**
 * Période de recyclage en années pour chaque type de certification SSS.
 * `null` signifie pas de recyclage requis.
 */
export const RECYCLING_PERIODS: Record<string, number | null> = {
  "Base Pool": null,
  "BLS-AED": 4,
  "Plus Pool": 2,
  "Pro Pool": 2,
  "Module Lac": 4,
  "Module Rivière": 4,
  "Expert BLS-AED": 2,
  "Expert Pool": 2,
  "Expert Lac": 4,
  "Expert Rivière": 4,
};

/** Aliases pour gérer les variantes de noms (espace vs tiret) */
export const CERTIFICATION_ALIASES: Record<string, string> = {
  "BLS AED": "BLS-AED",
  "Expert BLS AED": "Expert BLS-AED",
};

/** Nombre de mois après la date de référence pour déclencher le rappel */
export const RECYCLING_REMINDER_MONTHS = 12;
