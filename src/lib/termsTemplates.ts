export interface TermsTemplate {
  id: string;
  name: string;
  content: string;
}

export const createEmptyTermsTemplate = (name = 'Novo modelo'): TermsTemplate => ({
  id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? (crypto as any).randomUUID()
    : `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`) as string,
  name,
  content: '',
});

export const DEFAULT_TERMS_CONTENT =
  '1. Os preços são válidos por 30 dias.\n2. Eventuais alterações ao projeto serão orçamentadas em separado.\n3. Os trabalhos só iniciam após aceitação por escrito e pagamento de sinal.\n4. Garantia de 2 anos sobre mão de obra.';
