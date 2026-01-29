import type { RecyclingStatus } from "@/utils/recyclingConfig";

export interface StudentData {
  id: string;
  student_id: string;
  name: string;
  email: string;
  phone: string | null;
  phoneVisible: boolean;
  avatarUrl: string | null;
  certification_issued: boolean;
  date: string;
  training_type: string;
  training_date: string;
  recyclingStatus: RecyclingStatus;
  recyclingLabel: string | null;
}

export interface SelectedStudent {
  student_id: string;
  student: {
    first_name: string;
    last_name: string;
  };
}

// Interface pour les formations externes (table `formations` du sauveteur)
export interface ExternalFormation {
  id: string;
  title: string;
  organization: string;
  start_date: string;
  date: string;
  recyclingStatus: RecyclingStatus;
  recyclingLabel: string | null;
}

// Helper: obtenir les initiales
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
