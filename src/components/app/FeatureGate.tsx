import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription, TierLimits, Tier } from '@/hooks/useSubscription';

type FeatureKey = keyof Omit<TierLimits, 'monthlyQuotes' | 'maxClients'>;

interface FeatureGateProps {
  feature: FeatureKey;
  requiredTier?: Tier; // override (defaults inferred: business-only flags need business)
  children: ReactNode;
  fallback?: ReactNode;
  mode?: 'block' | 'overlay' | 'inline';
  title?: string;
  description?: string;
}

const BUSINESS_ONLY: FeatureKey[] = ['multiUser', 'saftExport', 'invoiceConversion'];

export function FeatureGate({
  feature,
  requiredTier,
  children,
  fallback,
  mode = 'block',
  title,
  description,
}: FeatureGateProps) {
  const { limits, loading } = useSubscription();
  if (loading) return null;

  const allowed = limits[feature];
  if (allowed) return <>{children}</>;

  const needed: Tier =
    requiredTier ?? (BUSINESS_ONLY.includes(feature) ? 'business' : 'pro');
  const tierLabel = needed === 'business' ? 'Business' : 'Pro';

  if (fallback) return <>{fallback}</>;

  if (mode === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" /> {tierLabel}
      </span>
    );
  }

  if (mode === 'overlay') {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-40 blur-[1px]">{children}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {tierLabel}
          </div>
          <Button asChild size="sm">
            <Link to="/app/planos">Fazer upgrade</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="font-heading text-lg font-semibold">
        {title ?? `Disponível no plano ${tierLabel}`}
      </div>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <Button asChild className="mt-4" size="sm">
        <Link to="/app/planos">Ver planos</Link>
      </Button>
    </div>
  );
}
