/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  displayName?: string
  appUrl?: string
}

const Welcome = ({
  displayName,
  appUrl = 'https://www.obreiro.pt/app',
}: Props) => {
  const greeting = displayName ? `Olá, ${displayName.split(' ')[0]} 👋` : 'Bem-vindo ao Obreiro 👋'

  return (
    <Html lang="pt" dir="ltr">
      <Head />
      <Preview>A sua conta Obreiro está pronta — comece a criar orçamentos profissionais.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brand}>
            <Text style={brandText}>Obreiro</Text>
          </Section>

          <Heading style={h1}>{greeting}</Heading>
          <Text style={text}>
            A sua conta está pronta. Em poucos minutos cria orçamentos profissionais,
            partilha por WhatsApp ou email e gera PDFs com IVA — sem comissões, sem letras
            pequenas.
          </Text>

          <Section style={ctaWrap}>
            <Button style={button} href={appUrl}>
              Entrar na minha conta
            </Button>
          </Section>

          <Heading as="h2" style={h2}>
            Próximos passos
          </Heading>
          <Text style={step}>
            <strong style={stepNum}>1.</strong> Adicione os <strong>dados da sua empresa</strong>{' '}
            (logo, NIF, IBAN ou MBWAY).
          </Text>
          <Text style={step}>
            <strong style={stepNum}>2.</strong> Crie o seu <strong>primeiro orçamento</strong> e
            partilhe o link com o cliente.
          </Text>
          <Text style={step}>
            <strong style={stepNum}>3.</strong> Acompanhe quando o cliente <strong>vê e responde</strong>.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Precisa de ajuda? Responda a este email ou escreva para{' '}
            <Link href="mailto:suporte@obreiro.pt" style={link}>
              suporte@obreiro.pt
            </Link>
            .
          </Text>
          <Text style={footerMuted}>
            Obreiro — orçamentos profissionais para profissionais de Portugal.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Welcome,
  subject: 'Bem-vindo ao Obreiro 👋',
  displayName: 'Boas-vindas ao novo utilizador',
  previewData: {
    displayName: 'Maria Silva',
    appUrl: 'https://www.obreiro.pt/app',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const brand = { paddingBottom: '24px' }
const brandText = {
  margin: 0,
  fontSize: '22px',
  fontWeight: 700,
  color: '#1B3A5C',
  letterSpacing: '-0.02em',
}
const h1 = {
  fontSize: '26px',
  fontWeight: 700,
  color: '#1B3A5C',
  margin: '0 0 12px',
  lineHeight: '32px',
}
const h2 = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#1B3A5C',
  margin: '28px 0 12px',
}
const text = { fontSize: '16px', lineHeight: '26px', color: '#334155', margin: '0 0 20px' }
const ctaWrap = { textAlign: 'center' as const, margin: '24px 0 8px' }
const button = {
  backgroundColor: '#E8730A',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
}
const step = { fontSize: '15px', lineHeight: '24px', color: '#0F172A', margin: '6px 0' }
const stepNum = { color: '#E8730A', marginRight: '6px' }
const hr = { borderColor: '#E2E8F0', margin: '28px 0 16px' }
const link = { color: '#E8730A', textDecoration: 'underline' }
const footer = { fontSize: '13px', lineHeight: '20px', color: '#475569', margin: '0 0 8px' }
const footerMuted = { fontSize: '12px', lineHeight: '18px', color: '#94A3B8', margin: 0 }
