import { Mail } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RecyclingStatusBadge } from './RecyclingStatusBadge';
import { getInitials } from './types';
import type { StudentData } from './types';

// Carte élève redesignée
export const StudentCard = ({
  student,
  isSelected,
  onToggleSelect,
  onSendMessage,
  onViewDetails,
}: {
  student: StudentData;
  isSelected: boolean;
  onToggleSelect: () => void;
  onSendMessage: () => void;
  onViewDetails: () => void;
}) => {
  const initials = getInitials(student.name);

  return (
    <div
      className={`bg-white/10 backdrop-blur-sm rounded-xl border p-4 hover:bg-white/15 transition-all cursor-pointer ${
        isSelected ? 'border-probain-blue ring-1 ring-probain-blue' : 'border-white/10'
      }`}
      onClick={onViewDetails}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="border-white/40 data-[state=checked]:bg-probain-blue data-[state=checked]:border-probain-blue flex-shrink-0"
        />

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center border border-white/20 flex-shrink-0 overflow-hidden">
          {student.avatarUrl ? (
            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-white/70">{initials}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{student.name || 'Sans nom'}</p>
          <p className="text-sm text-white/50 truncate">{student.training_type || 'Non spécifiée'}</p>
        </div>

        {/* Status badge */}
        <RecyclingStatusBadge status={student.recyclingStatus} />

        {/* Bouton message uniquement */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
            onClick={onSendMessage}
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sous-ligne : date + recyclage */}
      <div className="ml-[52px] mt-2 flex items-center gap-3 text-xs text-white/40">
        <span>{student.date}</span>
        {student.recyclingLabel && (
          <span className={
            student.recyclingStatus === 'expired' ? 'text-red-400' :
            student.recyclingStatus === 'expiring_soon' ? 'text-orange-400' :
            student.recyclingStatus === 'reminder' ? 'text-sky-400' :
            'text-white/40'
          }>
            {student.recyclingLabel}
          </span>
        )}
      </div>
    </div>
  );
};
