import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface StrengthCriteria {
  label: string;
  test: (password: string) => boolean;
}

const criteria: StrengthCriteria[] = [
  { label: '6 caractères minimum', test: (p) => p.length >= 6 },
  { label: 'Une majuscule', test: (p) => /[A-Z]/.test(p) },
  { label: 'Une minuscule', test: (p) => /[a-z]/.test(p) },
  { label: 'Un chiffre', test: (p) => /[0-9]/.test(p) },
];

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const { score, strength, color } = useMemo(() => {
    if (!password) {
      return { score: 0, strength: '', color: 'bg-gray-300' };
    }

    const passedCriteria = criteria.filter((c) => c.test(password)).length;
    const score = passedCriteria;

    let strength: string;
    let color: string;

    switch (score) {
      case 0:
      case 1:
        strength = 'Faible';
        color = 'bg-red-500';
        break;
      case 2:
        strength = 'Moyen';
        color = 'bg-orange-500';
        break;
      case 3:
        strength = 'Bon';
        color = 'bg-yellow-500';
        break;
      case 4:
        strength = 'Fort';
        color = 'bg-green-500';
        break;
      default:
        strength = '';
        color = 'bg-gray-300';
    }

    return { score, strength, color };
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Barre de progression */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/70">Force du mot de passe</span>
          <span className={cn(
            'text-xs font-medium',
            score <= 1 && 'text-red-400',
            score === 2 && 'text-orange-400',
            score === 3 && 'text-yellow-400',
            score === 4 && 'text-green-400',
          )}>
            {strength}
          </span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300 rounded-full', color)}
            style={{ width: `${(score / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Liste des critères */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {criteria.map((criterion) => {
          const passed = criterion.test(password);
          return (
            <div
              key={criterion.label}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors duration-200',
                passed ? 'text-green-400' : 'text-white/50'
              )}
            >
              {passed ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
              <span>{criterion.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
