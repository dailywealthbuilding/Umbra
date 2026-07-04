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
    title: '1. Acceptance of Terms',
    body: `By accessing or using the UMBRA platform ("Platform"), operated by Tempest Group ("we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms in their entirety, you may not access or use the Platform. These Terms constitute a legally binding agreement between you and Tempest Group.`,
  },
  {
    title: '2. Description of Service',
    body: `UMBRA is a curated aesthetic visual content platform providing access to a library of CC0-licensed images, videos, and audio assets ("Content") through tiered subscription plans. The Platform also includes SIGNAL broadcast features, The Block auction house, and ancillary creative tools. Access to features varies by subscription tier.`,
  },
  {
    title: '3. Subscription Tiers and Billing',
    body: `UMBRA offers the following subscription tiers: ACCESS (free), NOIR ($15/month), PRESTIGE ($39/month), and OBSIDIAN ($99/month). Paid subscriptions are billed monthly on a recurring basis. All payments are processed by Paddle.com, our Merchant of Record, which handles billing, invoicing, and applicable tax compliance on our behalf. By purchasing a subscription, you authorise Paddle to charge your designated payment method on a recurring monthly basis until cancellation. Prices are displayed in USD. Regional pricing may apply where available.`,
  },
  {
    title: '4. Founding Member Pricing',
    body: `The first 100 paying subscribers ("Founding Members") receive a permanent price lock at the rate active at the time of their initial subscription. This rate applies to their chosen tier for as long as they maintain an active, uninterrupted subscription. Price locks are non-transferable and void upon voluntary cancellation or account termination.`,
  },
  {
    title: '5. Content License',
    body: `All downloadable Content on the Platform is licensed under Creative Commons Zero (CC0) unless otherwise stated. CC0 Content may be used commercially, modified, distributed, and published without attribution. Display-only Content (content marked as non-downloadable) remains subject to its original creator's licensing terms and may not be downloaded, reproduced, or redistributed. The Block auction Content and Sovereign Packs carry their own stated license terms, which govern at point of sale.`,
  },
  {
    title: '6. Prohibited Uses',
    body: `You may not: (a) redistribute or resell Platform Content as standalone stock media in direct competition with UMBRA; (b) use Platform Content to train artificial intelligence or machine learning models without our written consent; (c) claim authorship or ownership of unmodified Platform Content; (d) circumvent tier restrictions or access controls; (e) share account credentials with third parties; (f) use the Platform for any unlawful purpose or in violation of applicable laws.`,
  },
  {
    title: '7. The Block — Auction Rules',
    body: `All bids placed in The Block auction are legally binding commitments. Upon winning an auction, the winning bidder must complete payment within 24 hours. Failed payment within 24 hours results in bid forfeiture, a 30-day Block suspension, and the asset being offered to the next highest bidder. All auction sales are final. No refunds are issued on auction purchases. In the event of a platform technical failure during an active auction, a 30-minute automatic extension applies and all active bidders are notified. UMBRA reserves a 15% platform fee on all successful auction transactions.`,
  },
  {
    title: '8. Account Termination',
    body: `We reserve the right to suspend or terminate your account at our discretion for violation of these Terms, fraudulent activity, or conduct detrimental to the Platform or its community. Upon termination, your access to Content downloads ceases immediately. Content already downloaded under a valid CC0 license remains usable under those license terms. We may provide advance notice of termination where practicable but are not obligated to do so.`,
  },
  {
    title: '9. Intellectual Property',
    body: `The UMBRA name, logo, design language, interface, curation methodology, and non-CC0 original content are the intellectual property of Tempest Group and are protected under applicable copyright and trademark law. You may not reproduce, copy, or exploit any part of the Platform's identity or interface without our express written permission.`,
  },
  {
    title: '10. Disclaimer of Warranties',
    body: `The Platform is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or uninterrupted availability. We do not warrant that the Platform will be error-free, secure, or continuously available. Access may be interrupted for maintenance, upgrades, or events beyond our control.`,
  },
  {
    title: '11. Limitation of Liability',
    body: `To the fullest extent permitted by applicable law, Tempest Group shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Platform. Our total aggregate liability to you for any claim arising from these Terms or your use of the Platform shall not exceed the total amounts paid by you to UMBRA in the 12 months preceding the claim.`,
  },
  {
    title: '12. Modifications to Terms',
    body: `We reserve the right to modify these Terms at any time. Material changes will be communicated via email to registered account holders at least 14 days before they take effect. Your continued use of the Platform after the effective date of changes constitutes acceptance. If you do not agree to modified Terms, you must cancel your subscription before the effective date.`,
  },
  {
    title: '13. Governing Law',
    body: `These Terms are governed by and construed in accordance with the laws of the Republic of Kenya. Any dispute arising from these Terms shall first be subject to good-faith negotiation. If unresolved, disputes shall be submitted to the jurisdiction of the courts of Nairobi, Kenya. Users outside Kenya acknowledge that they are accessing the Platform under Kenyan law and waive any objection to this jurisdiction.`,
  },
  {
    title: '14. Contact',
    body: `For questions regarding these Terms, contact us at: hello@umbra.black — or via the contact section at umbra-wine.vercel.app. Tempest Group, Mwiki, Kasarani, Nairobi, Kenya.`,
  },
];

export default function TermsPage() {
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
            Terms of Service
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
            }}>
              {sec.body}
            </p>
          </div>
        ))}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '56px 0 40px' }} />

        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {[['Privacy Policy', '/privacy'], ['Refund Policy', '/refunds'], ['Pricing', '/pricing']].map(([l, h]) => (
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
