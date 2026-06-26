import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PasswordEvaluation } from '@/lib/passwordPolicy';

interface Props {
  evaluation: PasswordEvaluation;
  show: boolean;
}

const segmentColor = (idx: number, score: number) => {
  if (score === 0) return 'bg-muted';
  if (idx === 0) return score >= 1 ? 'bg-destructive' : 'bg-muted';
  if (idx === 1) return score >= 2 ? 'bg-accent' : 'bg-muted';
  return score >= 3 ? 'bg-primary' : 'bg-muted';
};

const labelColor = (label: string) =>
  label === 'forte' ? 'text-primary' : label === 'média' ? 'text-accent' : 'text-destructive';

const rules: Array<{ key: keyof PasswordEvaluation['checks']; text: string }> = [
  { key: 'minLength', text: 'Pelo menos 8 caracteres' },
  { key: 'variety', text: 'Letras e números (ou mais variedade)' },
  { key: 'notPersonal', text: 'Diferente do seu nome e email' },
  { key: 'notCommon', text: 'Não é uma palavra-passe comum' },
];

export function PasswordStrengthMeter({ evaluation, show }: Props) {
  if (!show) return null;
  const { score, label, checks } = evaluation;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', segmentColor(i, score))} />
          ))}
        </div>
        <span className={cn('text-xs font-medium capitalize', labelColor(label))}>{label}</span>
      </div>
      <ul className="space-y-1">
        {rules.map((r) => {
          const ok = checks[r.key];
          return (
            <li key={r.key} className="flex items-center gap-2 text-xs">
              {ok ? (
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{r.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
