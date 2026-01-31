import { Switch } from "@/components/ui/switch";
import { Loader2, Bell, Mail, GraduationCap, Briefcase, AlertTriangle } from "lucide-react";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";

interface NotificationPreferencesSectionProps {
  userId: string | undefined;
}

export const NotificationPreferencesSection = ({ userId }: NotificationPreferencesSectionProps) => {
  const { preferences, loading: prefsLoading, updatePreference } = useNotificationPreferences(userId);

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-yellow-500/20">
          <Bell className="h-5 w-5 text-yellow-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
      </div>
      <p className="text-white/60 text-sm mb-4">
        Choisissez les notifications que vous souhaitez recevoir
      </p>

      {prefsLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Messages */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-white font-medium text-sm">Messages</p>
                <p className="text-white/50 text-xs">Nouveaux messages reçus</p>
              </div>
            </div>
            <Switch
              checked={preferences?.notify_messages ?? true}
              onCheckedChange={(checked) => updatePreference('notify_messages', checked)}
            />
          </div>

          {/* Formations */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-white font-medium text-sm">Formations</p>
                <p className="text-white/50 text-xs">Nouvelles formations disponibles</p>
              </div>
            </div>
            <Switch
              checked={preferences?.notify_formations ?? true}
              onCheckedChange={(checked) => updatePreference('notify_formations', checked)}
            />
          </div>

          {/* Offres d'emploi */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-white font-medium text-sm">Offres d'emploi</p>
                <p className="text-white/50 text-xs">Nouvelles offres d'emploi</p>
              </div>
            </div>
            <Switch
              checked={preferences?.notify_job_offers ?? true}
              onCheckedChange={(checked) => updatePreference('notify_job_offers', checked)}
            />
          </div>

          {/* Recyclage */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-white font-medium text-sm">Recyclage</p>
                <p className="text-white/50 text-xs">Rappels de renouvellement des brevets</p>
              </div>
            </div>
            <Switch
              checked={preferences?.notify_recycling ?? true}
              onCheckedChange={(checked) => updatePreference('notify_recycling', checked)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
