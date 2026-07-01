/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Link, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, h1, bodyText, button, smallMuted, linkText } from './_layout.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  recipient?: string
}

export const MagicLinkEmail = ({ recipient, confirmationUrl }: MagicLinkEmailProps) => {
  const firstName = recipient?.split('@')[0] || 'utilizador'
  return (
    <EmailShell preview="O seu link de acesso à Obreiro.pt">
      <Text style={h1 as any}>Olá {firstName},</Text>
      <Text style={bodyText}>
        Aqui está o seu link de acesso à Obreiro.pt. Clique no botão abaixo para entrar
        na sua conta. Este link é válido durante alguns minutos e só pode ser usado uma
        vez.
      </Text>
      <Button style={button} href={confirmationUrl}>
        Entrar na Obreiro
      </Button>
      <Text style={smallMuted}>
        Se não pediu este link, pode ignorar este email em segurança.
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

export default MagicLinkEmail
