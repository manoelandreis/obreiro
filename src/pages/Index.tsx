import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowRight, Check, ShieldCheck, Clock, Sparkles, FileText, ClipboardList, Users, Zap, Hammer, FileCheck, Receipt } from 'lucide-react';
import heroScene from '@/assets/hero-scene.jpg';
import fitBlueprints from '@/assets/fit-blueprints.jpg';
import fitSite from '@/assets/fit-site.jpg';
import fitTools from '@/assets/fit-tools.jpg';
import fitTeam from '@/assets/fit-team.jpg';

interface ContentSection {
  section_key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
}

const fits = [
  { img: fitBlueprints, title: 'Orçamentos detalhados e profissionais', desc: 'Crie documentos prontos a enviar com materiais, mão-de-obra e prazos — sem folhas de cálculo.' },
  { img: fitSite, title: 'Equipas em obra com pouco tempo', desc: 'Preencha em minutos no telemóvel ou no portátil. O fluxo guiado faz o resto.' },
  { img: fitTools, title: 'Templates reutilizáveis para serviços recorrentes', desc: 'Guarde os seus serviços e materiais habituais e reutilize em cada novo orçamento.' },
  { img: fitTeam, title: 'Profissionalismo desde o primeiro contacto', desc: 'Impressione o cliente com documentos claros, organizados e com a sua marca.' },
];

const checklist = [
  'Faz orçamentos manualmente em Word ou Excel e perde horas por cliente',
  'Quer enviar documentos com aspecto profissional sem contratar designer',
  'Trabalha em construção, remodelações, canalização, eletricidade ou similares',
  'Tem serviços recorrentes que gostaria de guardar como templates',
  'Precisa de organizar materiais e mão-de-obra de forma clara',
  'Quer começar agora, sem instalações nem registos demorados',
  'Valoriza privacidade — nada do que escreve fica guardado nos nossos servidores',
];

const whatYouGet = [
  { icon: FileCheck, num: '01', title: 'Documento PDF', desc: 'Orçamento profissional pronto a enviar ao cliente, com a sua identidade.' },
  { icon: ClipboardList, num: '02', title: 'Detalhe completo', desc: 'Materiais, mão-de-obra, quantidades e totais — tudo discriminado.' },
  { icon: Hammer, num: '03', title: 'Templates seus', desc: 'Guarde serviços recorrentes e reutilize-os em segundos.' },
  { icon: ShieldCheck, num: '04', title: 'Privacidade total', desc: 'Tudo processado localmente. Nada fica guardado.' },
];

const timeBlocks = [
  { label: 'Setup', value: '0 min', sub: 'Sem registo. Comece já.' },
  { label: 'Primeiro orçamento', value: '~5 min', sub: 'Do zero ao PDF pronto.' },
  { label: 'Orçamentos seguintes', value: '~2 min', sub: 'Com templates guardados.' },
  { label: 'Custo', value: 'Grátis', sub: 'Sem cartão. Sem limites na beta.' },
];

