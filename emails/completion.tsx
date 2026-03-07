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
import { COMPANY_INFO, LOGO_URL } from './_constants'

export interface CompletionEmailProps {
  customerName?: string
  jobNumber?: string
  materialType?: string | null
  deliveryDate?: string | null
  viewLink?: string
  hasInvoice?: boolean
}

export default function CompletionEmail({
  customerName = 'Customer Name',
  jobNumber = 'JOB-001',
  materialType = 'Sample Material',
  deliveryDate = 'Mar 15, 2025',
  viewLink = 'https://example.com/jobs/1',
  hasInvoice = true,
}: CompletionEmailProps) {
  return (
    <Html dir="ltr" lang="en">
      <Head>
        <meta content="text/html; charset=UTF-8" httpEquiv="Content-Type" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Job completed</title>
      </Head>
      <Preview>Your job is complete</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Img alt={COMPANY_INFO.NAME} src={LOGO_URL} style={logo} />
            <Heading style={heading}>Job completed</Heading>
            <Text style={paragraph}>
              Hi {customerName}, your job is complete. View details and photos
              below.
            </Text>
            <Section style={infoBox}>
              <Text style={{ ...infoText, marginTop: 0 }}>
                <strong>Job:</strong> {jobNumber}
              </Text>
              {materialType && (
                <Text style={infoText}>
                  <strong>Material:</strong> {materialType}
                </Text>
              )}
              {deliveryDate && (
                <Text style={infoText}>
                  <strong>Delivery:</strong> {deliveryDate}
                </Text>
              )}
            </Section>
            {hasInvoice && (
              <Text style={invoiceNote}>
                Your invoice is available on the job page.
              </Text>
            )}
            <Section style={buttonSection}>
              <Button style={button} href={viewLink}>
                View job details
              </Button>
            </Section>
            <Text style={thankYou}>
              Thank you for choosing {COMPANY_INFO.NAME}.
            </Text>
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

CompletionEmail.PreviewProps = {
  customerName: 'Acme Corp',
  jobNumber: 'JOB-2024-042',
  materialType: 'PCB Assembly',
  deliveryDate: 'Mar 15, 2025',
  viewLink: 'https://example.com/jobs/42',
  hasInvoice: true,
  whatsappLink: 'https://wa.me/919884901472',
} satisfies CompletionEmailProps

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

const invoiceNote = {
  fontSize: '13px',
  lineHeight: '20px',
  color: 'rgb(102,102,102)',
  margin: '0 0 16px',
}

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

const thankYou = {
  fontSize: '14px',
  lineHeight: '22px',
  color: 'rgb(82,95,127)',
  margin: '20px 0 0',
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
