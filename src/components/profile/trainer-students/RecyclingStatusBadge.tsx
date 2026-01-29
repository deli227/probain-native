import type { RecyclingStatus } from "@/utils/recyclingConfig";

// Badge de statut recyclage
export const RecyclingStatusBadge = ({ status }: { status: RecyclingStatus }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    valid: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Valide' },
    expiring_soon: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Expire bientôt' },
    reminder: { bg: 'bg-sky-500/20', text: 'text-sky-400', label: 'À recycler' },
    expired: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Expiré' },
    no_recycling: { bg: 'bg-white/10', text: 'text-white/50', label: 'Permanent' },
    unknown: { bg: 'bg-white/10', text: 'text-white/40', label: '' },
  };

  const c = config[status] || config.unknown;
  if (!c.label) return null;

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text} whitespace-nowrap`}>
      {c.label}
    </span>
  );
};
