'use client'
import { useState, useEffect } from 'react'
import Script from 'next/script'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

declare global {
  interface Window {
    PaystackPop: { newTransaction: (c: Record<string, unknown>) => void }
  }
}

const TIERS = [
  {
    id: 'access', name: 'SHADOW', price: '$0', kes: 'Free Forever',
    tagline: 'Step into the threshold.',
    desc: 'The door is open. The vault awaits its first visit.',
    features: ['Browse the vault gallery', '5 downloads / month', 'Signal feed access', 'Community drops'],
    cta: 'Enter Free', plan: null, rgb: '90,90,106', featured: false,
  },
  {
    id: 'noir', name: 'NOIR', price: '$15', kes: 'KES 2,000 / mo',
    tagline: 'For those who see in the dark.',
    desc: 'Curated access. The primary chambers unlock their full depth.',
    features: ['30 downloads / month', 'Full gallery access', 'Early drop alerts', 'Advanced search', 'Collector archive'],
    cta: 'Claim NOIR', plan: 'noir', rgb: '201,168,76', featured: false,
  },
  {
    id: 'prestige', name: 'PRESTIGE', price: '$39', kes: 'KES 5,000 / mo',
    tagline: 'Architects of taste.',
    desc: 'Unlimited. Ghost collections. You know before anyone else.',
    features: ['Unlimited downloads', 'Ghost collections', 'Priority drop access', 'Bidding rights', 'Curator table'],
    cta: 'Ascend to PRESTIGE', plan: 'prestige', rgb: '139,92,246', featured: true,
  },
  {
    id: 'obsidian', name: 'OBSIDIAN', price: '$99', kes: 'KES 13,000 / mo',
    tagline: 'Beyond the velvet rope.',
    desc: 'Everything. Plus the things we never announce to anyone.',
    features: ['Everything in PRESTIGE', 'Full API access', 'Spice Route collection', 'Private vault corridor', 'Direct founder line'],
    cta: 'Enter OBSIDIAN', plan: 'obsidian', rgb: '13,148,136', featured: false,
  },
]

const TILES = [
  { h: 280, g: 'linear-gradient(160deg,#1a1220,#0d0820)', loc: 'Kampala', mood: 'Golden Hour', tag: 'EAST AFRICA' },
  { h: 200, g: 'linear-gradient(160deg,#0a1a2e,#051020)', loc: 'Seoul', mood: 'Neon Rain', tag: 'EAST ASIA' },
  { h: 340, g: 'linear-gradient(160deg,#1a0a10,#0d0508)', loc: 'Havana', mood: 'Cinematic Decay', tag: 'CARIBBEAN' },
  { h: 220, g: 'linear-gradient(160deg,#0f1a0a,#070e05)', loc: 'Tbilisi', mood: 'Stone and Ivy', tag: 'CAUCASUS' },
  { h: 260, g: 'linear-gradient(160deg,#1a1510,#0d0c08)', loc: 'Medina', mood: 'Ochre Silence', tag: 'NORTH AFRICA' },
  { h: 180, g: 'linear-gradient(160deg,#0a1520,#050c14)', loc: 'Lagos', mood: 'Electric Pulse', tag: 'WEST AFRICA' },
  { h: 300, g: 'linear-gradient(160deg,#150a1a,#0c0510)', loc: 'Patagonia', mood: 'Glacial Void', tag: 'SOUTH AMERICA' },
  { h: 240, g: 'linear-gradient(160deg,#1a1010,#100808)', loc: 'Bali', mood: 'Ceremonial Dark', tag: 'SOUTHEAST ASIA' },
  { h: 200, g: 'linear-gradient(160deg,#0a1018,#050810)', loc: 'Montreal', mood: 'Winter Amber', tag: 'NORTH AMERICA' },
  { h: 260, g: 'linear-gradient(160deg,#181018,#0f080f)', loc: 'Kyoto', mood: 'Shadow Temple', tag: 'JAPAN' },
  { h: 220, g: 'linear-gradient(160deg,#101818,#080f0f)', loc: 'Nairobi', mood: 'Urban Rain', tag: 'EAST AFRICA' },
  { h: 300, g: 'linear-gradient(160deg,#181208,#0f0c05)', loc: 'Lisbon', mood: 'Fado Light', tag: 'EUROPE' },
]

