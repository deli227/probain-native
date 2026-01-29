import { Users } from 'lucide-react';

// État vide
export const EmptyState = ({ type }: { type: 'active' | 'all' }) => (
  <div className="text-center py-12">
    <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
    <p className="text-white/60 font-medium">
      {type === 'active' ? 'Aucun élève actif' : 'Aucun élève trouvé'}
    </p>
    <p className="text-white/40 text-sm mt-1">
      {type === 'active'
        ? 'Les élèves avec un brevet valide chez vous apparaîtront ici'
        : 'Les élèves qui passent un brevet chez vous apparaîtront ici'}
    </p>
  </div>
);
