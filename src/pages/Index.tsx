import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowRight, Check, ShieldCheck, Clock, Sparkles, FileText, ClipboardList, Users } from 'lucide-react';
import heroScene from '@/assets/hero-scene.jpg';
import footerScene from '@/assets/footer-scene.jpg';
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
  { num: '01', title: 'Documento PDF', desc: 'Orçamento profissional pronto a enviar ao cliente, com a sua identidade.' },
  { num: '02', title: 'Detalhe completo', desc: 'Materiais, mão-de-obra, quantidades e totais — tudo discriminado.' },
  { num: '03', title: 'Templates seus', desc: 'Guarde serviços recorrentes e reutilize-os em segundos.' },
  { num: '04', title: 'Privacidade total', desc: 'Tudo processado localmente. Nada fica guardado.' },
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
      <nav className="absolute top-0 inset-x-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-display text-2xl text-foreground">
            HandyFlow
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-foreground/80">
            <a href="#fit" className="hover:text-foreground transition-colors">Onde encaixa</a>
            <a href="#checklist" className="hover:text-foreground transition-colors">É para si?</a>
            <a href="#receive" className="hover:text-foreground transition-colors">O que recebe</a>
            <a href="#time" className="hover:text-foreground transition-colors">Tempo</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin">
              <Button variant="ghost" size="sm">Admin</Button>
            </Link>
            <Link to="/quote">
              <Button size="sm" className="rounded-full">Criar orçamento</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - editorial split with scenic image below */}
      <section className="pt-28 md:pt-36 pb-0">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-start max-w-6xl mx-auto mb-12">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent mb-4">
                <span className="h-px w-8 bg-accent" />
                Para profissionais da construção
              </div>
              <h1 className="font-display text-5xl md:text-7xl leading-[1.05] text-foreground">
                {hero?.title || 'Orçamentos que simplesmente funcionam'}
              </h1>
            </div>
            <div className="md:pt-6">
              <p className="text-lg text-muted-foreground mb-6 max-w-md">
                {hero?.subtitle || 'Crie documentos profissionais em minutos. Sem registos, sem instalações, sem nada guardado nos nossos servidores.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/quote">
                  <Button size="lg" className="rounded-full gap-2">
                    Criar orçamento grátis <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#waitlist">
                  <Button size="lg" variant="outline" className="rounded-full">
                    Juntar-me à waitlist
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Scenic illustration - full width */}
        <div className="w-full overflow-hidden">
          <img
            src={heroScene}
            alt="Ilustração de obra de construção em paisagem"
            className="w-full h-auto object-cover"
            width={1920}
            height={1080}
          />
        </div>
      </section>

      {/* Where HandyFlow fits best */}
      <section id="fit" className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-accent mb-3">Onde encaixa</div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground">Onde o HandyFlow brilha</h2>
          </div>
          <div className="space-y-6">
            {fits.map((f) => (
              <div key={f.title} className="grid grid-cols-[160px_1fr] md:grid-cols-[240px_1fr] gap-6 items-center bg-card rounded-2xl border overflow-hidden">
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

      {/* Checklist - is this for you */}
      <section id="checklist" className="py-20 md:py-28 bg-secondary/40">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-10">
            <div className="text-xs uppercase tracking-widest text-accent mb-3">Faça o teste</div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground mb-3">É o HandyFlow para si?</h2>
            <p className="text-muted-foreground">Se assinalar três ou mais, vale a pena experimentar.</p>
          </div>
          <div className="bg-card rounded-2xl border shadow-sm p-6 md:p-8 space-y-4">
            {checklist.map((item, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-1 h-5 w-5 rounded-full border-2 border-border group-hover:border-primary flex items-center justify-center shrink-0 transition-colors">
                  <Check className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <div className="text-xs uppercase tracking-widest text-accent mb-3">O que vai receber</div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground">O que vai sair daqui</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {whatYouGet.map((item) => (
              <div key={item.num} className="bg-card rounded-2xl border p-6 hover:shadow-md transition-shadow">
                <div className="font-display text-3xl text-accent mb-3">{item.num}</div>
                <h3 className="font-display text-xl text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Time at a glance */}
      <section id="time" className="py-20 md:py-28 bg-secondary/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-accent mb-3">Tempo</div>
            <h2 className="font-display text-4xl md:text-5xl text-foreground">Tempo, em resumo</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {timeBlocks.map((b) => (
              <div key={b.label} className="bg-card rounded-2xl border p-6 text-center">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{b.label}</div>
                <div className="font-display text-3xl md:text-4xl text-foreground mb-2">{b.value}</div>
                <div className="text-xs text-muted-foreground">{b.sub}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            100% seguro · Os seus dados nunca são guardados nos nossos servidores
          </div>
        </div>
      </section>

      {/* Dark testimonial / quote card */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-foreground text-background rounded-3xl overflow-hidden grid md:grid-cols-[280px_1fr]">
            <div className="bg-accent flex items-center justify-center p-10">
              <Sparkles className="h-20 w-20 text-accent-foreground" />
            </div>
            <div className="p-8 md:p-12 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-accent shrink-0 mt-1" />
                  <div>
                    <div className="font-medium">Sem fricção</div>
                    <p className="text-sm opacity-70">Abre, preenche, exporta. Sem registos nem instalações.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ClipboardList className="h-5 w-5 text-accent shrink-0 mt-1" />
                  <div>
                    <div className="font-medium">Tudo no seu sítio</div>
                    <p className="text-sm opacity-70">Cliente, serviços, materiais, totais — fluxo guiado.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-accent shrink-0 mt-1" />
                  <div>
                    <div className="font-medium">Pensado para profissionais</div>
                    <p className="text-sm opacity-70">Construção, remodelações, canalização, eletricidade.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-accent shrink-0 mt-1" />
                  <div>
                    <div className="font-medium">Poupa horas por semana</div>
                    <p className="text-sm opacity-70">Templates reutilizáveis para serviços recorrentes.</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-background/10">
                <p className="font-display text-xl">"Como um orçamento devia ser feito."</p>
                <p className="text-sm opacity-60 mt-1">— Filosofia HandyFlow</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA + scenic image */}
      <section id="waitlist" className="pt-20 md:pt-28">
        <div className="container mx-auto px-4 max-w-2xl text-center mb-12">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            {content['cta']?.title || 'Pronto para experimentar?'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {content['cta']?.subtitle || 'Crie um orçamento agora ou junte-se à lista para novidades.'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <Link to="/quote">
              <Button size="lg" className="rounded-full gap-2">
                Criar orçamento <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <form onSubmit={handleWaitlist} className="space-y-3 max-w-md mx-auto text-left">
            <Input
              placeholder="O seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="email"
              required
              placeholder="O seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={submitting} variant="outline" className="w-full rounded-full" size="lg">
              {submitting ? 'A submeter...' : 'Entrar na lista de espera'}
            </Button>
          </form>
        </div>

        {/* Footer scenic */}
        <div className="w-full overflow-hidden">
          <img
            src={footerScene}
            alt="Ilustração de obra ao pôr-do-sol"
            className="w-full h-auto object-cover"
            loading="lazy"
            width={1920}
            height={1080}
          />
        </div>
      </section>

      {/* Footer bar */}
      <footer className="bg-foreground text-background py-10">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="font-display text-2xl mb-1">HandyFlow</div>
            <p className="text-sm opacity-60">Orçamentos profissionais para a construção, em minutos.</p>
          </div>
          <div className="text-sm opacity-60 md:text-right">
            © {new Date().getFullYear()} HandyFlow. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
