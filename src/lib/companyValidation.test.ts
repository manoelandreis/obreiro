import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhonePT,
  validateMbway,
  validateNifPT,
  validateIbanPT,
  validateCompanyFields,
} from './companyValidation';

describe('validateEmail', () => {
  it('aceita vazio (campo opcional)', () => {
    expect(validateEmail('')).toBeNull();
  });
  it('aceita email válido', () => {
    expect(validateEmail('geral@silvaconstrucoes.pt')).toBeNull();
    expect(validateEmail('a.b+tag@example.co.uk')).toBeNull();
  });
  it('rejeita email sem @', () => {
    expect(validateEmail('geral.silvaconstrucoes.pt')).toBe('Email inválido.');
  });
  it('rejeita email sem domínio', () => {
    expect(validateEmail('geral@')).toBe('Email inválido.');
    expect(validateEmail('geral@x')).toBe('Email inválido.');
  });
  it('rejeita email demasiado longo', () => {
    const long = 'a'.repeat(250) + '@x.pt';
    expect(validateEmail(long)).toBe('Email demasiado longo.');
  });
});

describe('validatePhonePT', () => {
  it('aceita vazio', () => {
    expect(validatePhonePT('')).toBeNull();
  });
  it('aceita formato internacional com espaços', () => {
    expect(validatePhonePT('+351 912 345 678')).toBeNull();
  });
  it('aceita 00351', () => {
    expect(validatePhonePT('00351912345678')).toBeNull();
  });
  it('aceita 9 dígitos nacionais começados por 2/3/9', () => {
    expect(validatePhonePT('212345678')).toBeNull();
    expect(validatePhonePT('300123456')).toBeNull();
    expect(validatePhonePT('912345678')).toBeNull();
  });
  it('rejeita números com menos de 9 dígitos', () => {
    expect(validatePhonePT('91234567')).toBe('Número português deve ter 9 dígitos.');
  });
  it('rejeita prefixos inválidos', () => {
    expect(validatePhonePT('512345678')).toBe('Número inválido (deve começar por 2, 3 ou 9).');
  });
  it('rejeita caracteres não permitidos', () => {
    expect(validatePhonePT('912.345.678')).toBe('Use apenas números, espaços, + ( ) -.');
    expect(validatePhonePT('912abc678')).toBe('Use apenas números, espaços, + ( ) -.');
  });
});

describe('validateMbway', () => {
  it('aceita vazio', () => {
    expect(validateMbway('')).toBeNull();
  });
  it('aceita telemóvel português', () => {
    expect(validateMbway('+351 912 345 678')).toBeNull();
    expect(validateMbway('912345678')).toBeNull();
  });
  it('rejeita fixo (começa por 2)', () => {
    expect(validateMbway('212345678')).toBe('MBWay requer um número de telemóvel (começa por 9).');
  });
  it('rejeita comprimento errado', () => {
    expect(validateMbway('91234567')).toBe('Telemóvel português deve ter 9 dígitos.');
  });
});

describe('validateNifPT', () => {
  it('aceita vazio', () => {
    expect(validateNifPT('')).toBeNull();
  });
  it('aceita NIFs com dígito de controlo correto', () => {
    expect(validateNifPT('509123457')).toBeNull();
    expect(validateNifPT('123456789')).toBeNull();
    expect(validateNifPT('500000000')).toBeNull();
  });

  it('rejeita comprimento errado', () => {
    expect(validateNifPT('12345678')).toBe('NIF deve ter 9 dígitos.');
    expect(validateNifPT('1234567890')).toBe('NIF deve ter 9 dígitos.');
  });
  it('rejeita não numérico', () => {
    expect(validateNifPT('12345678A')).toBe('NIF deve ter 9 dígitos.');
  });
  it('rejeita NIF com checksum errado', () => {
    expect(validateNifPT('509123456')).toBe('NIF inválido (dígito de controlo).');
    expect(validateNifPT('111111111')).toBe('NIF inválido (dígito de controlo).');

  });
});

describe('validateIbanPT', () => {
  it('aceita vazio', () => {
    expect(validateIbanPT('')).toBeNull();
  });
  it('aceita IBAN PT válido com e sem espaços', () => {
    expect(validateIbanPT('PT50 0002 0123 1234 5678 9015 4')).toBeNull();
    expect(validateIbanPT('PT50000201231234567890154')).toBeNull();
  });
  it('aceita lower-case e normaliza', () => {
    expect(validateIbanPT('pt50000201231234567890154')).toBeNull();
  });
  it('rejeita comprimento PT errado', () => {
    expect(validateIbanPT('PT5000020123123456789015')).toBe('IBAN português deve ter 25 caracteres.');
  });
  it('rejeita checksum mod-97 inválido', () => {
    expect(validateIbanPT('PT50000201231234567890155')).toBe('IBAN inválido (verificação falhou).');
  });
  it('rejeita formato inválido', () => {
    expect(validateIbanPT('1234567890')).toBe('IBAN inválido.');
  });
});

describe('validateCompanyFields (bloqueio de save)', () => {
  it('devolve objecto vazio quando tudo é válido', () => {
    const errs = validateCompanyFields({
      nif: '509123457',
      email: 'geral@silvaconstrucoes.pt',
      phone: '+351 912 345 678',
      mbway: '912345678',
      iban: 'PT50 0002 0123 1234 5678 9015 4',
    });
    expect(errs).toEqual({});
  });

  it('devolve objecto vazio quando todos vazios (opcionais)', () => {
    expect(validateCompanyFields({})).toEqual({});
  });

  it('acumula erros de múltiplos campos', () => {
    const errs = validateCompanyFields({
      nif: '111111111',
      email: 'invalido',
      phone: '12',
      mbway: '212345678',
      iban: 'NOT-AN-IBAN',
    });
    expect(errs.nif).toBeTruthy();
    expect(errs.email).toBeTruthy();
    expect(errs.phone).toBeTruthy();
    expect(errs.mbway).toBeTruthy();
    expect(errs.iban).toBeTruthy();
    expect(Object.keys(errs).length).toBe(5);
  });

  it('faz trim dos valores antes de validar', () => {
    const errs = validateCompanyFields({
      email: '  geral@silvaconstrucoes.pt  ',
      nif: '  509123457  ',
    });
    expect(errs).toEqual({});
  });
});
