import { Check, Sparkles, Zap, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription, Tier, TIER_LABEL } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface Plan {
  tier: Tier;
  name: string;
  price: string;
  priceNote: string;
  tagline: string;
  highlighted?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  features: { label: string; included: boolean }[];
}

const PLANS: Plan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: '0€',
    priceNote: 'sempre',
    tagline: 'Para experimentar e criar os primeiros orçamentos.',
    icon: Sparkles,
    features: [
      { label: '3 orçamentos por mês', included: true },
      { label: 'Até 5 clientes guardados', included: true },
      { label: 'PDF profissional (com marca Obreiro)', included: true },
      { label: 'Logo e cores próprias no PDF', included: false },
      { label: 'Envio do PDF por email ao cliente', included: false },
      { label: 'Galeria de fotos e anexos', included: false },
      { label: 'Tracking de abertura e estados', included: false },
      { label: 'Termos e condições personalizados', included: false },
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '12€',
    priceNote: '/ mês',
    tagline: 'Para profissionais que querem destacar a sua marca.',
    highlighted: true,
    icon: Zap,
    features: [
      { label: 'Orçamentos ilimitados', included: true },
      { label: 'Clientes ilimitados', included: true },
      { label: 'Logo, cores e descrição no PDF', included: true },
      { label: 'PDF sem marca Obreiro', included: true },
      { label: 'Envio do PDF por email ao cliente', included: true },
      { label: 'Galeria de fotos e anexos', included: true },
      { label: 'Tracking + estados do orçamento', included: true },
      { label: 'T&Cs, validade e condições de pagamento', included: true },
    ],
  },
  {
    tier: 'business',
    name: 'Business',
    price: '29€',
    priceNote: '/ mês',
    tagline: 'Para empresas com equipa e necessidades de contabilidade.',
    icon: Building2,
    features: [
      { label: 'Tudo do Pro', included: true },
      { label: 'Até 5 utilizadores', included: true },
      { label: 'Conversão de orçamento em fatura', included: true },
      { label: 'Export SAF-T PT para contabilidade', included: true },
      { label: 'Suporte prioritário', included: true },
    ],
  },
];

export default function AppPlans() {
  const { tier: currentTier, loading } = useSubscription();

  const handleSubscribe = (tier: Tier) => {
    if (tier === 'free') return;
    // Checkout will be wired to Paddle when ready.
    toast.info('Subscrições estarão disponíveis em breve.', {
      description: 'Estamos a finalizar a integração de pagamentos.',
    });
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="font-heading text-3xl font-bold">Planos</h1>
        <p className="text-muted-foreground">
          Comece grátis. Faça upgrade quando quiser desbloquear toda a marca da sua empresa.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = !loading && currentTier === plan.tier;
          const Icon = plan.icon;
          return (
            <Card
              key={plan.tier}
              className={
                plan.highlighted
                  ? 'border-primary shadow-lg relative'
                  : 'relative'
              }
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                  Mais popular
                </Badge>
              )}
              <CardContent className="pt-8 pb-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                      plan.highlighted
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-heading text-xl font-bold">{plan.name}</div>
                    {isCurrent && (
                      <span className="text-xs text-primary font-medium">Plano atual</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="font-heading text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1 text-sm">
                    {plan.priceNote}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">{plan.tagline}</p>

                <Button
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={isCurrent || plan.tier === 'free'}
                  className="w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  {isCurrent
                    ? 'Plano atual'
                    : plan.tier === 'free'
                    ? 'Grátis para sempre'
                    : `Subscrever ${TIER_LABEL[plan.tier]}`}
                </Button>

                <ul className="space-y-2.5 pt-3 border-t border-border">
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2 text-sm ${
                        f.included ? '' : 'text-muted-foreground/60 line-through'
                      }`}
                    >
                      <Check
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          f.included ? 'text-primary' : 'text-muted-foreground/40'
                        }`}
                      />
                      <span>{f.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        <strong className="text-foreground">Sem compromisso.</strong> Pode cancelar
        a qualquer momento e continua a aceder ao plano até ao fim do período pago.
        Os preços já incluem o IVA correspondente ao seu país.
      </div>
    </div>
  );
}
