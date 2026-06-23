import { Link } from 'react-router-dom';
import { Shield, Clock, UserCheck, Trash2, Mail, Lock } from 'lucide-react';
import obreiroLogo from "@/assets/obreiro-logo.png.asset.json";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-[10px] bg-gradient-to-br from-accent to-[hsl(27_92%_60%)] text-white shadow-accent-glow"
              style={{ width: 32, height: 32 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1 }}>handyman</span>
            </div>
            <span className="font-heading font-bold text-lg tracking-tight text-foreground">
              Obreiro
            </span>
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Voltar ao site
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-accent-soft mb-4">
              <Shield className="h-6 w-6 text-accent" />
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground">
              Última actualização: Maio de 2026
            </p>
          </div>

          <div className="prose prose-slate max-w-none">
            <section className="mb-10">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-accent" />
                1. Quem somos
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                A Obreiro é uma plataforma de ferramentas para construtores portugueses, operada por Manoel & Reis, Unipessoal Lda. Esta política de privacidade descreve como recolhemos, usamos e protegemos os seus dados pessoais em conformidade com o Regulamento Geral de Protecção de Dados (RGPD) e a legislação portuguesa.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Contacto do Encarregado de Protecção de Dados (DPO): <span className="text-foreground font-medium">dpo@obreiro.app</span>
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-accent" />
                2. Que dados recolhemos
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p><strong className="text-foreground">2.1. Dados do gerador de orçamentos:</strong> Nome da empresa, NIF, morada, dados do cliente e itens do orçamento. <span className="text-accent font-medium">Importante:</span> estes dados são processados localmente no seu navegador e <strong className="text-foreground">nunca são guardados nos nossos servidores</strong>.</p>
                <p><strong className="text-foreground">2.2. Lista de espera (waitlist):</strong> Nome e endereço de email, com o seu consentimento explícito, para o envio de actualizações sobre o produto.</p>
                <p><strong className="text-foreground">2.3. Dados de analytics:</strong> Eventos anónimos sobre a utilização do gerador de orçamentos (ex: passos completados), sem identificação pessoal.</p>
                <p><strong className="text-foreground">2.4. Dados de conta (app):</strong> Quando a app completa estiver disponível, recolheremos email, nome e informações de perfil necessárias para o funcionamento do serviço.</p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                3. Base legal para o tratamento
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
                <li><strong className="text-foreground">Execução de contrato:</strong> para prestar os serviços da app completa quando contratada.</li>
                <li><strong className="text-foreground">Consentimento:</strong> para a lista de espera e comunicações de marketing. Pode retirar o consentimento a qualquer momento.</li>
                <li><strong className="text-foreground">Interesse legítimo:</strong> para melhorar a plataforma através de analytics anónimos.</li>
                <li><strong className="text-foreground">Obrigação legal:</strong> para cumprimento de obrigações fiscais e contabilísticas quando aplicável.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                4. Retenção de dados
              </h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p><strong className="text-foreground">Orçamentos:</strong> Não reteremos dados de orçamentos, pois são processados localmente no seu dispositivo.</p>
                <p><strong className="text-foreground">Lista de espera:</strong> Mantemos os dados enquanto mantiver interesse na plataforma ou até solicitar a remoção. Após a app estar disponível, transicionamos para a base de conta ou eliminamos após 2 anos de inactividade.</p>
                <p><strong className="text-foreground">Contas de utilizador:</strong> Durante a vigência da conta. Após o encerramento, os dados são eliminados no prazo de 30 dias, excepto quando a lei exige retenção por mais tempo.</p>
                <p><strong className="text-foreground">Logs e backups:</strong> Conservados por até 90 dias para segurança e resolução de problemas.</p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-accent" />
                5. Os seus direitos (RGPD)
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Enquanto titular dos dados, tem os seguintes direitos:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
                <li><strong className="text-foreground">Direito de acesso:</strong> solicitar cópia dos seus dados pessoais.</li>
                <li><strong className="text-foreground">Direito de rectificação:</strong> corrigir dados inexatos ou desactualizados.</li>
                <li><strong className="text-foreground">Direito ao esquecimento:</strong> solicitar a eliminação completa dos seus dados.</li>
                <li><strong className="text-foreground">Direito à limitação do tratamento:</strong> restringir o uso dos seus dados em determinadas circunstâncias.</li>
                <li><strong className="text-foreground">Direito à portabilidade:</strong> receber os seus dados num formato estruturado e de uso comum.</li>
                <li><strong className="text-foreground">Direito de oposição:</strong> opor-se ao tratamento para efeitos de marketing.</li>
                <li><strong className="text-foreground">Direito a não ser sujeito a decisões automatizadas:</strong> não usamos decisões automatizadas com efeitos legais.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Para exercer qualquer destes direitos, contacte-nos através do email <span className="text-foreground font-medium">dpo@obreiro.app</span>. Responderemos no prazo de 30 dias.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-accent" />
                6. Direito ao esquecimento
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Respeitamos integralmente o direito ao esquecimento. Quando solicita a eliminação da sua conta ou dados:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
                <li>Os dados pessoais são eliminados de forma irreversível no prazo de 30 dias.</li>
                <li>Os registos associados a clientes são eliminados em cascata para garantir que nenhum dado pessoal persistirá.</li>
                <li>Backups são actualizados de forma a que a eliminação seja propagada no ciclo normal de retenção.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                7. Partilha de dados com terceiros
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Não vendemos nem partilhamos os seus dados pessoais com terceiros para fins comerciais. Apenas utilizamos os seguintes sub-processadores essenciais:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
                <li><strong className="text-foreground">Lovable Cloud:</strong> infraestrutura de base de dados e autenticação.</li>
                <li><strong className="text-foreground">Email service providers:</strong> para envio de emails transaccionais (ex: orçamentos por email) e newsletters.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Todos os sub-processadores estão em conformidade com o RGPD e celebrámos acordos de processamento de dados (DPA) adequados.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-accent" />
                8. Segurança
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas técnicas e organizacionais adequadas para proteger os seus dados, incluindo encriptação em trânsito (TLS), encriptação em repouso, controlo de acesso baseado em roles (RLS) na base de dados, e auditorias regulares de segurança. No entanto, nenhum sistema é 100% seguro — por favor, mantenha as suas credenciais de acesso seguras.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-accent" />
                9. Contacto
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Para questões sobre privacidade, exercício de direitos ou reclamações, contacte o nosso Encarregado de Protecção de Dados:<br />
                <span className="text-foreground font-medium">Email: dpo@obreiro.app</span><br />
                <span className="text-muted-foreground">Resposta no prazo de 30 dias.</span>
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Tem também o direito de apresentar reclamação junto da <strong className="text-foreground">Comissão Nacional de Protecção de Dados (CNPD)</strong> se considerar que o tratamento dos seus dados viola a legislação em vigor.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Esta política pode ser actualizada periodicamente. Alterações significativas serão comunicadas por email ou através de aviso no site.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border bg-card">
        <div className="mx-auto max-w-[1180px] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Obreiro. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-foreground transition-colors">Voltar ao site</Link>
            <span className="text-muted-foreground/40">|</span>
            <span>Feito em Portugal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
