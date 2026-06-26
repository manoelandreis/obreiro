// Password policy & strength evaluation for Obreiro auth flows.

export const COMMON_PASSWORDS = new Set<string>([
  '123456', '1234567', '12345678', '123456789', '1234567890',
  'password', 'password1', 'password123', 'passw0rd', 'p@ssw0rd',
  'qwerty', 'qwerty123', 'qwertyuiop', 'abc123', 'abcd1234',
  '111111', '000000', '123123', '654321', '987654321',
  'iloveyou', 'admin', 'admin123', 'welcome', 'welcome1',
  'letmein', 'monkey', 'dragon', 'master', 'sunshine',
  'princess', 'football', 'baseball', 'shadow', 'superman',
  'obreiro', 'obreiro123', 'portugal', 'benfica', 'porto',
  'sporting', 'lisboa', 'palavrapasse', 'palavra-passe',
  'palavrasecreta', 'segredo', 'senha', 'senha123', 'mudar123',
  'changeme', 'temporary', 'temp1234',
]);

export interface PasswordChecks {
  minLength: boolean;   // >= 8
  variety: boolean;     // at least letters + digits, or 3 of 4 classes
  notCommon: boolean;   // not in COMMON_PASSWORDS
  notPersonal: boolean; // doesn't match name/email
}

export interface PasswordEvaluation {
  score: 0 | 1 | 2 | 3;
  label: 'fraca' | 'média' | 'forte';
  checks: PasswordChecks;
  valid: boolean;
}

function classesOf(pw: string): number {
  let c = 0;
  if (/[a-z]/.test(pw)) c++;
  if (/[A-Z]/.test(pw)) c++;
  if (/\d/.test(pw)) c++;
  if (/[^A-Za-z0-9]/.test(pw)) c++;
  return c;
}

export function evaluatePassword(
  password: string,
  ctx: { email?: string; name?: string } = {},
): PasswordEvaluation {
  const pw = password ?? '';
  const lower = pw.toLowerCase();
  const emailLocal = (ctx.email ?? '').toLowerCase().split('@')[0] ?? '';
  const name = (ctx.name ?? '').toLowerCase().trim();

  const classes = classesOf(pw);

  const checks: PasswordChecks = {
    minLength: pw.length >= 8,
    variety: classes >= 2 && /[a-zA-Z]/.test(pw) && /\d/.test(pw) ? true : classes >= 3,
    notCommon: pw.length > 0 && !COMMON_PASSWORDS.has(lower),
    notPersonal:
      pw.length > 0 &&
      (emailLocal.length < 3 || !lower.includes(emailLocal)) &&
      (name.length < 3 || !lower.includes(name)),
  };

  const passed = Object.values(checks).filter(Boolean).length;
  let score: 0 | 1 | 2 | 3 = 0;
  if (passed === 4 && pw.length >= 12 && classes >= 3) score = 3;
  else if (passed === 4) score = 2;
  else if (passed >= 2) score = 1;
  else score = 0;

  const valid = checks.minLength && checks.variety && checks.notCommon && checks.notPersonal;
  const label: PasswordEvaluation['label'] = score >= 3 ? 'forte' : score === 2 ? 'média' : 'fraca';

  return { score, label, checks, valid };
}
