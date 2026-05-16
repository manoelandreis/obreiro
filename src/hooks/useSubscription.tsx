import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppAuth } from './useAppAuth';

export type Tier = 'free' | 'pro' | 'business';
export type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

export interface TierLimits {
  monthlyQuotes: number | null; // null = unlimited
  maxClients: number | null;
  pdfBranding: boolean;        // own logo/colors in PDF
  removeWatermark: boolean;    // no "Feito com ..." footer
  emailSend: boolean;          // send PDF by email
  attachments: boolean;        // photo gallery + files
  tracking: boolean;           // open tracking + statuses
  customTerms: boolean;        // T&Cs/validity/payment conditions
  multiUser: boolean;
  saftExport: boolean;
  invoiceConversion: boolean;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    monthlyQuotes: 3,
    maxClients: 5,
    pdfBranding: false,
    removeWatermark: false,
    emailSend: false,
    attachments: false,
    tracking: false,
    customTerms: false,
    multiUser: false,
    saftExport: false,
    invoiceConversion: false,
  },
  pro: {
    monthlyQuotes: null,
    maxClients: null,
    pdfBranding: true,
    removeWatermark: true,
    emailSend: true,
    attachments: true,
    tracking: true,
    customTerms: true,
    multiUser: false,
    saftExport: false,
    invoiceConversion: false,
  },
  business: {
    monthlyQuotes: null,
    maxClients: null,
    pdfBranding: true,
    removeWatermark: true,
    emailSend: true,
    attachments: true,
    tracking: true,
    customTerms: true,
    multiUser: true,
    saftExport: true,
    invoiceConversion: true,
  },
};

export const TIER_LABEL: Record<Tier, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
};

export interface SubscriptionState {
  loading: boolean;
  tier: Tier;
  status: SubStatus;
  limits: TierLimits;
  isPro: boolean;
  isBusiness: boolean;
  isPaid: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  refetch: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAppAuth();
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<Tier>('free');
  const [status, setStatus] = useState<SubStatus>('active');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);

  const load = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('user_subscriptions')
      .select('tier, status, current_period_end, cancel_at_period_end')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setTier((data.tier as Tier) ?? 'free');
      setStatus((data.status as SubStatus) ?? 'active');
      setCurrentPeriodEnd(data.current_period_end ?? null);
      setCancelAtPeriodEnd(!!data.cancel_at_period_end);
    } else {
      setTier('free');
      setStatus('active');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const effectiveTier: Tier =
    status === 'active' || status === 'trialing' ? tier : 'free';

  return {
    loading,
    tier: effectiveTier,
    status,
    limits: TIER_LIMITS[effectiveTier],
    isPro: effectiveTier === 'pro' || effectiveTier === 'business',
    isBusiness: effectiveTier === 'business',
    isPaid: effectiveTier !== 'free',
    currentPeriodEnd,
    cancelAtPeriodEnd,
    refetch: load,
  };
}
