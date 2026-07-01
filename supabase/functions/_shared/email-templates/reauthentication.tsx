/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, h1, bodyText, smallMuted, otpBox } from './_layout.tsx'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailShell preview="O seu código de verificação Obreiro.pt">
    <Text style={h1 as any}>Código de verificação</Text>
    <Text style={bodyText}>
      Use o código abaixo para confirmar a sua identidade na Obreiro.pt. O código é
      válido durante alguns minutos.
    </Text>
    <Text style={otpBox}>{token}</Text>
    <Text style={smallMuted}>
      Se não pediu este código, pode ignorar este email em segurança.
    </Text>
  </EmailShell>
)

export default ReauthenticationEmail
