/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  EmailShell,
  h1,
  bodyText,
  button,
  smallMuted,
} from '../email-templates/_layout.tsx'

interface Props {
  displayName?: string
  appUrl?: string
}

const Welcome = ({ displayName, appUrl = 'https://www.obreiro.pt/app' }: Props) => {
  const firstName = displayName ? displayName.split(' ')[0] : 'utilizador'
  return (
    <EmailShell preview="A sua conta Obreiro está pronta — comece a criar orçamentos profissionais.">
      <Text style={h1 as any}>Olá {firstName},</Text>
      <Text style={bodyText}>
        Bem-vindo(a) à Obreiro.pt! A sua conta está pronta a usar. Em poucos minutos
        cria orçamentos profissionais com a sua marca, partilha por WhatsApp ou email e
        gera PDFs com IVA — <strong>sem comissões, sem letras pequenas</strong>.
      </Text>
      <Button style={button} href={appUrl}>
        Entrar na plataforma
      </Button>
      <Text style={smallMuted}>
        <strong style={{ color: '#1B1B1B' }}>Próximos passos:</strong>
        <br />
        1. Adicione os dados da sua empresa (logo, NIF, IBAN ou MBWAY).
        <br />
        2. Crie o seu primeiro orçamento e partilhe o link com o cliente.
        <br />
        3. Acompanhe quando o cliente vê e responde.
      </Text>
    </EmailShell>
  )
}

export const template = {
  component: Welcome,
  subject: 'Bem-vindo à Obreiro.pt 👋',
  displayName: 'Boas-vindas ao novo utilizador',
  previewData: {
    displayName: 'Maria Silva',
    appUrl: 'https://www.obreiro.pt/app',
  },
} satisfies TemplateEntry
