/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailShell, h1, bodyText, smallMuted, COLORS, FONT_STACK } from '../email-templates/_layout.tsx'

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

  const row: React.CSSProperties = {
    fontFamily: FONT_STACK,
    fontSize: '15px',
    lineHeight: '24px',
    color: COLORS.body,
    margin: '4px 0',
  }
  const label: React.CSSProperties = {
    color: COLORS.ink,
    display: 'inline-block',
    minWidth: '70px',
  }
  const card: React.CSSProperties = {
    backgroundColor: '#FBF6EF',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '20px 22px',
    margin: '0 0 8px',
  }

  return (
    <EmailShell preview={`Novo cadastro na Obreiro: ${displayName || userEmail}`}>
      <Text style={h1 as any}>Novo cadastro 🎉</Text>
      <Text style={bodyText}>Acabou de chegar um novo utilizador à Obreiro.pt.</Text>

      <div style={card}>
        <Text style={row}>
          <strong style={label}>Nome:</strong> {displayName}
        </Text>
        <Text style={row}>
          <strong style={label}>Email:</strong> {userEmail}
        </Text>
        <Text style={row}>
          <strong style={label}>Data:</strong> {formatted}
        </Text>
        <Text style={{ ...row, fontSize: '12px', color: COLORS.faint, margin: '10px 0 0' }}>
          <strong style={label}>ID:</strong> {userId}
        </Text>
      </div>

      <Text style={smallMuted}>
        Notificação automática. Para responder, contacte o utilizador diretamente pelo
        email acima.
      </Text>
    </EmailShell>
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
