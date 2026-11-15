import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateResponse, GatewayError } from 'npm:@lovable.dev/ai-gateway';
import { z } from 'npm:zod@3';

const Body = z.object({ text: z.string().trim().min(10).max(4000), layout: z.enum(['classic', 'detailed', 'executive']).default('classic') });
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const str = { type: 'string' };
const num = { type: 'number' };
const schema = {
  type: 'object', additionalProperties: false,
  required: ['title', 'estimatedDuration', 'importantNotes', 'scope', 'services'],
  properties: {
    title: str, estimatedDuration: str, importantNotes: str, scope: str,
    services: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['name', 'description', 'pricePerHour', 'hours', 'framing', 'objective', 'steps', 'specs', 'materials'],
      properties: {
        name: str, description: str, pricePerHour: num, hours: num,
        framing: str, objective: str, steps: str, specs: str,
        materials: { type: 'array', items: { type: 'object', additionalProperties: false,
          required: ['name', 'quantity', 'unit', 'unitPrice'],
          properties: { name: str, quantity: num, unit: str, unitPrice: num } } },
      } } },
  },
};

const SYSTEM = `És um orçamentista experiente de obras e serviços em Portugal (PT-PT). Converte as notas do profissional num orçamento estruturado.
Regras:
- Agrupa o trabalho em serviços claros; descrição curta e profissional para o cliente.
- Usa as horas e preço/hora indicados; se faltarem, estima valores realistas do mercado português (preço/hora 15–35 €).
- Lista todos os materiais mencionados e os necessários óbvios, com quantidade, unidade (un, m², m, L, kg, saco, rolo, balde) e preço unitário estimado sem IVA em euros.
- Não incluas IVA nos preços.
- framing (enquadramento), objective, steps (uma etapa por linha) e specs (uma por linha) por serviço.
- estimatedDuration ex: "3 dias úteis". importantNotes: notas contratuais, uma por linha. scope: pontos do âmbito, um por linha.
- title: título curto do orçamento.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ error: 'Sessão necessária' }, 401);
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await sb.auth.getUser(auth.replace('Bearer ', ''));
  if (!u?.user) return json({ error: 'Sessão necessária' }, 401);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: 'Escreva pelo menos uma frase a descrever o trabalho.' }, 400);

  try {
    const res: any = await generateResponse({
      model: 'openai/gpt-6-astra',
      instructions: SYSTEM,
      input: parsed.data.text,
      store: false,
      text: { format: { type: 'json_schema', name: 'quote', strict: true, schema } },
    } as any);
    const out = res.output_text ?? (res.output || []).flatMap((o: any) => o.content || []).filter((c: any) => c.type === 'output_text').map((c: any) => c.text).join('');
    return json(JSON.parse(out));
  } catch (e) {
    console.error(e);
    if (e instanceof GatewayError && e.httpStatus === 429) return json({ error: 'Muitos pedidos. Tente daqui a pouco.' }, 429);
    if (e instanceof GatewayError && e.httpStatus === 402) return json({ error: 'Créditos de IA esgotados.' }, 402);
    return json({ error: 'Não foi possível gerar o orçamento. Tente novamente.' }, 500);
  }
});