export default function Index() {
  const [content, setContent] = useState<Record<string, ContentSection>>({});
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('landing_content').select('*').then(({ data }) => {
      if (data) {
        const map: Record<string, ContentSection> = {};
        data.forEach((item) => { map[item.section_key] = item; });
        setContent(map);
      }
    });
  }, []);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    const { error } = await supabase.from('waitlist_leads').insert({ email, name, source: 'landing_page' });
    setSubmitting(false);
    if (error) {
      toast.error('Erro ao submeter. Tente novamente.');
    } else {
      toast.success('Obrigado! Entrou na lista de espera.');
      setEmail('');
      setName('');
    }
  };

  const hero = content['hero'];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center text-accent-foreground font-display font-bold text-lg shadow-[0_4px_12px_hsl(var(--accent)/0.35)]">
              H
            </div>
            <div className="font-display text-xl text-foreground">
              Handy<span className="text-accent font-normal">Flow</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#fit" className="hover:text-foreground transition-colors">Onde encaixa</a>
            <a href="#checklist" className="hover:text-foreground transition-colors">É para si?</a>
            <a href="#receive" className="hover:text-foreground transition-colors">O que recebe</a>
            <a href="#time" className="hover:text-foreground transition-colors">Tempo</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="hidden sm:block">
              <Button variant="ghost" size="sm">Admin</Button>
            </Link>
            <Link to="/quote">
              <Button size="sm" className="rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-[0_4px_12px_hsl(var(--accent)/0.3)]">
                Criar orçamento
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - Split: text left, product mockup right */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(var(--primary-deep))]">
        {/* Decorative orange glow */}
        <div className="absolute -top-20 -right-20 w-[420px] h-[420px] rounded-full bg-accent/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Headlines + CTAs */}
            <div className="text-primary-foreground">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-semibold uppercase tracking-wider mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Para profissionais da construção
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] mb-6">
                {hero?.title || 'Orçamentos profissionais, em minutos.'}
              </h1>
              <p className="text-lg lg:text-xl text-primary-foreground/80 mb-8 max-w-xl leading-relaxed">
                {hero?.subtitle || 'Crie documentos prontos a enviar — sem registos, sem instalações, sem nada guardado nos nossos servidores.'}
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <Link to="/quote">
                  <Button size="lg" className="rounded-xl gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-[0_8px_20px_hsl(var(--accent)/0.4)] font-semibold">
                    Criar orçamento grátis <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#waitlist">
                  <Button size="lg" variant="outline" className="rounded-xl bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground font-semibold">
                    Juntar-me à waitlist
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                {['🇵🇹 PT-PT nativo', '📱 Mobile-first', '⚡ 5 min ao primeiro PDF', '🔒 100% privado'].map((tag) => (
                  <span key={tag} className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/15 text-primary-foreground/90">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Product mockup square */}
            <div className="relative">
              <div className="aspect-square w-full max-w-xl mx-auto bg-gradient-to-br from-background to-secondary rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] p-6 md:p-8 relative overflow-hidden">
                {/* Mockup browser bar */}
                <div className="flex items-center gap-1.5 mb-5">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[hsl(142_70%_45%)]/60" />
                  <div className="ml-3 flex-1 h-6 bg-muted rounded-md flex items-center px-2.5">
                    <span className="text-[10px] font-mono text-muted-foreground truncate">handyflow.pt/quote</span>
                  </div>
                </div>

                {/* Quote document mockup */}
                <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
                  {/* Header */}
                  <div className="flex justify-between items-start pb-4 mb-4 border-b border-dashed border-border">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center text-accent-foreground font-display font-bold text-xs">H</div>
                      <div className="font-display text-sm text-primary">Construções <span className="text-accent font-normal">Silva</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Orçamento</div>
                      <div className="font-mono text-xs font-semibold text-foreground">#2026-042</div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {[
                      { t: 'Renovação de cozinha', s: 'Mão-de-obra · 24h', v: '€ 1.440' },
                      { t: 'Azulejos cerâmicos', s: '15 m² · Material', v: '€ 487' },
                      { t: 'Instalação elétrica', s: 'Pontos novos · 8u', v: '€ 320' },
                    ].map((row) => (
                      <div key={row.t} className="flex justify-between items-center p-2.5 rounded-lg bg-secondary/60">
                        <div>
                          <div className="text-xs font-semibold text-foreground">{row.t}</div>
                          <div className="text-[10px] text-muted-foreground">{row.s}</div>
                        </div>
                        <div className="text-xs font-bold text-primary font-mono">{row.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center p-3 rounded-xl bg-primary text-primary-foreground">
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Total c/ IVA 23%</div>
                    <div className="font-display text-lg">€ 2.764,11</div>
                  </div>

                  {/* Action */}
                  <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-accent to-[hsl(25_91%_55%)] text-accent-foreground shadow-[0_6px_16px_hsl(var(--accent)/0.35)]">
                    <div className="h-7 w-7 rounded-lg bg-accent-foreground/20 flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold">PDF pronto a enviar</div>
                      <div className="text-[10px] opacity-90">Com a sua marca · A4 standard</div>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -bottom-3 -right-3 md:bottom-4 md:right-4 bg-card border border-border rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Gerado em</div>
                    <div className="text-sm font-bold text-foreground font-mono">3 min 12s</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Where HandyFlow fits best */}
      <section id="fit" className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-block text-xs font-semibold uppercase tracking-widest text-accent bg-[hsl(var(--accent-soft))] px-3 py-1.5 rounded-full mb-4">Onde encaixa</div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground">Onde o HandyFlow brilha</h2>
          </div>
          <div className="space-y-6">
            {fits.map((f) => (
              <div key={f.title} className="grid grid-cols-[160px_1fr] md:grid-cols-[240px_1fr] gap-6 items-center bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square w-full overflow-hidden">
                  <img src={f.img} alt={f.title} className="w-full h-full object-cover" loading="lazy" width={400} height={400} />
                </div>
                <div className="pr-6 py-4">
                  <h3 className="font-display text-xl md:text-2xl text-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm md:text-base">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section id="checklist" className="py-20 md:py-28 bg-secondary">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-block text-xs font-semibold uppercase tracking-widest text-accent bg-[hsl(var(--accent-soft))] px-3 py-1.5 rounded-full mb-4">Faça o teste</div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-3">É o HandyFlow para si?</h2>
            <p className="text-muted-foreground">Se assinalar três ou mais, vale a pena experimentar.</p>
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8 space-y-4">
            {checklist.map((item, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5 h-5 w-5 rounded-md border-2 border-border group-hover:border-accent flex items-center justify-center shrink-0 transition-colors">
                  <Check className="h-3 w-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm md:text-base text-foreground/90">{item}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* What you'll receive */}
      <section id="receive" className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-block text-xs font-semibold uppercase tracking-widest text-accent bg-[hsl(var(--accent-soft))] px-3 py-1.5 rounded-full mb-4">O que vai receber</div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground">O que vai sair daqui</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {whatYouGet.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.num} className="bg-card rounded-2xl border border-border p-6 hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="h-11 w-11 rounded-xl bg-[hsl(var(--accent-soft))] flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div className="font-mono text-xs text-muted-foreground mb-2">{item.num}</div>
                  <h3 className="font-display text-xl text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Time at a glance */}
      <section id="time" className="py-20 md:py-28 bg-secondary">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-block text-xs font-semibold uppercase tracking-widest text-accent bg-[hsl(var(--accent-soft))] px-3 py-1.5 rounded-full mb-4">Tempo</div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground">Tempo, em resumo</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {timeBlocks.map((b) => (
              <div key={b.label} className="bg-card rounded-2xl border border-border p-6 text-center">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">{b.label}</div>
                <div className="font-display text-3xl md:text-4xl text-primary mb-2">{b.value}</div>
                <div className="text-xs text-muted-foreground">{b.sub}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-accent" />
            100% seguro · Os seus dados nunca são guardados nos nossos servidores
          </div>
        </div>
      </section>

      {/* Dark testimonial / quote card */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-primary text-primary-foreground rounded-3xl overflow-hidden grid md:grid-cols-[280px_1fr] shadow-2xl">
            <div className="bg-accent flex items-center justify-center p-10">
              <Sparkles className="h-20 w-20 text-accent-foreground" />
            </div>
            <div className="p-8 md:p-12 space-y-6">
              <div className="space-y-4">
                {[
                  { Icon: FileText, t: 'Sem fricção', d: 'Abre, preenche, exporta. Sem registos nem instalações.' },
                  { Icon: ClipboardList, t: 'Tudo no seu sítio', d: 'Cliente, serviços, materiais, totais — fluxo guiado.' },
                  { Icon: Users, t: 'Pensado para profissionais', d: 'Construção, remodelações, canalização, eletricidade.' },
                  { Icon: Clock, t: 'Poupa horas por semana', d: 'Templates reutilizáveis para serviços recorrentes.' },
                ].map(({ Icon, t, d }) => (
                  <div key={t} className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-accent shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold">{t}</div>
                      <p className="text-sm opacity-70">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-primary-foreground/10">
                <p className="font-display text-xl">"Como um orçamento devia ser feito."</p>
                <p className="text-sm opacity-60 mt-1">— Filosofia HandyFlow</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="waitlist" className="py-20 md:py-28 bg-gradient-to-br from-primary to-[hsl(var(--primary-deep))] text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 max-w-2xl text-center relative">
          <h2 className="font-display text-4xl md:text-6xl mb-4">
            {content['cta']?.title || 'Pronto para experimentar?'}
          </h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            {content['cta']?.subtitle || 'Crie um orçamento agora ou junte-se à lista para novidades.'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <Link to="/quote">
              <Button size="lg" className="rounded-xl gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shadow-[0_8px_20px_hsl(var(--accent)/0.4)] font-semibold">
                Criar orçamento <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <form onSubmit={handleWaitlist} className="space-y-3 max-w-md mx-auto text-left bg-primary-foreground/5 backdrop-blur p-6 rounded-2xl border border-primary-foreground/10">
            <Input
              placeholder="O seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
            />
            <Input
              type="email"
              required
              placeholder="O seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
            />
            <Button type="submit" disabled={submitting} className="w-full rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold" size="lg">
              {submitting ? 'A submeter...' : 'Entrar na lista de espera'}
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[hsl(var(--primary-deep))] text-primary-foreground py-10">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6 items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground font-display font-bold text-lg">H</div>
            <div>
              <div className="font-display text-xl">Handy<span className="text-accent font-normal">Flow</span></div>
              <p className="text-sm opacity-60">Orçamentos profissionais para a construção, em minutos.</p>
            </div>
          </div>
          <div className="text-sm opacity-60 md:text-right">
            © {new Date().getFullYear()} HandyFlow. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
