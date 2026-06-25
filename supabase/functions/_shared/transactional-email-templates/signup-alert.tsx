/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  userEmail?: string
  displayName?: string
  signedUpAt?: string
  userId?: string
}

const SignupAlert = ({
  userEmail = '—',
  displayName = '—',
  signedUpAt = new Date().toISOString(),
  userId = '—',
}: Props) => {
  const formatted = (() => {
    try {
      return new Date(signedUpAt).toLocaleString('pt-PT', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'Europe/Lisbon',
      })
    } catch {
      return signedUpAt
    }
  })()

  return (
    <Html lang="pt" dir="ltr">
      <Head />
      <Preview>Novo cadastro no Obreiro: {displayName || userEmail}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brand}>
            <Text style={brandText}>Obreiro</Text>
          </Section>
          <Heading style={h1}>Novo cadastro 🎉</Heading>
          <Text style={text}>Acabou de chegar um novo utilizador ao Obreiro.</Text>

          <Section style={card}>
            <Text style={row}>
              <strong style={label}>Nome:</strong> {displayName}
            </Text>
            <Text style={row}>
              <strong style={label}>Email:</strong> {userEmail}
            </Text>
            <Text style={row}>
              <strong style={label}>Data:</strong> {formatted}
            </Text>
            <Text style={rowMuted}>
              <strong style={label}>ID:</strong> {userId}
            </Text>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Notificação automática do Obreiro. Para responder, contacte o utilizador
            diretamente pelo email acima.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: SignupAlert,
  subject: (data: Record<string, unknown>) => {
    const name = (data?.displayName as string) || (data?.userEmail as string) || 'novo utilizador'
    return `Novo cadastro Obreiro — ${name}`
  },
  displayName: 'Alerta de novo cadastro (interno)',
  previewData: {
    userEmail: 'maria@exemplo.pt',
    displayName: 'Maria Silva',
    signedUpAt: new Date().toISOString(),
    userId: 'usr_abc123',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const brand = { paddingBottom: '16px' }
const brandText = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 700,
  color: '#1B3A5C',
  letterSpacing: '-0.02em',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 600,
  color: '#1B3A5C',
  margin: '8px 0 12px',
}
const text = { fontSize: '15px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' }
const card = {
  backgroundColor: '#F8FAFC',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #E2E8F0',
}
const row = { fontSize: '15px', lineHeight: '22px', color: '#0F172A', margin: '4px 0' }
const rowMuted = { fontSize: '12px', lineHeight: '18px', color: '#64748B', margin: '12px 0 0' }
const label = { color: '#1B3A5C', display: 'inline-block', minWidth: '60px' }
const hr = { borderColor: '#E2E8F0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', lineHeight: '18px', margin: 0 }
