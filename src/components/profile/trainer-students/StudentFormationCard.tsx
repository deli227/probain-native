import { CalendarDays, GraduationCap } from 'lucide-react';
import { RecyclingStatusBadge } from './RecyclingStatusBadge';
import type { StudentData } from './types';

// Carte formation dans le détail (formations du formateur actuel)
export const StudentFormationCard = ({ formation }: { formation: StudentData }) => {
  const statusColor =
    formation.recyclingStatus === 'expired' ? 'text-red-400' :
    formation.recyclingStatus === 'expiring_soon' ? 'text-orange-400' :
    formation.recyclingStatus === 'reminder' ? 'text-sky-400' :
    formation.recyclingStatus === 'valid' ? 'text-green-400' :
    'text-white/50';

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GraduationCap className="h-4 w-4 text-cyan-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-white truncate">{formation.training_type || 'Non spécifiée'}</p>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap flex-shrink-0 ${
            formation.trainingCategory === 'recyclage'
              ? 'bg-sky-500/20 text-sky-400'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {formation.trainingCategory === 'recyclage' ? 'Recyclage' : 'Diplôme'}
          </span>
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
    </div>
  );
};
