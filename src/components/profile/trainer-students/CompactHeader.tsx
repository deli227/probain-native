import { Users } from 'lucide-react';

// Header compact horizontal (pattern unifié)
export const CompactHeader = ({ activeCount, totalCount }: { activeCount: number; totalCount: number }) => (
  <div className="relative bg-gradient-to-br from-primary via-probain-blue to-primary-dark px-4 py-3 overflow-hidden">
    {/* Cercle décoratif */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

    <div className="relative max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-cyan-400/20 rounded-xl border border-white/10">
          <Users className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">MES ÉLÈVES</h1>
          <p className="text-[11px] text-white/40">
            {totalCount > 0
              ? `${activeCount} actif${activeCount !== 1 ? 's' : ''} sur ${totalCount}`
              : 'Gestion des élèves'}
          </p>
        </div>
      </div>
    </div>
  </div>
);
