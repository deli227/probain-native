import { useMemo } from "react";
import { useFormations } from "./use-formations";
import { getRecyclingAlerts, type RecyclingAlert } from "@/utils/recyclingUtils";

interface UseRecyclingRemindersResult {
  alerts: RecyclingAlert[];
  expiredCount: number;
  expiringSoonCount: number;
  reminderCount: number;
  totalAlertCount: number;
}

export const useRecyclingReminders = (): UseRecyclingRemindersResult => {
  const { formations } = useFormations();

  return useMemo(() => {
    const alerts = getRecyclingAlerts(formations);
    const expiredCount = alerts.filter((a) => a.status === "expired").length;
    const expiringSoonCount = alerts.filter((a) => a.status === "expiring_soon").length;
    const reminderCount = alerts.filter((a) => a.status === "reminder").length;

    return {
      alerts,
      expiredCount,
      expiringSoonCount,
      reminderCount,
      totalAlertCount: alerts.length,
    };
  }, [formations]);
};
