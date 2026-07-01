/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Link, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, h1, bodyText, button, smallMuted, linkText } from './_layout.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => {
  const firstName = recipient?.split('@')[0] || 'utilizador'
  return (
    <EmailShell preview="Confirme o seu email para começar a usar a Obreiro.pt">
      <Text style={h1 as any}>Olá {firstName},</Text>
      <Text style={bodyText}>
        Muito bem! A sua conta na Obreiro.pt foi criada com sucesso. Agora pode aceder à
        plataforma e começar a explorar todas as funcionalidades que temos para si. Para
        começar, confirme o seu endereço de email clicando no botão abaixo.
      </Text>
      <Button style={button} href={confirmationUrl}>
        Confirmar email
      </Button>
      <Text style={smallMuted}>
        Se não conseguir clicar no botão, copie e cole este link no seu navegador:
        <br />
        <Link href={confirmationUrl} style={linkText}>
          {confirmationUrl}
        </Link>
      </Text>
    </EmailShell>
  )
}

export default SignupEmail
