/**
 * Système de logging conditionnel pour Pro-Bain App
 *
 * Utilisation:
 * - logger.log() : logs uniquement en développement
 * - logger.info() : logs uniquement en développement
 * - logger.warn() : logs toujours (développement et production)
 * - logger.error() : logs toujours (développement et production)
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Log général - uniquement en développement
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log informatif - uniquement en développement
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Warning - toujours affiché
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Erreur - toujours affichée
   */
  error: (...args: any[]) => {
    console.error(...args);
  },
};
