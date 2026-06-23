// Portuguese-aware validators for company/brand fields.
// Pure functions — return a human-readable error message (PT) or null when valid.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(v: string): string | null {
  if (!v) return null;
  if (v.length > 255) return 'Email demasiado longo.';
  if (!EMAIL_RE.test(v)) return 'Email inválido.';
  return null;
}

export function validatePhonePT(v: string): string | null {
  if (!v) return null;
  const digits = v.replace(/[\s()-]/g, '');
  if (!/^\+?\d+$/.test(digits)) return 'Use apenas números, espaços, + ( ) -.';
  const national = digits.replace(/^\+351/, '').replace(/^00351/, '');
  if (national.length !== 9) return 'Número português deve ter 9 dígitos.';
  if (!/^[239]/.test(national)) return 'Número inválido (deve começar por 2, 3 ou 9).';
  return null;
}

export function validateMbway(v: string): string | null {
  if (!v) return null;
  const digits = v.replace(/[\s()-]/g, '');
  if (!/^\+?\d+$/.test(digits)) return 'Use apenas números, espaços, + ( ) -.';
  const national = digits.replace(/^\+351/, '').replace(/^00351/, '');
  if (national.length !== 9) return 'Telemóvel português deve ter 9 dígitos.';
  if (!/^9/.test(national)) return 'MBWay requer um número de telemóvel (começa por 9).';
  return null;
}

export function validateNifPT(v: string): string | null {
  if (!v) return null;
  const n = v.replace(/\s/g, '');
  if (!/^\d{9}$/.test(n)) return 'NIF deve ter 9 dígitos.';
  const digits = n.split('').map(Number);
  const sum = digits.slice(0, 8).reduce((acc, d, i) => acc + d * (9 - i), 0);
  const mod = sum % 11;
  const check = mod < 2 ? 0 : 11 - mod;
  if (check !== digits[8]) return 'NIF inválido (dígito de controlo).';
  return null;
}

export function validateIbanPT(v: string): string | null {
  if (!v) return null;
  const iban = v.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return 'IBAN inválido.';
  if (iban.startsWith('PT') && iban.length !== 25) return 'IBAN português deve ter 25 caracteres.';
  if (iban.length < 15 || iban.length > 34) return 'IBAN com tamanho inválido.';
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const expanded = rearranged.replace(/[A-Z]/g, (c) => (c.charCodeAt(0) - 55).toString());
  let remainder = 0;
  for (let i = 0; i < expanded.length; i++) {
    remainder = (remainder * 10 + Number(expanded[i])) % 97;
  }
  if (remainder !== 1) return 'IBAN inválido (verificação falhou).';
  return null;
}

export type CompanyErrors = Partial<Record<'nif' | 'email' | 'phone' | 'mbway' | 'iban', string>>;

export interface CompanyValidationInput {
  nif?: string;
  email?: string;
  phone?: string;
  mbway?: string;
  iban?: string;
}

export function validateCompanyFields(input: CompanyValidationInput): CompanyErrors {
  const errs: CompanyErrors = {};
  const nif = validateNifPT((input.nif ?? '').trim());
  if (nif) errs.nif = nif;
  const email = validateEmail((input.email ?? '').trim());
  if (email) errs.email = email;
  const phone = validatePhonePT((input.phone ?? '').trim());
  if (phone) errs.phone = phone;
  const mb = validateMbway((input.mbway ?? '').trim());
  if (mb) errs.mbway = mb;
  const iban = validateIbanPT((input.iban ?? '').trim());
  if (iban) errs.iban = iban;
  return errs;
}
