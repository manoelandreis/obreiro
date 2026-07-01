/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Button, Link, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, h1, bodyText, button, smallMuted, linkText } from './_layout.tsx'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <EmailShell preview="Confirme a alteração do seu email na Obreiro.pt">
    <Text style={h1 as any}>Confirme o seu novo email</Text>
    <Text style={bodyText}>
      Recebemos um pedido para alterar o email da sua conta Obreiro.pt de{' '}
      <strong>{oldEmail}</strong> para <strong>{newEmail}</strong>. Clique no botão
      abaixo para confirmar esta alteração.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Confirmar novo email
    </Button>
    <Text style={smallMuted}>
      Se não pediu esta alteração, proteja a sua conta imediatamente alterando a
      palavra-passe.
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

export default EmailChangeEmail
