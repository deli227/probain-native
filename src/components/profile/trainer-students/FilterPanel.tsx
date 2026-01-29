import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Panneau de filtres (brevet + source)
export const FilterPanel = ({
  show,
  selectedBrevet,
  onSelectBrevet,
  formationSource,
  onSelectSource,
  availableBrevets,
  onClearFilters,
}: {
  show: boolean;
  selectedBrevet: string | null;
  onSelectBrevet: (brevet: string | null) => void;
  formationSource: 'all' | 'own' | 'others';
  onSelectSource: (source: 'all' | 'own' | 'others') => void;
  availableBrevets: string[];
  onClearFilters: () => void;
}) => {
  if (!show) return null;

  const hasActiveFilters = selectedBrevet !== null || formationSource !== 'all';

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
      {/* Sélecteur brevet */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
          Filtrer par brevet
        </label>
        <Select
          value={selectedBrevet || "__none__"}
          onValueChange={(v) => onSelectBrevet(v === "__none__" ? null : v)}
        >
          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white rounded-xl h-10 text-sm">
            <SelectValue placeholder="Tous les brevets" />
          </SelectTrigger>
          <SelectContent className="bg-[#0a1628] border-white/10 rounded-xl">
            <SelectItem value="__none__" className="text-white/70 focus:bg-white/10 focus:text-white">
              Tous les brevets
            </SelectItem>
            {availableBrevets.map((b) => (
              <SelectItem key={b} value={b} className="text-white focus:bg-white/10 focus:text-white">
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sélecteur source (visible seulement quand un brevet est choisi) */}
      {selectedBrevet && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
            Source de la formation
          </label>
          <div className="grid grid-cols-3 gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {([
              { value: 'all' as const, label: 'Tous' },
              { value: 'own' as const, label: 'Chez moi' },
              { value: 'others' as const, label: 'Ailleurs' },
            ]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onSelectSource(value)}
                className={`rounded-lg py-2 text-sm font-medium transition-all ${
                  formationSource === value
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bouton effacer */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <X className="h-3 w-3" />
          Effacer les filtres
        </button>
      )}
    </div>
  );
};