export default function SubscribePage() {
  const [user, setUser] = useState<{ email?: string; id: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTier, setActiveTier] = useState<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [hoveredTile, setHoveredTile] = useState<number | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser({ email: user.email, id: user.id })
    })
  }, [])

  async function handleSubscribe(plan: string | null, tierName: string) {
    if (!plan) { window.location.href = '/auth/signup'; return }
    if (!user) { window.location.href = '/auth/login?redirect=/subscribe'; return }
    if (!scriptReady || !window.PaystackPop) { alert('Payment loading. Try again.'); return }
    setLoading(true)
    setActiveTier(tierName)
    try {
      const res = await fetch('/api/paystack/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const { access_code, reference } = await res.json()
      if (!access_code) throw new Error('No access code')
      window.PaystackPop.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        accessCode: access_code,
        reference,
        onSuccess: () => { window.location.href = '/browse?subscribed=1' },
        onCancel: () => { setLoading(false); setActiveTier(null) },
      })
    } catch {
      alert('Payment failed. Please try again.')
      setLoading(false)
      setActiveTier(null)
    }
  }

  return (
    <>
      <Script
        src="https://js.paystack.co/v2/inline.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Courier+Prime:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <div style={{ background: '#050507', minHeight: '100vh', color: '#d4d4e0', fontFamily: "'DM Sans',sans-serif", fontWeight: 300 }}>

        {/* NAV */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,7,0.97)', WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,168,76,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 60 }}>
          <Link href="/" style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, color: '#c9a84c', letterSpacing: 4, textDecoration: 'none' }}>
            UMBRA
          </Link>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            <Link href="/browse" style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(212,212,224,0.4)', textDecoration: 'none' }}>
              The Vault
            </Link>
            {user
              ? <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 11, letterSpacing: 3, color: '#c9a84c', textTransform: 'uppercase' }}>{user.email?.split('@')[0]}</span>
              : <Link href="/auth/login" style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(212,212,224,0.4)', textDecoration: 'none' }}>Sign In</Link>
            }
          </div>
        </nav>

        {/* HERO */}
        <section style={{ position: 'relative', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 40px 60px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%,rgba(201,168,76,0.05),transparent 65%)', pointerEvents: 'none' }} />
          <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: 8, color: '#8a6f33', textTransform: 'uppercase', marginBottom: 36 }}>
            The Shadow Gallery — Membership
          </p>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(64px,14vw,160px)', fontWeight: 900, lineHeight: 0.88, background: 'linear-gradient(135deg,#c9a84c 0%,#f0d990 38%,#c9a84c 58%,#8a6f33 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', marginBottom: 30 }}>
            UMBRA
          </h1>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(17px,2.2vw,26px)', fontStyle: 'italic', color: 'rgba(212,212,224,0.55)', letterSpacing: 1.5, maxWidth: 560, lineHeight: 1.65, marginBottom: 24 }}>
            The vault is open. What you see depends on where you stand.
          </p>
          <div style={{ width: 56, height: 1, background: 'linear-gradient(90deg,transparent,#c9a84c,transparent)', margin: '0 auto 20px' }} />
          <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 11, letterSpacing: 5, color: '#5a5a6a', textTransform: 'uppercase' }}>
            2,400+ Pieces · 4 Access Levels · 1 World
          </p>
        </section>

        {/* VAULT PREVIEW — MASONRY GALLERY */}
        <section style={{ padding: '0 32px 80px', maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 7, color: '#8a6f33', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              A Glimpse Inside
            </span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(201,168,76,0.18),transparent)' }} />
            <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: 3, color: '#3a3a4a', whiteSpace: 'nowrap' }}>
              {TILES.length} of 2,400+ unlockable pieces
            </span>
          </div>

          {/* CSS columns masonry */}
          <div style={{ columns: '4 220px', columnGap: 4 }}>
            {TILES.map((tile, i) => (
              <div
                key={i}
                style={{ breakInside: 'avoid', marginBottom: 4, position: 'relative', height: tile.h, background: tile.g, overflow: 'hidden', cursor: 'pointer', display: 'block' }}
                onMouseEnter={() => setHoveredTile(i)}
                onMouseLeave={() => setHoveredTile(null)}
              >
                <div style={{ position: 'absolute', inset: 0, WebkitBackdropFilter: 'blur(14px)', backdropFilter: 'blur(14px)', background: 'rgba(5,5,7,0.45)', transition: 'all 0.4s' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16 }}>
                  <span style={{ fontFamily: "'Cinzel',serif", fontSize: hoveredTile === i ? 13 : 11, color: hoveredTile === i ? 'rgba(212,212,224,0.9)' : 'rgba(212,212,224,0.35)', letterSpacing: 2, textAlign: 'center', lineHeight: 1.4, transition: 'all 0.3s' }}>
                    {tile.loc}
                  </span>
                  {hoveredTile === i && (
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, fontStyle: 'italic', color: 'rgba(201,168,76,0.7)', letterSpacing: 1 }}>
                      {tile.mood}
                    </span>
                  )}
                </div>
                <div style={{ position: 'absolute', bottom: 10, left: 12, fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 3, color: 'rgba(201,168,76,0.35)', textTransform: 'uppercase' }}>
                  {tile.tag}
                </div>
                <div style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 2, color: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.08)', padding: '2px 7px', textTransform: 'uppercase' }}>
                  LOCKED
                </div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 28, fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontStyle: 'italic', color: 'rgba(212,212,224,0.3)' }}>
            Kampala. Seoul. Havana. Tbilisi. Lagos. And 2,388 more.
          </p>
        </section>

        {/* CHAMBER KEYS — TIER CARDS */}
        <section style={{ padding: '60px 32px 100px', maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <p style={{ fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 8, color: '#8a6f33', textTransform: 'uppercase', marginBottom: 20 }}>
              Your Access Level
            </p>
            <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(30px,4.5vw,54px)', fontWeight: 700, color: '#d4d4e0', marginBottom: 16, lineHeight: 1.05 }}>
              Choose Your Chamber
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontStyle: 'italic', color: '#7a7a8a', maxWidth: 500, margin: '0 auto' }}>
              Every level unlocks a different depth of the vault.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 4, alignItems: 'start' }}>
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                style={{
                  position: 'relative',
                  background: tier.featured
                    ? `linear-gradient(180deg,rgba(${tier.rgb},0.1),rgba(${tier.rgb},0.03))`
                    : 'rgba(255,255,255,0.015)',
                  border: tier.featured
                    ? `1px solid rgba(${tier.rgb},0.4)`
                    : '1px solid rgba(255,255,255,0.04)',
                  padding: tier.featured ? '44px 32px' : '36px 28px',
                  transform: tier.featured ? 'translateY(-8px)' : 'none',
                  transition: 'all 0.35s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = `rgba(${tier.rgb},0.5)`
                  el.style.transform = tier.featured ? 'translateY(-12px)' : 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = tier.featured ? `rgba(${tier.rgb},0.4)` : 'rgba(255,255,255,0.04)'
                  el.style.transform = tier.featured ? 'translateY(-8px)' : 'none'
                }}
              >
                {tier.featured && (
                  <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: `rgb(${tier.rgb})`, background: '#050507', padding: '0 14px', border: `1px solid rgba(${tier.rgb},0.35)`, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    Most Chosen
                  </div>
                )}

                <div style={{ width: 32, height: 2, background: `rgba(${tier.rgb},0.7)`, marginBottom: 24 }} />

                <p style={{ fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 7, color: `rgba(${tier.rgb},0.8)`, textTransform: 'uppercase', marginBottom: 12 }}>
                  {tier.name}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Cinzel',serif", fontSize: 52, fontWeight: 700, color: '#d4d4e0', lineHeight: 1 }}>
                    {tier.price}
                  </span>
                  {tier.plan && <span style={{ fontSize: 12, color: '#5a5a6a', letterSpacing: 1 }}>/mo</span>}
                </div>

                <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, color: '#3a3a4a', letterSpacing: 3, marginBottom: 24, textTransform: 'uppercase' }}>
                  {tier.kes}
                </p>

                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontStyle: 'italic', color: 'rgba(212,212,224,0.8)', marginBottom: 6, lineHeight: 1.35 }}>
                  {tier.tagline}
                </p>

                <p style={{ fontSize: 13, color: '#7a7a8a', marginBottom: 28, lineHeight: 1.7 }}>
                  {tier.desc}
                </p>

                <div style={{ height: 1, background: `rgba(${tier.rgb},0.1)`, marginBottom: 24 }} />

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {tier.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontSize: 13, color: '#9a9aaa', lineHeight: 1.5 }}>
                      <span style={{ color: `rgba(${tier.rgb},0.6)`, fontSize: 8, marginTop: 4, flexShrink: 0 }}>&#9670;</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier.plan, tier.name)}
                  disabled={loading && activeTier === tier.name}
                  style={{
                    width: '100%',
                    padding: '15px 24px',
                    background: tier.featured ? `rgba(${tier.rgb},0.18)` : 'transparent',
                    border: `1px solid rgba(${tier.rgb},0.45)`,
                    color: `rgb(${tier.rgb})`,
                    fontFamily: "'Cinzel',serif",
                    fontSize: 10,
                    letterSpacing: 4,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    opacity: loading && activeTier === tier.name ? 0.5 : 1,
                  }}
                  onMouseEnter={e => {
                    const b = e.currentTarget
                    b.style.background = `rgba(${tier.rgb},0.25)`
                    b.style.borderColor = `rgba(${tier.rgb},0.8)`
                  }}
                  onMouseLeave={e => {
                    const b = e.currentTarget
                    b.style.background = tier.featured ? `rgba(${tier.rgb},0.18)` : 'transparent'
                    b.style.borderColor = `rgba(${tier.rgb},0.45)`
                  }}
                >
                  {loading && activeTier === tier.name ? 'Opening...' : tier.cta}
                </button>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 64 }}>
            <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: 4, color: '#3a3a4a', marginBottom: 10, textTransform: 'uppercase' }}>
              Cancel Anytime · Paystack Secured · All Cards Accepted
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: 'italic', color: 'rgba(212,212,224,0.25)' }}>
              Prices shown in USD. Charged in KES. Your bank handles conversion.
            </p>
          </div>
        </section>

        {/* MANIFESTO CLOSE */}
        <div style={{ borderTop: '1px solid rgba(201,168,76,0.07)', padding: '72px 40px', textAlign: 'center', background: 'rgba(10,10,15,0.6)' }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(20px,3vw,34px)', fontStyle: 'italic', color: 'rgba(212,212,224,0.35)', maxWidth: 680, margin: '0 auto', lineHeight: 1.65 }}>
            "UMBRA does not collect images. It collects the feeling right before the light disappears."
          </p>
          <div style={{ width: 44, height: 1, background: 'linear-gradient(90deg,transparent,#c9a84c,transparent)', margin: '32px auto' }} />
          <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: 5, color: '#3a3a4a', textTransform: 'uppercase' }}>
            UMBRA · The Shadow Gallery · 2026
          </p>
        </div>

      </div>
    </>
  )
}
