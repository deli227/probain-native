
import { Database } from "@/integrations/supabase/types";

export type ProfileType = Database["public"]["Enums"]["profile_type"];

export type ProfileContextType = {
  profileTypeSelected: boolean;
  onboardingCompleted: boolean;
  profileType: ProfileType | null;
  loading: boolean;
  profileVerified: boolean;
  updateProfileType: (type: ProfileType) => Promise<boolean>;
  checkProfile?: () => Promise<void>;
  isOnline: boolean; // Ajout de cette propriété
};
