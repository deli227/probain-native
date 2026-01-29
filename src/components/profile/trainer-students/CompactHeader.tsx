import { Users } from 'lucide-react';

// Header compact
export const CompactHeader = ({ activeCount, totalCount }: { activeCount: number; totalCount: number }) => (
  <div className="relative bg-gradient-to-br from-primary via-probain-blue to-primary-dark py-5 md:py-6 px-4 overflow-hidden">
    {/* Cercle décoratif */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

    <div className="relative max-w-4xl mx-auto text-center">
      <div className="flex flex-col items-center gap-2">
        {/* Icône compacte */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl blur-md opacity-40" />
          <div className="relative bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
        </div>

        <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
          MES ÉLÈVES
        </h1>

        {totalCount > 0 && (
          <p className="text-white/60 text-sm">
            {activeCount} actif{activeCount !== 1 ? 's' : ''} sur {totalCount}
          </p>
        )}
      </div>
    </div>
  </div>
);
