/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Link, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, h1, bodyText, button, smallMuted, linkText } from './_layout.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
  recipient?: string
}

export const RecoveryEmail = ({ recipient, confirmationUrl }: RecoveryEmailProps) => {
  const firstName = recipient?.split('@')[0] || 'utilizador'
  return (
    <EmailShell preview="Redefina a sua palavra-passe na Obreiro.pt">
      <Text style={h1 as any}>Olá {firstName},</Text>
      <Text style={bodyText}>
        Recebemos um pedido para redefinir a palavra-passe da sua conta Obreiro.pt.
        Clique no botão abaixo para escolher uma nova palavra-passe. Este link é válido
        durante 1 hora.
      </Text>
      <Button style={button} href={confirmationUrl}>
        Redefinir palavra-passe
      </Button>
      <Text style={smallMuted}>
        Se não pediu esta alteração, pode ignorar este email — a sua palavra-passe atual
        continuará ativa.
        <br />
        <br />
        Ou copie e cole este link no seu navegador:
        <br />
        <Link href={confirmationUrl} style={linkText}>
          {confirmationUrl}
        </Link>
      </Text>
    </EmailShell>
  )
}

export default RecoveryEmail
