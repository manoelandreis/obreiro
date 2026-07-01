/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Link, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, h1, bodyText, button, smallMuted, linkText } from './_layout.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
  recipient?: string
}

export const InviteEmail = ({ recipient, confirmationUrl }: InviteEmailProps) => {
  const firstName = recipient?.split('@')[0] || 'utilizador'
  return (
    <EmailShell preview="Foi convidado(a) para a Obreiro.pt">
      <Text style={h1 as any}>Olá {firstName},</Text>
      <Text style={bodyText}>
        Foi convidado(a) para juntar-se à Obreiro.pt — a plataforma para criar
        orçamentos profissionais em minutos, sem comissões. Clique no botão abaixo para
        aceitar o convite e criar a sua conta.
      </Text>
      <Button style={button} href={confirmationUrl}>
        Aceitar convite
      </Button>
      <Text style={smallMuted}>
        Se não estava à espera deste convite, pode ignorar este email.
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

export default InviteEmail
