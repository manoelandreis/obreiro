import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, BarChart3, Users, ClipboardList, ArrowRight, CheckCircle2, ShieldCheck, Eye, Trash2 } from 'lucide-react';
import quoteMockup from '@/assets/quote-preview.png';

interface ContentSection {
  section_key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
}

const features = [
  { icon: FileText, title: 'Orçamentos Profissionais', desc: 'Crie orçamentos detalhados e com aspeto profissional em minutos.' },
  { icon: ClipboardList, title: 'Templates Reutilizáveis', desc: 'Use templates pré-definidos para os seus serviços mais comuns.' },
  { icon: BarChart3, title: 'Gestão Organizada', desc: 'Acompanhe todos os seus projetos e clientes num só lugar.' },
  { icon: Users, title: 'Impressione Clientes', desc: 'Transmita profissionalismo desde o primeiro contacto.' },
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
  const about = content['about'];
  const cta = content['cta'];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-heading text-xl font-bold text-primary">
            HandyFlow
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/quote">
              <Button variant="outline" size="sm">Criar Orçamento</Button>
            </Link>
            <Link to="/admin">
              <Button variant="ghost" size="sm">Admin</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            {hero?.title || 'Organize o seu negócio de construção'}
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            {hero?.subtitle || 'Crie orçamentos profissionais em minutos.'}
          </p>
          <p className="text-muted-foreground mb-8">
            {hero?.body || 'Ferramenta gratuita para builders e construtores.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quote">
              <Button size="lg" className="gap-2 text-base">
                Criar Orçamento Grátis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#waitlist">
              <Button size="lg" variant="outline" className="text-base">
                Juntar-me à Waitlist
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-foreground mb-3">
              {content['features']?.title || 'Tudo o que precisa para crescer'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {content['features']?.subtitle || 'Ferramentas pensadas para profissionais da construção'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-3">
            {about?.title || 'Sobre a HandyFlow'}
          </h2>
          <p className="text-lg text-muted-foreground mb-4">
            {about?.subtitle || ''}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {about?.body || ''}
          </p>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 max-w-lg text-center">
          <h2 className="font-heading text-3xl font-bold mb-3">
            {cta?.title || 'Pronto para começar?'}
          </h2>
          <p className="mb-8 opacity-90">
            {cta?.subtitle || 'Junte-se à lista de espera.'}
          </p>
          <form onSubmit={handleWaitlist} className="space-y-3">
            <Input
              placeholder="O seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
            />
            <Input
              type="email"
              required
              placeholder="O seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
            />
            <Button type="submit" disabled={submitting} variant="secondary" className="w-full" size="lg">
              {submitting ? 'A submeter...' : 'Entrar na Lista de Espera'}
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} HandyFlow. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
