import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, ChevronDown, Smartphone } from 'lucide-react';
import appPreviewMockup from '@/assets/app-preview-mockup.jpg';

const appFeatures = [
  {
    title: 'Dashboard Inteligente',
    color: 'border-t-blue-500',
    bullets: ['Métricas em Tempo Real', 'Gráfico de Atividade Mensal', 'Acesso Rápido a Ações'],
  },
  {
    title: 'Gestão de Clientes (RGPD Ready)',
    color: 'border-t-emerald-500',
    bullets: ['Ficha Completa de Cliente', 'Consentimento RGPD Integrado', 'Direito ao Esquecimento'],
  },
  {
    title: 'Controlo de Trabalhos e Orçamentos',
    color: 'border-t-amber-500',
    bullets: ['Estados de Fluxo Automáticos', 'Histórico Completo', 'Preview de Documentos'],
  },
  {
    title: 'Gestão de Tarefas Detalhada',
    color: 'border-t-purple-500',
    bullets: ['Atividades por Trabalho', 'Produtos e Materiais', 'Progresso Visual'],
  },
  {
    title: 'Segurança de Elite',
    color: 'border-t-red-500',
    bullets: ['Lock Screen com PIN', 'Auto-Lock Configurável', 'Logs de Segurança e Bloqueio de Força Bruta'],
  },
];

export default function AppComingSoonSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-4 shadow-sm">
            <Smartphone className="h-4 w-4 text-primary" />
            <span>Em desenvolvimento</span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
            A App que está a caminho.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tudo o que precisa para gerir o seu negócio de construção — no bolso.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Left — Mockup */}
          <div className="rounded-2xl overflow-hidden shadow-xl bg-[#e8ddd0]">
            <img
              src={appPreviewMockup}
              alt="Preview da app Obreiro"
              className="w-full h-auto"
              loading="lazy"
              width={800}
              height={900}
            />
          </div>

          {/* Right — Expandable features */}
          <div className="space-y-3">
            {appFeatures.map((feature, idx) => (
              <Collapsible
                key={feature.title}
                open={openIndex === idx}
                onOpenChange={(open) => setOpenIndex(open ? idx : -1)}
              >
                <div
                  className={`rounded-xl border bg-card shadow-sm overflow-hidden border-t-4 ${feature.color} transition-shadow hover:shadow-md`}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-5 py-4 text-left">
                    <span className="font-heading font-semibold text-base text-foreground">
                      {feature.title}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        openIndex === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-5 pb-4 space-y-2">
                      {feature.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
