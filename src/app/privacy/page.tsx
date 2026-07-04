'use client';
import Link from 'next/link';

const GOLD  = '#c9a84c';
const VOID  = '#050507';
const TEXT  = '#d4d4e0';
const MUTED = '#7a7a8a';
const SERIF = "'Cinzel', serif";
const MONO  = "'Courier Prime', monospace";
const BODY  = "'Cormorant Garamond', serif";

const EFFECTIVE = 'July 3, 2026';

const SECTIONS = [
  {
    title: '1. Who We Are',
    body: `UMBRA is operated by Tempest Group, based in Mwiki, Kasarani, Nairobi, Kenya. We are the data controller responsible for your personal information collected through the Platform at umbra-wine.vercel.app. Contact: hello@umbra.black`,
  },
  {
    title: '2. What Data We Collect',
    body: `We collect the following categories of personal data:\n\n(a) Account Data — your name and email address when you register or join our waitlist.\n\n(b) Payment Data — billing details processed exclusively by Paddle.com, our Merchant of Record. We do not store your card number or payment credentials at any point. Paddle's privacy policy governs payment data.\n\n(c) Behavioral Data — pages visited, assets viewed, search queries typed, time spent on content, download history, and interaction patterns. This is collected via PostHog analytics (self-hosted) to improve the Platform experience.\n\n(d) Geographic Data — city-level location derived from IP address using MaxMind GeoIP2. We do not collect street-level or neighborhood-level location data. IP addresses are hashed before storage.\n\n(e) Device Data — browser type, operating system, and device category for performance optimization and adaptive content delivery.\n\n(f) Content Metadata — aesthetic profile data derived from your interactions, used to personalise your vault experience.`,
  },
  {
    title: '3. How We Use Your Data',
    body: `We use your personal data for the following purposes:\n\n— To provide, maintain, and improve the Platform and its features.\n— To process subscription payments through Paddle.\n— To send transactional emails (account confirmation, password reset, drop notifications) via Resend.\n— To deliver the Whisper Network newsletter to eligible subscribers.\n— To generate your Aesthetic Profile, Fingerprint, and personalised recommendations.\n— To analyze platform usage patterns and improve content curation.\n— To detect and prevent fraudulent activity, abuse, and security breaches.\n— To comply with legal obligations.`,
  },
  {
    title: '4. Legal Basis for Processing (GDPR)',
    body: `For users in the European Economic Area and United Kingdom, we rely on the following legal bases:\n\n— Contractual necessity: to fulfill your subscription and provide access to the Platform.\n— Legitimate interests: to improve Platform features, prevent fraud, and analyze usage patterns.\n— Consent: for non-essential cookies and marketing communications. You may withdraw consent at any time.\n— Legal obligation: where processing is required by applicable law.`,
  },
  {
    title: '5. Third-Party Services',
    body: `We share data with the following trusted third parties, solely to operate the Platform:\n\n— Supabase (Supabase Inc.) — database, authentication, and real-time infrastructure. Data stored on Supabase servers.\n— Cloudinary (Cloudinary Ltd.) — media asset storage and delivery.\n— Paddle (Paddle.com Market Ltd.) — payment processing and tax compliance. Acts as Merchant of Record.\n— PostHog (PostHog Inc.) — behavioral analytics and session recording, operated in self-hosted mode.\n— MaxMind — city-level geographic data.\n— Resend — transactional email delivery.\n— Vercel (Vercel Inc.) — platform hosting and deployment infrastructure.\n\nWe do not sell your personal data to any third party. We do not share your data with advertisers.`,
  },
  {
    title: '6. Session Recordings',
    body: `With your consent, we may record anonymised session replays of your Platform navigation — cursor movements, scrolling, and clicks — using PostHog. These recordings contain no personally identifiable information. They are used solely to improve the user experience and are not shared externally. You may opt out of session recording by adjusting cookie preferences.`,
  },
  {
    title: '7. Cookies',
    body: `We use strictly necessary cookies to maintain your session and authentication state. With your consent, we use analytical cookies via PostHog to understand Platform usage. We do not use advertising cookies or third-party tracking cookies of any kind. You can manage cookie preferences through your browser settings or via the consent banner displayed on your first visit.`,
  },
  {
    title: '8. Data Retention',
    body: `We retain your account data for as long as your account remains active. If you delete your account, personal data is permanently removed within 30 days, except where retention is required by law (e.g., transaction records retained for 7 years for tax compliance). Anonymised behavioral data and aggregate analytics may be retained indefinitely as they cannot be linked to an individual.`,
  },
  {
    title: '9. Your Rights',
    body: `Depending on your jurisdiction, you may have the following rights regarding your personal data:\n\n— Right of Access: request a copy of the personal data we hold about you.\n— Right to Rectification: request correction of inaccurate or incomplete data.\n— Right to Erasure: request deletion of your personal data ("right to be forgotten").\n— Right to Restrict Processing: request that we limit how we use your data.\n— Right to Data Portability: receive your data in a structured, machine-readable format.\n— Right to Object: object to processing based on legitimate interests.\n— Right to Withdraw Consent: for consent-based processing, withdraw at any time without affecting prior processing.\n\nTo exercise any of these rights, contact us at hello@umbra.black. We will respond within 30 days.`,
  },
  {
    title: '10. Data Security',
    body: `We implement appropriate technical and organisational measures to protect your personal data, including encrypted connections (HTTPS/TLS), Row Level Security on our database, hashed IP addresses, and restricted administrative access via the Obsidian Key protocol. No method of transmission over the internet is 100% secure. In the event of a data breach affecting your rights, we will notify you within 72 hours as required by applicable law.`,
  },
  {
    title: '11. International Data Transfers',
    body: `Your data may be processed in countries outside Kenya, including the United States and the European Union, through our third-party service providers. Where data is transferred outside the EEA, we ensure appropriate safeguards are in place, including Standard Contractual Clauses or adequacy decisions as applicable.`,
  },
  {
    title: '12. Children',
    body: `UMBRA is an 18+ platform. We do not knowingly collect personal data from individuals under the age of 18. If we become aware that a minor has provided us with personal data, we will delete it promptly. If you believe a minor has registered on the Platform, contact us at hello@umbra.black.`,
  },
  {
    title: '13. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. Material changes will be communicated via email at least 14 days before taking effect. The effective date at the top of this page will reflect the most recent revision. Your continued use of the Platform following changes constitutes acceptance.`,
  },
  {
    title: '14. Contact & Complaints',
    body: `Data privacy enquiries: hello@umbra.black\n\nTempest Group, Mwiki, Kasarani, Nairobi, Kenya.\n\nIf you are unsatisfied with our response, you have the right to lodge a complaint with your local data protection authority.`,
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: VOID, color: TEXT, fontFamily: BODY }}>

      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,7,0.97)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(201,168,76,0.07)',
        padding: '0 40px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ fontFamily: SERIF, fontSize: 'clamp(14px,2vw,18px)', fontWeight: 700, color: GOLD, letterSpacing: 6, textDecoration: 'none' }}>
          UMBRA
        </Link>
        <Link href="/browse" style={{ fontFamily: MONO, fontSize: 'clamp(11px,1.3vw,13px)', letterSpacing: 3, color: MUTED, textDecoration: 'none', textTransform: 'uppercase' }}>
          Back to Vault
        </Link>
      </header>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '80px 40px 120px' }}>

        <div style={{ marginBottom: 64 }}>
          <p style={{ fontFamily: MONO, fontSize: 'clamp(11px,1.3vw,12px)', letterSpacing: 5, color: 'rgba(201,168,76,0.4)', textTransform: 'uppercase', marginBottom: 20 }}>
            Legal
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, color: TEXT, letterSpacing: 2, marginBottom: 16, lineHeight: 1.1 }}>
            Privacy Policy
          </h1>
          <p style={{ fontFamily: MONO, fontSize: 'clamp(11px,1.2vw,13px)', letterSpacing: 2, color: MUTED }}>
            Effective Date: {EFFECTIVE}
          </p>
        </div>

        <div style={{ height: 1, background: 'rgba(201,168,76,0.08)', marginBottom: 56 }} />

        {SECTIONS.map((sec, i) => (
          <div key={i} style={{ marginBottom: 48 }}>
            <h2 style={{
              fontFamily: SERIF,
              fontSize: 'clamp(15px,1.8vw,20px)',
              fontWeight: 600,
              color: TEXT,
              letterSpacing: 1,
              marginBottom: 16,
            }}>
              {sec.title}
            </h2>
            <p style={{
              fontFamily: BODY,
              fontSize: 'clamp(15px,1.7vw,18px)',
              color: MUTED,
              lineHeight: 2,
              margin: 0,
              whiteSpace: 'pre-line',
            }}>
              {sec.body}
            </p>
          </div>
        ))}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '56px 0 40px' }} />

        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {[['Terms of Service', '/terms'], ['Refund Policy', '/refunds'], ['Pricing', '/pricing']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontFamily: MONO, fontSize: 'clamp(11px,1.2vw,13px)', letterSpacing: 3, color: 'rgba(201,168,76,0.5)', textDecoration: 'none', textTransform: 'uppercase' }}>{l}</Link>
          ))}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.03)', padding: '28px 40px', textAlign: 'center' }}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>© 2026 Tempest Group — All rights reserved</span>
      </footer>
    </div>
  );
}
