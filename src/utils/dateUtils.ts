/**
 * Utilitaires de dates timezone-safe.
 *
 * PROBLEME : new Date("2026-01-31") crée une date UTC minuit.
 * En CET (UTC+1), ça donne 2026-01-30 23:00 → la date recule d'un jour.
 *
 * SOLUTION : toujours utiliser new Date(year, month-1, day) pour créer des dates locales.
 */

/**
 * Parse une date ISO string "YYYY-MM-DD" (ou ISO complète) en Date locale.
 * Évite le bug timezone de new Date("YYYY-MM-DD") qui crée une date UTC.
 */
export function parseDateLocal(dateStr: string | Date | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  if (dateStr instanceof Date) return dateStr;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return undefined;
  return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
}

/**
 * Formate une Date en "YYYY-MM-DD" local (sans passer par UTC).
 * Remplace date.toISOString().split('T')[0] qui utilise UTC et peut décaler d'un jour.
 */
export function formatDateLocal(date: Date | null | undefined): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
