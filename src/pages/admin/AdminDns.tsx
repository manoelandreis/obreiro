import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, Globe, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

type DohAnswer = { name: string; type: number; TTL: number; data: string };
type DohResp = { Status: number; Answer?: DohAnswer[]; Authority?: DohAnswer[] };

const TYPE_NAMES: Record<number, string> = { 1: 'A', 2: 'NS', 5: 'CNAME', 15: 'MX', 16: 'TXT', 28: 'AAAA', 257: 'CAA' };

async function dohQuery(name: string, type: string): Promise<DohResp> {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
  if (!res.ok) throw new Error(`DNS query failed: ${res.status}`);
  return res.json();
}

type Check = {
  label: string;
  type: string;
  name: string;
  records: string[];
  status: 'ok' | 'warn' | 'error' | 'info';
  message: string;
};

const DEFAULT_DOMAIN = 'obreiro.pt';
const NOTIFY_SUBDOMAIN = 'notify.obreiro.pt';
const EXPECTED_NS = ['ns3.lovable.cloud', 'ns4.lovable.cloud'];

function normalizeNs(s: string) {
  return s.replace(/\.$/, '').toLowerCase();
}

export default function AdminDns() {
  const [domain, setDomain] = useState(DEFAULT_DOMAIN);
  const [notifyDomain, setNotifyDomain] = useState(NOTIFY_SUBDOMAIN);
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    const results: Check[] = [];
    try {
      // Root NS
      const rootNs = await dohQuery(domain, 'NS');
      const rootNsRecords = (rootNs.Answer ?? []).map((a) => normalizeNs(a.data));
      const isLovableRoot = rootNsRecords.some((n) => n.includes('lovable.cloud'));
      results.push({
        label: `${domain} — Nameservers (NS)`,
        type: 'NS',
        name: domain,
        records: rootNsRecords,
        status: rootNsRecords.length === 0 ? 'error' : isLovableRoot ? 'warn' : 'ok',
        message:
          rootNsRecords.length === 0
            ? 'Sem NS — domínio não resolve.'
            : isLovableRoot
              ? 'NS do apex apontam para Lovable. Verifica conflito com A/MX do registrar.'
              : `NS do registrar (${rootNsRecords.length}).`,
      });

      // Root A
      const rootA = await dohQuery(domain, 'A');
      const aRecs = (rootA.Answer ?? []).map((a) => a.data);
      results.push({
        label: `${domain} — A`,
        type: 'A',
        name: domain,
        records: aRecs,
        status: aRecs.includes('185.158.133.1') ? 'ok' : aRecs.length ? 'warn' : 'error',
        message: aRecs.includes('185.158.133.1')
          ? 'Aponta para Lovable (185.158.133.1).'
          : aRecs.length
            ? 'A record não aponta para Lovable.'
            : 'Sem A record.',
      });

      // Root MX
      const rootMx = await dohQuery(domain, 'MX');
      const mxRecs = (rootMx.Answer ?? []).map((a) => a.data);
      const hasZohoMx = mxRecs.some((m) => m.toLowerCase().includes('zoho'));
      results.push({
        label: `${domain} — MX`,
        type: 'MX',
        name: domain,
        records: mxRecs,
        status: mxRecs.length === 0 ? 'warn' : hasZohoMx ? 'ok' : 'info',
        message: mxRecs.length === 0
          ? 'Sem MX — não recebe email no apex.'
          : hasZohoMx
            ? 'MX Zoho configurado.'
            : `${mxRecs.length} registo(s) MX.`,
      });

      // Root TXT (SPF + verifications)
      const rootTxt = await dohQuery(domain, 'TXT');
      const txtRecs = (rootTxt.Answer ?? []).map((a) => a.data.replace(/"/g, ''));
      const spf = txtRecs.filter((t) => t.toLowerCase().startsWith('v=spf1'));
      results.push({
        label: `${domain} — SPF (TXT v=spf1)`,
        type: 'TXT',
        name: domain,
        records: spf,
        status: spf.length === 1 ? 'ok' : spf.length === 0 ? 'warn' : 'error',
        message:
          spf.length === 0
            ? 'Sem SPF — emails do apex podem ir para spam.'
            : spf.length > 1
              ? 'Múltiplos SPF — inválido segundo RFC 7208. Consolida em 1 registo.'
              : 'SPF presente.',
      });

      // DMARC
      const dmarc = await dohQuery(`_dmarc.${domain}`, 'TXT');
      const dmarcRecs = (dmarc.Answer ?? []).map((a) => a.data.replace(/"/g, ''));
      results.push({
        label: `_dmarc.${domain} — DMARC`,
        type: 'TXT',
        name: `_dmarc.${domain}`,
        records: dmarcRecs,
        status: dmarcRecs.length ? 'ok' : 'warn',
        message: dmarcRecs.length ? 'DMARC configurado.' : 'Sem DMARC — recomendado p/ deliverability.',
      });

      // Notify subdomain NS
      const notifyNs = await dohQuery(notifyDomain, 'NS');
      const notifyNsRecs = (notifyNs.Answer ?? notifyNs.Authority ?? []).map((a) => normalizeNs(a.data));
      const hasLovableNs = EXPECTED_NS.every((ns) => notifyNsRecs.includes(ns));
      results.push({
        label: `${notifyDomain} — NS (delegação Lovable)`,
        type: 'NS',
        name: notifyDomain,
        records: notifyNsRecs,
        status: hasLovableNs ? 'ok' : notifyNsRecs.length ? 'warn' : 'error',
        message: hasLovableNs
          ? 'Delegação correcta para ns3/ns4.lovable.cloud.'
          : notifyNsRecs.length
            ? 'NS encontrados mas não correspondem a Lovable.'
            : 'Sem NS — delegação em falta. Emails da app não saem.',
      });

      // Notify MX / SPF / DKIM (gerido pela Lovable)
      const notifyMx = await dohQuery(notifyDomain, 'MX');
      const notifyMxRecs = (notifyMx.Answer ?? []).map((a) => a.data);
      results.push({
        label: `${notifyDomain} — MX`,
        type: 'MX',
        name: notifyDomain,
        records: notifyMxRecs,
        status: notifyMxRecs.length ? 'ok' : 'warn',
        message: notifyMxRecs.length ? 'MX presente (gerido por Lovable).' : 'Sem MX no subdomínio de envio.',
      });

      const notifySpf = await dohQuery(notifyDomain, 'TXT');
      const notifySpfRecs = (notifySpf.Answer ?? []).map((a) => a.data.replace(/"/g, ''));
      const notifySpfOnly = notifySpfRecs.filter((t) => t.toLowerCase().startsWith('v=spf1'));
      results.push({
        label: `${notifyDomain} — SPF`,
        type: 'TXT',
        name: notifyDomain,
        records: notifySpfOnly,
        status: notifySpfOnly.length === 1 ? 'ok' : 'warn',
        message: notifySpfOnly.length === 1 ? 'SPF do subdomínio OK.' : 'SPF em falta ou duplicado.',
      });

      // DKIM (selector lovable padrão) — testa selector comum
      const dkimSelectors = ['lovable._domainkey', 'default._domainkey'];
      for (const sel of dkimSelectors) {
        try {
          const dkim = await dohQuery(`${sel}.${notifyDomain}`, 'TXT');
          const dkimRecs = (dkim.Answer ?? []).map((a) => a.data.replace(/"/g, ''));
          if (dkimRecs.length) {
            results.push({
              label: `${sel}.${notifyDomain} — DKIM`,
              type: 'TXT',
              name: `${sel}.${notifyDomain}`,
              records: dkimRecs.map((r) => (r.length > 80 ? r.slice(0, 80) + '…' : r)),
              status: 'ok',
              message: 'DKIM presente.',
            });
            break;
          }
        } catch { /* ignore */ }
      }

      setChecks(results);
      setLastRun(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [domain, notifyDomain]);

  useEffect(() => { void run(); }, [run]);

  const conflicts = checks.filter((c) => c.status === 'error' || c.status === 'warn');

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
            <Globe className="h-7 w-7 text-accent" /> Estado DNS
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Verificação em tempo real via Google DNS-over-HTTPS.
            {lastRun && <> Última verificação: {lastRun.toLocaleTimeString('pt-PT')}.</>}
          </p>
        </div>
        <Button onClick={run} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Verificar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domínios a verificar</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="domain">Domínio principal</Label>
            <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value.trim())} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notify">Subdomínio de envio</Label>
            <Input id="notify" value={notifyDomain} onChange={(e) => setNotifyDomain(e.target.value.trim())} />
          </div>
        </CardContent>
      </Card>

      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{conflicts.length} aviso(s) / conflito(s) detectado(s)</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              {conflicts.map((c, i) => (
                <li key={i}><strong>{c.label}:</strong> {c.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3">
        {checks.map((c, i) => (
          <Card key={i}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {c.status === 'ok' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {c.status === 'warn' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {c.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                  {c.status === 'info' && <CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
                  {c.label}
                </CardTitle>
                <CardDescription className="mt-1">{c.message}</CardDescription>
              </div>
              <Badge variant="outline">{c.type}</Badge>
            </CardHeader>
            <CardContent>
              {c.records.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Sem registos.</p>
              ) : (
                <ul className="space-y-1 text-sm font-mono bg-muted/40 rounded p-3 break-all">
                  {c.records.map((r, j) => <li key={j}>{r}</li>)}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
        {loading && checks.length === 0 && (
          <p className="text-muted-foreground text-sm">A consultar DNS…</p>
        )}
      </div>
    </div>
  );
}
