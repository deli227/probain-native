import { addYears, addMonths, differenceInDays, isBefore, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  RECYCLING_PERIODS,
  CERTIFICATION_ALIASES,
  RECYCLING_REMINDER_MONTHS,
  type RecyclingInfo,
  type RecyclingStatus,
} from "./recyclingConfig";

interface FormationData {
  id: string;
  title: string;
  start_date: string;
  end_date?: string | null;
  organization?: string;
}

/** Résout le nom canonique d'une certification (gère les alias) */
function resolveCertName(title: string): string {
  return CERTIFICATION_ALIASES[title] ?? title;
}

/** Calcule le statut de recyclage pour une formation donnée (logique année civile SSS) */
export function getRecyclingInfo(formation: FormationData): RecyclingInfo {
  const certName = resolveCertName(formation.title);
  const periodYears = RECYCLING_PERIODS[certName];

  const noInfo: RecyclingInfo = { status: "unknown", nextRecyclingDue: null, daysRemaining: null, recyclingPeriodYears: null, deadlineYear: null };

  // Certification inconnue (ex: "Autre diplôme")
  if (periodYears === undefined) return noInfo;

  // Pas de recyclage requis (ex: Base Pool)
  if (periodYears === null) {
    return { status: "no_recycling", nextRecyclingDue: null, daysRemaining: null, recyclingPeriodYears: null, deadlineYear: null };
  }

  // Date de référence : end_date (dernier recyclage) ou start_date (date d'obtention)
  const referenceDate = formation.end_date
    ? new Date(formation.end_date)
    : new Date(formation.start_date);

  // Échéance théorique
  const theoreticalExpiry = addYears(referenceDate, periodYears);
  // Vraie deadline = 31 décembre de l'année civile de l'échéance théorique
  const deadlineYear = theoreticalExpiry.getFullYear();
  const realDeadline = new Date(deadlineYear, 11, 31); // 31 décembre

  // Date du rappel = 12 mois après la date de référence
  const reminderDate = addMonths(referenceDate, RECYCLING_REMINDER_MONTHS);

  const today = new Date();
  const days = differenceInDays(realDeadline, today);

  let status: RecyclingStatus;
  if (isBefore(realDeadline, today)) {
    status = "expired";
  } else if (today.getFullYear() >= deadlineYear) {
    status = "expiring_soon";
  } else if (!isBefore(today, reminderDate)) {
    status = "reminder";
  } else {
    status = "valid";
  }

  return { status, nextRecyclingDue: realDeadline, daysRemaining: days, recyclingPeriodYears: periodYears, deadlineYear };
}

export interface RecyclingAlert {
  formationId: string;
  certName: string;
  organization?: string;
  status: "expired" | "expiring_soon" | "reminder";
  nextRecyclingDue: Date;
  daysRemaining: number;
}

/** Retourne les alertes de recyclage triées par urgence (expiré > expire bientôt > rappel) */
export function getRecyclingAlerts(formations: FormationData[]): RecyclingAlert[] {
  const alerts: RecyclingAlert[] = [];

  for (const formation of formations) {
    const info = getRecyclingInfo(formation);
    if (info.status === "expired" || info.status === "expiring_soon" || info.status === "reminder") {
      alerts.push({
        formationId: formation.id,
        certName: resolveCertName(formation.title),
        organization: formation.organization,
        status: info.status,
        nextRecyclingDue: info.nextRecyclingDue!,
        daysRemaining: info.daysRemaining!,
      });
    }
  }

  // Trier : expired → expiring_soon → reminder, puis par date la plus proche
  const statusOrder: Record<string, number> = { expired: 0, expiring_soon: 1, reminder: 2 };
  alerts.sort((a, b) => {
    const orderDiff = statusOrder[a.status] - statusOrder[b.status];
    if (orderDiff !== 0) return orderDiff;
    return a.daysRemaining - b.daysRemaining;
  });

  return alerts;
}

/** Formate la date d'échéance en français */
export function formatRecyclingDate(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: fr });
}

/** Retourne un libellé court pour le statut */
export function getRecyclingLabel(info: RecyclingInfo): string | null {
  switch (info.status) {
    case "expired":
      return info.deadlineYear
        ? `Recyclage expiré depuis le 31/12/${info.deadlineYear}`
        : "Recyclage expiré";
    case "expiring_soon":
      return info.deadlineYear
        ? `Recyclage avant fin ${info.deadlineYear}`
        : `Recyclage dans ${info.daysRemaining} jours`;
    case "reminder":
      return info.deadlineYear
        ? `Pensez à recycler (fin ${info.deadlineYear})`
        : "Pensez à planifier votre recyclage";
    case "valid":
      return info.deadlineYear
        ? `Valide jusqu'à fin ${info.deadlineYear}`
        : null;
    default:
      return null;
  }
}
