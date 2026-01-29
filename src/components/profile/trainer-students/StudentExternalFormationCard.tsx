import { CalendarDays, GraduationCap } from 'lucide-react';
import { RecyclingStatusBadge } from './RecyclingStatusBadge';
import type { ExternalFormation } from './types';

// Carte formation externe (depuis la table `formations` du sauveteur)
export const StudentExternalFormationCard = ({ formation }: { formation: ExternalFormation }) => {
  const statusColor =
    formation.recyclingStatus === 'expired' ? 'text-red-400' :
    formation.recyclingStatus === 'expiring_soon' ? 'text-orange-400' :
    formation.recyclingStatus === 'reminder' ? 'text-sky-400' :
    formation.recyclingStatus === 'valid' ? 'text-green-400' :
    'text-white/50';

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 border-dashed space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GraduationCap className="h-4 w-4 text-white/30 flex-shrink-0" />
          <p className="text-sm font-semibold text-white truncate">{formation.title || 'Non spécifiée'}</p>
        </div>
        <RecyclingStatusBadge status={formation.recyclingStatus} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/40 flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {formation.date}
        </span>
        {formation.recyclingLabel && (
          <span className={statusColor}>{formation.recyclingLabel}</span>
        )}
      </div>
      <div className="text-xs text-white/30">
        Organisation : {formation.organization}
      </div>
    </div>
  );
};
