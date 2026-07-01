/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

// Publicly reachable logo URL (served from the site's CDN).
export const LOGO_URL =
  'https://www.obreiro.pt/__l5e/assets-v1/7cc3a1ea-73c6-4444-8b7b-fa4d8876dc82/obreiro-logo.png'

export const COLORS = {
  bg: '#FBF6EF',
  card: '#FFFFFF',
  ink: '#1B1B1B',
  body: '#3A3A3A',
  muted: '#6B6B6B',
  faint: '#9A9A9A',
  primary: '#E8730A',
  onPrimary: '#FFFFFF',
  red: '#D02F2F',
  border: '#F0E8DA',
}

export const FONT_STACK =
  '"Poppins", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'

interface EmailShellProps {
  preview: string
  children: React.ReactNode
}

/**
 * Shared shell for every Obreiro email.
 * Cream background + white rounded card + branded footer.
 */
export const EmailShell = ({ preview, children }: EmailShellProps) => (
  <Html lang="pt" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={body}>
      <Container style={outer}>
        {/* Header (outside card) */}
        <Section style={header}>
          <Row>
            <Column style={{ width: '48px' }}>
              <Img
                src={LOGO_URL}
                width="40"
                height="40"
                alt="Obreiro"
                style={{ display: 'block', borderRadius: '10px' }}
              />
            </Column>
            <Column>
              <Text style={wordmark}>Obreiro</Text>
            </Column>
          </Row>
        </Section>

        {/* White card */}
        <Section style={card}>{children}</Section>

        {/* Footer */}
        <Section style={footerWrap}>
          <Text style={tagline}>Simples como uma chave de fendas.</Text>
          <Text style={contactLine}>
            www.obreiro.pt&nbsp;&nbsp;·&nbsp;&nbsp;suporte@obreiro.pt&nbsp;&nbsp;·&nbsp;&nbsp;+351 925 195 230
          </Text>
          <Row style={{ marginTop: '16px' }}>
            <Column>
              <Text style={copyright}>© 2026 Obreiro.pt. Todos os direitos reservados.</Text>
            </Column>
            <Column style={{ textAlign: 'right' as const }}>
              <Text style={madeIn}>🇵🇹 Feito em Portugal.</Text>
            </Column>
          </Row>
        </Section>
      </Container>
    </Body>
  </Html>
)

/* ---------- Reusable style tokens (exported for templates) ---------- */

export const h1: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: '32px',
  lineHeight: '38px',
  fontWeight: 800,
  color: COLORS.ink,
  margin: '0 0 20px',
  letterSpacing: '-0.01em',
}

export const bodyText: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: '16px',
  lineHeight: '26px',
  color: COLORS.body,
  margin: '0 0 20px',
}

export const button: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box' as const,
  backgroundColor: COLORS.primary,
  color: COLORS.onPrimary,
  fontFamily: FONT_STACK,
  fontSize: '17px',
  fontWeight: 700,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '18px 20px',
  borderRadius: '12px',
  boxShadow: '0 8px 20px rgba(232, 115, 10, 0.25)',
}

export const smallMuted: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: '14px',
  lineHeight: '22px',
  color: COLORS.muted,
  margin: '20px 0 0',
}

export const linkText: React.CSSProperties = {
  color: COLORS.primary,
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
}

export const otpBox: React.CSSProperties = {
  fontFamily: '"SF Mono", ui-monospace, Menlo, Consolas, monospace',
  fontSize: '32px',
  fontWeight: 700,
  letterSpacing: '0.35em',
  color: COLORS.ink,
  textAlign: 'center' as const,
  backgroundColor: '#FBF6EF',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '20px 16px',
  margin: '0 0 20px',
}

/* ---------- Private ---------- */

const body: React.CSSProperties = {
  backgroundColor: '#ffffff', // required by policy
  margin: 0,
  padding: '32px 16px',
  fontFamily: FONT_STACK,
}

const outer: React.CSSProperties = {
  backgroundColor: COLORS.bg,
  borderRadius: '20px',
  padding: '28px',
  maxWidth: '620px',
  margin: '0 auto',
}

const header: React.CSSProperties = {
  paddingBottom: '20px',
}

const wordmark: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: '22px',
  fontWeight: 800,
  color: COLORS.ink,
  margin: 0,
  paddingLeft: '4px',
  letterSpacing: '-0.01em',
}

const card: React.CSSProperties = {
  backgroundColor: COLORS.card,
  borderRadius: '16px',
  padding: '40px 36px',
}

const footerWrap: React.CSSProperties = {
  padding: '28px 4px 4px',
}

const tagline: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: '15px',
  fontWeight: 700,
  color: COLORS.ink,
  margin: '0 0 10px',
}

const contactLine: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: '13px',
  color: COLORS.muted,
  margin: 0,
}

const copyright: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: '12px',
  color: COLORS.faint,
  margin: 0,
}

const madeIn: React.CSSProperties = {
  fontFamily: FONT_STACK,
  fontSize: '12px',
  color: COLORS.red,
  margin: 0,
  fontWeight: 600,
}
