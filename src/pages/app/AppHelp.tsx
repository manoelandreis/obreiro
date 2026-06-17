import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileText, Users, Building2, ShieldCheck, HelpCircle } from 'lucide-react';

type FaqItem = { q: string; a: React.ReactNode };
type FaqSection = { id: string; title: string; description: string; icon: React.ElementType; items: FaqItem[] };

const sections: FaqSection[] = [
  {
    id: 'orcamentos',
    title: 'Orçamentos',
    description: 'Criar, partilhar e gerir os seus orçamentos.',
    icon: FileText,
    items: [
      {
        q: 'Como criar um novo orçamento?',
        a: (
          <>
            Vá a <strong>Orçamentos</strong> e clique em <strong>Novo orçamento</strong>. Escolha um cliente
            (ou crie um novo), adicione serviços com mão de obra e materiais, e o total com IVA (23%) é
            calculado automaticamente.
          </>
        ),
      },
      {
        q: 'Como envio o orçamento por WhatsApp?',
        a: (
          <>
            Abra o orçamento e na barra de ações clique em <strong>WhatsApp</strong>. Abre uma conversa com
            o cliente já preenchida com o link público do orçamento. O cliente precisa de ter telefone
            preenchido na ficha.
          </>
        ),
      },
      {
        q: 'Como envio por email ou descarrego o PDF?',
        a: (
          <>
            Na mesma barra de ações tem <strong>Email</strong> (envia o orçamento com PDF em anexo) e
            <strong> Descarregar</strong> (gera o PDF para guardar ou imprimir).
          </>
        ),
      },
      {
        q: 'O que é "Ver como o cliente vê" e "Copiar link"?',
        a: (
          <>
            <strong>Ver como o cliente vê</strong> abre a página pública do orçamento, exactamente como
            o seu cliente a vê. <strong>Copiar link</strong> copia esse endereço para colar onde quiser.
          </>
        ),
      },
      {
        q: 'Posso saber se o cliente já viu o orçamento?',
        a: (
          <>
            Sim. No topo do orçamento aparece um indicador (<em>"Visualizado"</em> ou <em>"Ainda não
            visualizado"</em>) actualizado automaticamente quando o cliente abre o link público.
          </>
        ),
      },
    ],
  },
  {
    id: 'clientes',
    title: 'Clientes',
    description: 'A sua agenda de contactos profissionais.',
    icon: Users,
    items: [
      {
        q: 'Para que serve a secção Clientes?',
        a: (
          <>
            É a sua base de contactos. Cada cliente guarda nome, email, telefone e NIF para reutilizar
            rapidamente em novos orçamentos, sem precisar de voltar a escrever os dados.
          </>
        ),
      },
      {
        q: 'Como crio um novo cliente?',
        a: (
          <>
            Em <strong>Clientes</strong> clique em <strong>Novo cliente</strong> e preencha os dados.
            Também pode criar clientes directamente ao fazer um novo orçamento.
          </>
        ),
      },
      {
        q: 'Posso ver o histórico de orçamentos de um cliente?',
        a: 'Sim. Ao abrir a ficha do cliente vê todos os orçamentos associados, com estado e valor.',
      },
      {
        q: 'Como apago um cliente?',
        a: (
          <>
            Na ficha do cliente use a opção <strong>Eliminar</strong>. Por questões de RGPD (Direito ao
            Esquecimento), apagar um cliente remove também os orçamentos associados de forma permanente.
          </>
        ),
      },
    ],
  },
  {
    id: 'definicoes',
    title: 'Definições',
    description: 'A sua marca e os dados que aparecem nos orçamentos.',
    icon: Building2,
    items: [
      {
        q: 'Para que serve a secção Definições?',
        a: (
          <>
            É onde configura a sua <strong>marca</strong>: nome da empresa, NIF, morada, contactos e
            logótipo. Estes dados aparecem automaticamente no cabeçalho de todos os orçamentos.
          </>
        ),
      },
      {
        q: 'Como adiciono o meu logótipo?',
        a: 'Em Definições, na zona de marca, carregue a imagem do logótipo. Recomendamos PNG com fundo transparente.',
      },
      {
        q: 'Posso definir condições de pagamento padrão?',
        a: 'Sim. Pode configurar termos de pagamento que ficam pré-preenchidos em cada novo orçamento, e ajustar caso a caso.',
      },
      {
        q: 'A minha conta — onde altero email e palavra-passe?',
        a: (
          <>
            Em <strong>Conta</strong> pode actualizar o email, a palavra-passe e terminar sessão em todos
            os dispositivos.
          </>
        ),
      },
    ],
  },
  {
    id: 'seguranca',
    title: 'Segurança',
    description: 'Como protegemos os seus dados e os dos seus clientes.',
    icon: ShieldCheck,
    items: [
      {
        q: 'Como activo o PIN de bloqueio da app?',
        a: (
          <>
            Em <strong>Conta &gt; Segurança</strong> active o PIN. A app passa a pedir o código sempre
            que abrir uma nova sessão no navegador, evitando que outras pessoas vejam os seus dados.
          </>
        ),
      },
      {
        q: 'Os meus orçamentos são privados?',
        a: (
          <>
            Sim. Só você (com a sua conta) vê os seus orçamentos e clientes. O link público de um
            orçamento só funciona para quem o tiver — partilhe apenas com o cliente em causa.
          </>
        ),
      },
      {
        q: 'O que acontece se apagar um cliente?',
        a: 'Em conformidade com o RGPD, os dados do cliente e os orçamentos associados são eliminados de forma definitiva e não recuperável.',
      },
      {
        q: 'Onde ficam guardados os meus dados?',
        a: 'Em infraestrutura europeia (UE), com encriptação em trânsito e em repouso, e acesso restrito por autenticação.',
      },
      {
        q: 'Como termino sessão em todos os dispositivos?',
        a: 'Na barra lateral clique em Sair. Para forçar a saída em todos os dispositivos, altere a sua palavra-passe nas Definições.',
      },
    ],
  },
];

export default function AppHelp() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-accent">
          <HelpCircle className="h-5 w-5" />
          <span className="text-xs font-medium uppercase tracking-wide">Centro de ajuda</span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Como podemos ajudar?</h1>
        <p className="text-muted-foreground">
          Respostas rápidas às dúvidas mais comuns sobre o Obreiro.
        </p>
      </header>

      <div className="space-y-6">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <section.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">{section.title}</h2>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {section.items.map((item, idx) => (
                <AccordionItem key={idx} value={`${section.id}-${idx}`}>
                  <AccordionTrigger className="text-left text-sm sm:text-base font-medium">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>
    </div>
  );
}
