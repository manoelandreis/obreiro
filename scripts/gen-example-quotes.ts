// @ts-ignore
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0 } as any;
import { buildQuoteHtml, type QuoteRenderData } from '../src/lib/quotePdf';
import { PAYMENT_PRESETS } from '../src/lib/paymentTerms';
import { writeFileSync, mkdirSync } from 'fs';
// playwright rendering done via python script

const BRAND = {
  logoUrl: null,
  primary: '#1B3A5C',
  accent: '#E8730A',
  description: null,
  terms: null,
  paymentConditions: null,
  validityDays: 30,
};

function calcTotals(services: any[]) {
  const subtotal = services.reduce((sum, s) => {
    const labor = (s.pricePerHour || 0) * (s.hours || 0);
    const mats = (s.materials || []).reduce((a: number, m: any) => a + m.quantity * m.unitPrice, 0);
    return sum + labor + mats;
  }, 0);
  const iva = +(subtotal * 0.23).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), iva, total: +(subtotal + iva).toFixed(2) };
}

const baseServices = {
  canalizacao: [{
    name: 'Reparação de fuga na cozinha',
    description: 'Diagnóstico e reparação de fuga no sifão, substituição de torneira monocomando e revisão da instalação.',
    pricePerHour: 30, hours: 3,
    materials: [
      { name: 'Torneira monocomando Grohe Eurosmart', quantity: 1, unit: 'un', unitPrice: 65 },
      { name: 'Sifão extensível 1½"', quantity: 1, unit: 'un', unitPrice: 12.5 },
      { name: 'Fita teflon + vedante', quantity: 1, unit: 'kit', unitPrice: 6 },
    ],
  }],
  pintura: [{
    name: 'Pintura interior — Apartamento T2',
    description: 'Preparação de paredes e tectos (lixagem, betumagem e isolamento), aplicação de primário e duas demãos de tinta plástica mate em todas as divisões (sala, cozinha, 2 quartos, hall).',
    pricePerHour: 20, hours: 24,
    materials: [
      { name: 'Tinta plástica CIN Vinylsoft Mate (Branco)', quantity: 15, unit: 'L', unitPrice: 9.45 },
      { name: 'Primário selante CIN', quantity: 5, unit: 'L', unitPrice: 8.20 },
      { name: 'Material consumível (fitas, lixas, rolos)', quantity: 1, unit: 'kit', unitPrice: 38 },
    ],
  }],
  remodelacao: [
    {
      name: 'Remodelação integral de casa de banho',
      description: 'Demolição de revestimentos existentes, regularização de paredes e pavimento, aplicação de cerâmica, instalação de loiças sanitárias e móvel de apoio.',
      pricePerHour: 25, hours: 60,
      materials: [
        { name: 'Cerâmica parede 30x60 (Recer)', quantity: 28, unit: 'm²', unitPrice: 18.50 },
        { name: 'Pavimento porcelânico 60x60', quantity: 8, unit: 'm²', unitPrice: 24 },
        { name: 'Sanita suspensa Roca + autoclismo', quantity: 1, unit: 'un', unitPrice: 285 },
        { name: 'Móvel WC com lavatório (80cm)', quantity: 1, unit: 'un', unitPrice: 240 },
      ],
    },
    {
      name: 'Trabalhos de canalização e eletricidade',
      description: 'Substituição completa de redes de água quente/fria, esgotos e ponto de iluminação LED.',
      pricePerHour: 28, hours: 16,
      materials: [],
    },
  ],
};

const QUOTES: Array<{ slug: string; data: QuoteRenderData }> = [
  {
    slug: 'canalizacao',
    data: {
      title: 'Reparação de fuga + substituição',
      company: { name: 'Silva Canalizações Lda.', nif: '509234567', phone: '+351 912 345 678', email: 'geral@silvacanal.pt', address: 'Rua das Flores 23, 1200-195 Lisboa' },
      client: { name: 'Sr. António Marques', phone: '+351 962 111 222', email: 'antonio.marques@email.pt', address: 'Av. da República 145, 3º Dto, 1050-191 Lisboa' },
      services: baseServices.canalizacao,
      notes: 'Garantia de 6 meses sobre mão de obra. Materiais com garantia do fabricante.',
      ...calcTotals(baseServices.canalizacao),
      createdAt: '2026-05-16',
      expiresAt: '2026-06-15',
      paymentTerms: null,
    },
  },
  {
    slug: 'pintura',
    data: {
      title: 'Pintura interior de apartamento T2',
      company: { name: 'Costa Pintores', nif: '512887091', phone: '+351 935 778 200', email: 'obras@costapintores.pt', address: 'Rua do Almada 88, 4050-038 Porto' },
      client: { name: 'Sra. Helena Almeida', phone: '+351 919 555 100', email: 'helena.almeida@email.pt', address: 'Travessa do Sol 12, 1º, 4200-447 Porto' },
      services: baseServices.pintura,
      notes: 'Inclui proteção de mobiliário e limpeza final. Cor à escolha do cliente da gama base.',
      ...calcTotals(baseServices.pintura),
      createdAt: '2026-05-16',
      expiresAt: '2026-06-30',
      paymentTerms: { preset: '50_50', installments: PAYMENT_PRESETS.find(p=>p.id==='50_50')!.installments },
      paymentAnchor: '2026-05-16',
    },
  },
  {
    slug: 'remodelacao',
    data: {
      title: 'Remodelação integral de casa de banho',
      company: { name: 'Braga Obras & Remodelações', nif: '514002339', phone: '+351 939 887 654', email: 'info@bragaobras.pt', address: 'Rua de São Vicente 56, 4700-310 Braga' },
      client: { name: 'Família Costa', phone: '+351 967 322 411', email: 'joana.costa@email.pt', address: 'Urbanização do Bom Jesus, Lt. 14, 4715-056 Braga' },
      services: baseServices.remodelacao,
      notes: 'Prazo estimado de execução: 12 dias úteis. Inclui remoção de entulhos.',
      ...calcTotals(baseServices.remodelacao),
      createdAt: '2026-05-16',
      expiresAt: '2026-06-30',
      paymentTerms: { preset: '30_70', installments: PAYMENT_PRESETS.find(p=>p.id==='30_70')!.installments },
      paymentAnchor: '2026-05-16',
    },
  },
];

mkdirSync('public/exemplos', { recursive: true });
for (const q of QUOTES) {
  const html = buildQuoteHtml(q.data, { brand: BRAND, withWatermark: false });
  writeFileSync(`/tmp/q-${q.slug}.html`, html);
  console.log('html', q.slug);
}
