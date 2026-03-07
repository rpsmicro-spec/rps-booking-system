import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { COMPANY_INFO, LOGO_URL, STATUS_LABELS } from './_constants'

export interface StatusChangeEmailProps {
  customerName?: string
  jobNumber?: string
  status?: string
  materialType?: string | null
  viewLink?: string
}

export default function StatusChangeEmail({
  customerName = 'Customer Name',
  jobNumber = 'JOB-001',
  status = 'in_progress',
  materialType = 'Sample Material',
  viewLink = 'https://example.com/jobs/1',
}: StatusChangeEmailProps) {
  const statusLabel = STATUS_LABELS[status] ?? status

  return (
    <Html dir="ltr" lang="en">
      <Head>
        <meta content="text/html; charset=UTF-8" httpEquiv="Content-Type" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Job status update</title>
      </Head>
      <Preview>Your job status has been updated to {statusLabel}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Img alt={COMPANY_INFO.NAME} src={LOGO_URL} style={logo} />
            <Heading style={heading}>Job status update</Heading>
            <Text style={paragraph}>
              Hi {customerName}, your job status has been updated.
            </Text>
            <Section style={infoBox}>
              <Text style={{ ...infoText, marginTop: 0 }}>
                <strong>Job:</strong> {jobNumber}
              </Text>
              <Text style={infoText}>
                <strong>Status:</strong>{' '}
                <span style={statusHighlight}>{statusLabel}</span>
              </Text>
              {materialType && (
                <Text style={infoText}>
                  <strong>Material:</strong> {materialType}
                </Text>
              )}
            </Section>
            <Section style={buttonSection}>
              <Button style={button} href={viewLink}>
                View job details
              </Button>
            </Section>
            <Hr style={hr} />
            <Text style={footerTitle}>{COMPANY_INFO.NAME}</Text>
            <Text style={footerAddress}>{COMPANY_INFO.ADDRESS}</Text>
            <Text style={footerText}>
              📞 {COMPANY_INFO.PHONE} | {COMPANY_INFO.TEL} · 📧{' '}
              <Link href={`mailto:${COMPANY_INFO.EMAIL}`} style={link}>
                {COMPANY_INFO.EMAIL}
              </Link>
            </Text>
            <Text style={footerText}>
              <Link href={COMPANY_INFO.GOOGLE_MAPS_LINK} style={link}>
                📍 View on Google Maps
              </Link>
            </Text>
            <Text style={footerLine}>
              © {new Date().getFullYear()} {COMPANY_INFO.NAME}.
            </Text>
            <Text style={footerAutomated}>
              This is an automated email. Please do not reply.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

StatusChangeEmail.PreviewProps = {
  customerName: 'Acme Corp',
  jobNumber: 'JOB-2024-042',
  status: 'in_progress',
  materialType: 'PCB Assembly',
  viewLink: 'https://example.com/jobs/42',
  whatsappLink: 'https://wa.me/919884901472',
} satisfies StatusChangeEmailProps

const main = {
  backgroundColor: 'rgb(246,249,252)',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  maxWidth: '480px',
  width: '100%',
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '32px 24px',
  borderRadius: '8px',
}

const content = { padding: '0' }

const logo = { display: 'block', maxWidth: '120px', height: 'auto' }

const hr = {
  borderColor: 'rgb(230,235,241)',
  margin: '24px 0 12px',
}

const heading = {
  fontSize: '18px',
  lineHeight: '26px',
  color: 'rgb(31,41,55)',
  margin: '20px 0 12px',
  fontWeight: 600,
}

const paragraph = {
  fontSize: '15px',
  lineHeight: '22px',
  color: 'rgb(82,95,127)',
  margin: '0 0 16px',
}

const infoBox = {
  backgroundColor: 'rgb(243,244,246)',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 20px',
}

const infoText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: 'rgb(31,41,55)',
  margin: '4px 0 0',
}

const statusHighlight = { color: 'rgb(37,99,235)', fontWeight: 600 }

const buttonSection = { margin: '0', textAlign: 'center' as const }

const button = {
  backgroundColor: 'rgb(37,99,235)',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 24px',
  textDecoration: 'none',
}

const link = { color: 'rgb(37,99,235)', textDecoration: 'none' }

const footerTitle = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'rgb(102,102,102)',
  margin: '0 0 4px 0',
}

const footerAddress = {
  fontSize: '12px',
  lineHeight: '18px',
  color: 'rgb(102,102,102)',
  margin: 0,
  whiteSpace: 'pre-line' as const,
}

const footerText = {
  fontSize: '12px',
  lineHeight: '18px',
  color: 'rgb(102,102,102)',
  margin: '6px 0 0 0',
}

const footerLine = {
  fontSize: '11px',
  lineHeight: '16px',
  color: 'rgb(153,153,153)',
  margin: '16px 0 4px 0',
  textAlign: 'center' as const,
}

const footerAutomated = {
  fontSize: '11px',
  lineHeight: '16px',
  color: 'rgb(153,153,153)',
  margin: 0,
  textAlign: 'center' as const,
}
