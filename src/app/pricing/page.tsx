'use client';
import Link from 'next/link';

const GOLD   = '#c9a84c';
const VOID   = '#050507';
const TEXT   = '#d4d4e0';
const MUTED  = '#7a7a8a';
const SERIF  = "'Cinzel', serif";
const MONO   = "'Courier Prime', monospace";
const BODY   = "'Cormorant Garamond', serif";

const TIERS = [
  {
    name: 'ACCESS',
    price: '$0',
    period: 'free forever',
    tag: 'Observe. Explore. Discover.',
    accent: '#3a3a4a',
    featured: false,
    feats: [
      '5 CC0 downloads per month',
      'Full vault browsing',
      'SIGNAL Radio streaming',
      'Aesthetic quiz + profile',
      'View drops (no early access)',
      'The Block viewing only',
    ],
    cta: 'Enter Free',
    href: '/auth/login',
  },
  {
    name: 'NOIR',
    price: '$15',
    period: 'per month',
    tag: 'For creators who see in the dark.',
    accent: GOLD,
    featured: false,
    feats: [
      '30 CC0 downloads per month',
      'Full sensory search engine',
      '24hr early drop access',
      'Moodboard collections',
      'The Block viewing + bidding',
      'Aesthetic IQ tracking',
    ],
    cta: 'Enter NOIR',
    href: '/subscribe',
  },
  {
    name: 'PRESTIGE',
    price: '$39',
    period: 'per month',
    tag: 'Unlimited. No ceiling. No compromise.',
    accent: '#a070e0',
    featured: true,
    feats: [
      'Unlimited downloads',
      'Ghost Collections access',
      '48hr early drop access',
      'Aesthetic DNA report',
      'Whisper Network newsletter',
      'Aesthetic Fingerprint Sigil',
      'Scene Builder access',
    ],
    cta: 'Ascend to PRESTIGE',
    href: '/subscribe',
  },
  {
    name: 'OBSIDIAN',
    price: '$99',
    period: 'per month',
    tag: 'Beyond the velvet rope.',
    accent: '#4a8cf5',
    featured: false,
    feats: [
      'Everything in PRESTIGE',
      'The Inner Circle access',
      'The Spice Route collection',
      'Whisper Market access',
      '72hr early drop access',
      'Full API access (1K calls/mo)',
      'Analog Signal print quarterly',
    ],
    cta: 'Enter OBSIDIAN',
    href: '/subscribe',
  },
];

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: VOID, color: TEXT, fontFamily: BODY }}>

      {/* Nav */}
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
          Browse Vault
        </Link>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px 120px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <p style={{ fontFamily: MONO, fontSize: 'clamp(11px,1.3vw,13px)', letterSpacing: 6, color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: 20 }}>
            Access Tiers
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(32px,5vw,60px)', fontWeight: 700, color: TEXT, letterSpacing: 2, marginBottom: 20, lineHeight: 1.1 }}>
            Choose Your Shadow
          </h1>
          <p style={{ fontFamily: BODY, fontStyle: 'italic', fontSize: 'clamp(16px,2vw,22px)', color: MUTED, lineHeight: 1.8, maxWidth: 560, margin: '0 auto 32px' }}>
            The floor never drops. The standard never moves. The only question is how deep you want to go.
          </p>
          {/* Founding 100 callout */}
          <div style={{
            display: 'inline-block',
            border: '1px solid rgba(201,168,76,0.3)',
            background: 'rgba(201,168,76,0.05)',
            padding: '12px 32px',
            fontFamily: MONO,
            fontSize: 'clamp(11px,1.2vw,13px)',
            letterSpacing: 3,
            color: GOLD,
            textTransform: 'uppercase',
          }}>
            Founding 100 — Locked-in price forever. First 100 subscribers only.
          </div>
        </div>

        {/* Tier Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px,100%), 1fr))',
          gap: 2,
          marginBottom: 80,
        }}>
          {TIERS.map(tier => (
            <div
              key={tier.name}
              style={{
                background: tier.featured ? 'rgba(100,60,200,0.06)' : 'rgba(255,255,255,0.015)',
                border: `1px solid ${tier.featured ? 'rgba(160,112,224,0.3)' : 'rgba(255,255,255,0.04)'}`,
                padding: '40px 30px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {tier.featured && (
                <div style={{
                  position: 'absolute', top: -1, left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg, transparent, rgba(160,112,224,0.8), transparent)',
                }} />
              )}
              {tier.featured && (
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  fontFamily: MONO, fontSize: 10, letterSpacing: 3,
                  color: 'rgba(160,112,224,0.7)',
                  textTransform: 'uppercase',
                }}>
                  Most Chosen
                </div>
              )}

              <div style={{ fontFamily: SERIF, fontSize: 'clamp(14px,1.6vw,17px)', letterSpacing: 5, color: tier.accent, marginBottom: 16, textTransform: 'uppercase' }}>
                {tier.name}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 'clamp(36px,4vw,52px)', color: TEXT, lineHeight: 1, marginBottom: 4 }}>
                {tier.price}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 'clamp(11px,1.2vw,13px)', letterSpacing: 3, color: MUTED, marginBottom: 20, textTransform: 'uppercase' }}>
                {tier.period}
              </div>
              <div style={{ fontFamily: BODY, fontStyle: 'italic', fontSize: 'clamp(14px,1.5vw,17px)', color: MUTED, marginBottom: 28, lineHeight: 1.6 }}>
                {tier.tag}
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 24 }} />

              <ul style={{ listStyle: 'none', marginBottom: 32, flex: 1 }}>
                {tier.feats.map(f => (
                  <li key={f} style={{
                    fontFamily: MONO,
                    fontSize: 'clamp(11px,1.2vw,13px)',
                    letterSpacing: 1,
                    color: MUTED,
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    lineHeight: 1.5,
                  }}>
                    <span style={{ color: 'rgba(201,168,76,0.35)', flexShrink: 0 }}>+</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  fontFamily: SERIF,
                  fontSize: 'clamp(11px,1.2vw,13px)',
                  letterSpacing: 4,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '16px 20px',
                  textDecoration: 'none',
                  background: tier.name === 'ACCESS' ? 'transparent' : tier.name === 'PRESTIGE' ? 'rgba(100,60,200,0.15)' : 'transparent',
                  border: `1px solid ${tier.accent}`,
                  color: tier.accent,
                  transition: 'all 0.2s',
                }}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Trial note */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontFamily: BODY, fontStyle: 'italic', fontSize: 'clamp(15px,1.8vw,19px)', color: MUTED }}>
            Not ready to commit? <Link href="/subscribe" style={{ color: 'rgba(201,168,76,0.7)', textDecoration: 'none' }}>Try 7 days for $5</Link> — then choose your tier.
          </p>
        </div>

        {/* FAQ strip */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 60 }}>
          <p style={{ fontFamily: MONO, fontSize: 'clamp(11px,1.3vw,13px)', letterSpacing: 5, color: 'rgba(201,168,76,0.4)', textTransform: 'uppercase', marginBottom: 40, textAlign: 'center' }}>
            Common Questions
          </p>
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel at any time from your account. No questions. No retention loops. Access continues until the end of your billing period.' },
            { q: 'What license do downloads carry?', a: 'All downloadable content is CC0 — no attribution required, commercial use permitted, post anywhere without restriction.' },
            { q: 'What is the Founding 100 price lock?', a: 'The first 100 subscribers get their chosen tier price locked forever. When public pricing increases, they stay at the rate they joined at.' },
            { q: 'What currencies are accepted?', a: 'USD. Payments processed by Paddle. Regional pricing for East Africa, West Africa, and South Africa is coming in Phase 2.' },
          ].map(item => (
            <div key={item.q} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '24px 0', maxWidth: 760, margin: '0 auto' }}>
              <p style={{ fontFamily: SERIF, fontSize: 'clamp(14px,1.6vw,18px)', color: TEXT, marginBottom: 10, letterSpacing: 0.5 }}>{item.q}</p>
              <p style={{ fontFamily: BODY, fontSize: 'clamp(14px,1.5vw,17px)', color: MUTED, lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.03)', padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: SERIF, fontSize: 13, letterSpacing: 6, color: 'rgba(201,168,76,0.4)' }}>UMBRA</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Refunds', '/refunds']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 3, color: MUTED, textDecoration: 'none', textTransform: 'uppercase' }}>{l}</Link>
          ))}
        </div>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>© 2026 Tempest Group</span>
      </footer>
    </div>
  );
}
