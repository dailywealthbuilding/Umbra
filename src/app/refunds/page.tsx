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
    title: '1. Overview',
    body: `This Refund Policy governs all purchases made through the UMBRA Platform, operated by Tempest Group. All payments are processed by Paddle.com, our Merchant of Record. By subscribing or making a purchase on UMBRA, you acknowledge and agree to the terms of this policy.`,
  },
  {
    title: '2. Subscription Cancellation',
    body: `You may cancel your subscription at any time through your account settings or by contacting us at hello@umbra.black.\n\nCancellation takes effect at the end of your current billing period. You retain full access to your subscription tier until that date. We do not issue partial refunds for unused days remaining in a billing period after cancellation.\n\nExample: If your billing date is the 1st of each month and you cancel on the 15th, your access continues until the end of that month. No refund is issued for the remaining 15 days.`,
  },
  {
    title: '3. 7-Day Trial',
    body: `Where a $5 trial period is offered, the trial charge is non-refundable. The trial grants full access to the selected tier for 7 days. At the end of the trial, you are automatically billed at the standard monthly rate for your chosen tier unless you cancel before the trial ends. Cancellation before the trial period ends prevents any further billing.`,
  },
  {
    title: '4. Downloaded Content',
    body: `All Content available for download is CC0-licensed digital media. Due to the immediate and irrevocable nature of digital delivery, downloaded Content is non-refundable under any circumstances. Once a file has been downloaded to your device, the transaction is considered fully delivered and complete.`,
  },
  {
    title: '5. The Block — Auction Purchases',
    body: `All auction purchases through The Block are final and non-refundable. By placing a bid, you enter a binding commitment to purchase should your bid succeed. Winning bidders must complete payment within 24 hours of auction close.\n\nFailed payment within 24 hours results in:\n— Forfeiture of the winning bid\n— A 30-day suspension from The Block\n— The asset being offered to the next highest bidder\n\nNo exceptions are made to this policy regardless of circumstance.`,
  },
  {
    title: '6. Eligible Refund Circumstances',
    body: `Refunds are considered only in the following exceptional circumstances:\n\n(a) Duplicate charge — you were billed more than once for the same subscription period due to a technical error. We will refund the duplicate charge in full within 5 business days of confirmation.\n\n(b) Platform unavailability — the Platform was inaccessible for more than 72 consecutive hours within a billing period due to causes within our control. A pro-rated credit or refund may be issued at our discretion.\n\n(c) Unauthorised transaction — a charge was made to your account without your authorisation. Contact us immediately at hello@umbra.black and we will investigate and refund where confirmed.\n\nTo request a refund under any of the above circumstances, email hello@umbra.black with your account email, the charge date, and a description of the issue. We aim to respond within 3 business days.`,
  },
  {
    title: '7. Founding Member Subscriptions',
    body: `Founding Member price locks are tied to continuous active subscription. If a Founding Member cancels their subscription for any reason, the price lock is permanently void. Upon resubscription, standard current pricing applies. No exceptions are made. This policy exists to preserve the integrity of the Founding Member offer.`,
  },
  {
    title: '8. How Refunds Are Processed',
    body: `Where a refund is approved, it is processed through Paddle.com back to the original payment method. Refund processing times vary by payment provider — typically 5 to 10 business days. We are not responsible for delays caused by your bank or card issuer.`,
  },
  {
    title: '9. Chargebacks',
    body: `Initiating a chargeback or payment dispute with your bank without first contacting us at hello@umbra.black will result in immediate account suspension pending investigation. We take chargebacks seriously and maintain detailed transaction records. Fraudulent chargeback claims will be contested. We encourage all disputes to be resolved directly with us first — most issues are resolved within 3 business days.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `We reserve the right to update this Refund Policy at any time. Changes will be communicated via email to registered subscribers at least 14 days before taking effect. Continued use of the Platform constitutes acceptance of the revised policy.`,
  },
  {
    title: '11. Contact',
    body: `Refund requests and billing questions:\nhello@umbra.black\n\nTempest Group, Mwiki, Kasarani, Nairobi, Kenya.\n\nWe aim to respond to all refund enquiries within 3 business days.`,
  },
];

export default function RefundsPage() {
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
            Refund Policy
          </h1>
          <p style={{ fontFamily: MONO, fontSize: 'clamp(11px,1.2vw,13px)', letterSpacing: 2, color: MUTED }}>
            Effective Date: {EFFECTIVE}
          </p>
        </div>

        <div style={{ height: 1, background: 'rgba(201,168,76,0.08)', marginBottom: 56 }} />

        {/* Summary callout */}
        <div style={{
          border: '1px solid rgba(201,168,76,0.15)',
          background: 'rgba(201,168,76,0.04)',
          padding: '28px 32px',
          marginBottom: 56,
        }}>
          <p style={{ fontFamily: MONO, fontSize: 'clamp(10px,1.2vw,12px)', letterSpacing: 4, color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: 16 }}>
            Summary
          </p>
          {[
            'Subscriptions — cancel anytime, no refund for current period',
            'Downloads — non-refundable (digital delivery is immediate)',
            'The Block auctions — all sales final, no exceptions',
            '7-day trial — $5 trial fee is non-refundable',
            'Duplicate charges or platform failures — eligible for refund',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: i < 4 ? 12 : 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 13, color: 'rgba(201,168,76,0.4)', flexShrink: 0, marginTop: 2 }}>—</span>
              <p style={{ fontFamily: BODY, fontSize: 'clamp(14px,1.6vw,17px)', color: MUTED, margin: 0, lineHeight: 1.7 }}>{item}</p>
            </div>
          ))}
        </div>

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
          {[['Terms of Service', '/terms'], ['Privacy Policy', '/privacy'], ['Pricing', '/pricing']].map(([l, h]) => (
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
