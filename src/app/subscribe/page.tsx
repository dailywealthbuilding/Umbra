'use client';

/**
 * UMBRA — Subscribe Page
 * Paddle Billing integration. No free tier. $5 / 7-day trial.
 *
 * SETUP CHECKLIST (do this in Paddle dashboard before going live):
 * 1. Create account at paddle.com → select Kenya as your country
 * 2. Create 4 products: NOIR ($15/mo), PRESTIGE ($39/mo), OBSIDIAN ($99/mo), TRIAL ($5 one-time → 7 days)
 * 3. Copy the Price IDs (format: pri_xxxxxxxxxxxx) into your Vercel env vars:
 *    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN   = live_xxxxxxxxxxxxxxxxx  (from Paddle > Developer)
 *    NEXT_PUBLIC_PADDLE_NOIR_PRICE     = pri_xxxxxxxxxxxx
 *    NEXT_PUBLIC_PADDLE_PRESTIGE_PRICE = pri_xxxxxxxxxxxx
 *    NEXT_PUBLIC_PADDLE_OBSIDIAN_PRICE = pri_xxxxxxxxxxxx
 *    NEXT_PUBLIC_PADDLE_TRIAL_PRICE    = pri_xxxxxxxxxxxx
 * 4. Add webhook: https://umbra-wine.vercel.app/api/paddle/webhook
 *    Events to listen for: subscription.created, subscription.cancelled, transaction.completed
 * 5. Paddle pays out via bank wire to your Kenyan account — set up in Paddle > Payouts
 */

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

declare global {
  interface Window {
    Paddle: {
      Initialize: (config: { token: string }) => void;
      Checkout: {
        open: (config: Record<string, unknown>) => void;
      };
    };
  }
}

// ── Tier definitions — no free tier ────────────────────────────────────────
const TIERS = [
  {
    id:       'noir',
    name:     'NOIR',
    price:    '$15',
    period:   '/month',
    tagline:  'For creators who see in the dark.',
    desc:     'The vault opens. Premium dark luxury b-roll, ready to post.',
    rgb:      '201,168,76',
    features: [
      '30 CC0 downloads per month',
      'Full sensory search engine',
      'Full vault gallery access',
      'The Block auction access',
      'Priority new arrivals',
      '24hr early drop access',
    ],
    cta:       'Start with NOIR',
    priceEnv:  'NEXT_PUBLIC_PADDLE_NOIR_PRICE',
    featured:  false,
  },
  {
    id:       'prestige',
    name:     'PRESTIGE',
    price:    '$39',
    period:   '/month',
    tagline:  'Architects of taste.',
    desc:     'Unlimited. Ghost collections. 48hr early access. No limits.',
    rgb:      '139,92,246',
    features: [
      'Unlimited CC0 downloads',
      'Ghost collections access',
      'Full sensory engine + history',
      '48hr early drop access',
      'The Block early bidding',
      'Aesthetic DNA report',
      'Whisper Network newsletter',
    ],
    cta:       'Ascend to PRESTIGE',
    priceEnv:  'NEXT_PUBLIC_PADDLE_PRESTIGE_PRICE',
    featured:  true,
  },
  {
    id:       'obsidian',
    name:     'OBSIDIAN',
    price:    '$99',
    period:   '/month',
    tagline:  'Beyond the velvet rope.',
    desc:     'Everything. Plus what we never announce publicly.',
    rgb:      '13,148,136',
    features: [
      'Everything in PRESTIGE',
      'Direct API access (1K calls/mo)',
      'The Spice Route collection',
      'The Inner Circle dispatches',
      '72hr early drop access',
      'Sovereign communications',
      'Analog Signal quarterly print',
    ],
    cta:       'Enter OBSIDIAN',
    priceEnv:  'NEXT_PUBLIC_PADDLE_OBSIDIAN_PRICE',
    featured:  false,
  },
];

// Location tiles for the vault preview section
const TILES = [
  { h: 280, g: 'linear-gradient(160deg,#1a1220,#0d0820)', loc: 'Kampala',   mood: 'Golden Hour',     tag: 'EAST AFRICA' },
  { h: 200, g: 'linear-gradient(160deg,#0a1a2e,#051020)', loc: 'Seoul',     mood: 'Neon Rain',       tag: 'EAST ASIA' },
  { h: 340, g: 'linear-gradient(160deg,#1a0a10,#0d0508)', loc: 'Havana',    mood: 'Cinematic Decay', tag: 'CARIBBEAN' },
  { h: 220, g: 'linear-gradient(160deg,#0f1a0a,#070e05)', loc: 'Tbilisi',   mood: 'Stone and Ivy',   tag: 'CAUCASUS' },
  { h: 260, g: 'linear-gradient(160deg,#1a1510,#0d0c08)', loc: 'Medina',    mood: 'Ochre Silence',   tag: 'NORTH AFRICA' },
  { h: 180, g: 'linear-gradient(160deg,#0a1520,#050c14)', loc: 'Lagos',     mood: 'Electric Pulse',  tag: 'WEST AFRICA' },
  { h: 300, g: 'linear-gradient(160deg,#150a1a,#0c0510)', loc: 'Patagonia', mood: 'Glacial Void',    tag: 'SOUTH AMERICA' },
  { h: 240, g: 'linear-gradient(160deg,#1a1010,#100808)', loc: 'Bali',      mood: 'Ceremonial Dark', tag: 'SOUTHEAST ASIA' },
  { h: 200, g: 'linear-gradient(160deg,#0a1018,#050810)', loc: 'Montreal',  mood: 'Winter Amber',    tag: 'NORTH AMERICA' },
  { h: 260, g: 'linear-gradient(160deg,#181018,#0f080f)', loc: 'Kyoto',     mood: 'Shadow Temple',   tag: 'JAPAN' },
  { h: 220, g: 'linear-gradient(160deg,#101818,#080f0f)', loc: 'Nairobi',   mood: 'Urban Rain',      tag: 'EAST AFRICA' },
  { h: 300, g: 'linear-gradient(160deg,#181208,#0f0c05)', loc: 'Lisbon',    mood: 'Fado Light',      tag: 'EUROPE' },
];

export default function SubscribePage() {
  const [user,        setUser       ] = useState<{ email?: string; id: string } | null>(null);
  const [loading,     setLoading    ] = useState(false);
  const [activeTier,  setActiveTier ] = useState<string | null>(null);
  const [paddleReady, setPaddleReady] = useState(false);
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser({ email: user.email, id: user.id });
    });
  }, []);

  // ── Paddle checkout ────────────────────────────────────────────────────
  async function handleCheckout(priceId: string | undefined, tierName: string) {
    if (!priceId) {
      alert('Payment not yet configured. Please check back shortly.');
      return;
    }
    if (!user) {
      window.location.href = `/auth/login?redirect=/subscribe`;
      return;
    }
    if (!paddleReady || !window.Paddle) {
      alert('Payment loading — please try again in a moment.');
      return;
    }
    setLoading(true);
    setActiveTier(tierName);
    try {
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: user.email },
        customData: { userId: user.id },
        settings: {
          successUrl: `${window.location.origin}/browse?subscribed=1`,
          theme: 'dark',
        },
      });
    } catch (err) {
      console.error('Paddle checkout error:', err);
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
      setActiveTier(null);
    }
  }

  async function handleTrial() {
    const priceId = process.env.NEXT_PUBLIC_PADDLE_TRIAL_PRICE;
    await handleCheckout(priceId, 'TRIAL');
  }

  function handleTierClick(tier: typeof TIERS[number]) {
    const priceId = process.env[tier.priceEnv];
    handleCheckout(priceId, tier.name);
  }

  const BG   = '#050507';
  const GOLD = '#c9a84c';
  const MONO = "'Courier Prime', monospace";

  return (
    <>
      {/* Paddle v2 */}
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onReady={() => {
          const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
          if (token && window.Paddle) {
            window.Paddle.Initialize({ token });
            setPaddleReady(true);
          }
        }}
      />

      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Courier+Prime:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { background: ${BG}; color: #d4d4e0; }
        .tier-card { transition: all 0.32s ease; }
        .tier-card:hover { transform: translateY(-4px) !important; }
        .tier-card.featured:hover { transform: translateY(-12px) !important; }
        .tier-btn { transition: all 0.28s ease; }
        .tier-btn:hover { filter: brightness(1.15); }
        .tile { transition: all 0.38s ease; cursor: default; }
        .tile:hover .tile-inner { opacity: 0.18 !important; }
        .tile:hover .tile-loc { font-size: 14px !important; color: rgba(212,212,224,0.9) !important; }
        .tile:hover .tile-mood { display: block !important; }
      `}</style>

      <div style={{ background: BG, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>

        {/* NAV */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(5,5,7,0.97)',
          WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(201,168,76,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 40px', height: 60,
        }}>
          <Link href="/" style={{
            fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 700,
            color: GOLD, letterSpacing: 4, textDecoration: 'none',
          }}>
            UMBRA
          </Link>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            <Link href="/browse" style={{
              fontFamily: MONO, fontSize: 11, letterSpacing: 3,
              textTransform: 'uppercase', color: 'rgba(212,212,224,0.4)',
              textDecoration: 'none',
            }}>
              The Vault
            </Link>
            {user
              ? <span style={{
                  fontFamily: MONO, fontSize: 11, letterSpacing: 3,
                  color: GOLD, textTransform: 'uppercase',
                }}>
                  {user.email?.split('@')[0]}
                </span>
              : <Link href="/auth/login" style={{
                  fontFamily: MONO, fontSize: 11, letterSpacing: 3,
                  textTransform: 'uppercase', color: 'rgba(212,212,224,0.4)',
                  textDecoration: 'none',
                }}>
                  Sign In
                </Link>
            }
          </div>
        </nav>

        {/* TRIAL BANNER */}
        <div style={{
          background: 'rgba(201,168,76,0.07)',
          borderBottom: '1px solid rgba(201,168,76,0.14)',
          padding: '14px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 24, flexWrap: 'wrap',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic', fontSize: 16,
            color: 'rgba(212,212,224,0.8)', margin: 0,
          }}>
            Not sure yet? Try the full vault for 7 days.
          </p>
          <button
            onClick={handleTrial}
            style={{
              fontFamily: MONO, fontSize: 10, letterSpacing: 4,
              textTransform: 'uppercase', color: '#050507',
              background: GOLD, border: 'none',
              padding: '9px 22px', cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Start 7-Day Trial — $5
          </button>
          <p style={{
            fontFamily: MONO, fontSize: 9, letterSpacing: 2,
            color: 'rgba(212,212,224,0.28)', margin: 0,
            textTransform: 'uppercase',
          }}>
            Then continues as NOIR ($15/mo). Cancel anytime.
          </p>
        </div>

        {/* HERO */}
        <section style={{
          position: 'relative', padding: '80px 40px 60px',
          textAlign: 'center', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 60%, rgba(201,168,76,0.05), transparent 65%)',
            pointerEvents: 'none',
          }} />
          <p style={{
            fontFamily: MONO, fontSize: 10, letterSpacing: 8,
            color: '#8a6f33', textTransform: 'uppercase', marginBottom: 28,
          }}>
            Dark Luxury Content — Membership
          </p>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(48px,10vw,120px)', fontWeight: 900, lineHeight: 0.9,
            background: 'linear-gradient(135deg,#c9a84c,#f0d990 38%,#c9a84c 58%,#8a6f33)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            marginBottom: 28,
          }}>
            UMBRA
          </h1>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(17px,2.2vw,24px)',
            fontStyle: 'italic', color: 'rgba(212,212,224,0.6)',
            letterSpacing: 1.5, maxWidth: 580, margin: '0 auto 28px', lineHeight: 1.65,
          }}>
            Dark luxury b-roll your feed has been missing.
            Download, post, and stand out — no shoots, no attribution, no compromise.
          </p>
          <div style={{
            width: 56, height: 1,
            background: 'linear-gradient(90deg,transparent,#c9a84c,transparent)',
            margin: '0 auto 20px',
          }} />
          <p style={{
            fontFamily: MONO, fontSize: 11, letterSpacing: 5,
            color: '#5a5a6a', textTransform: 'uppercase',
          }}>
            CC0 Licensed · Weekly Uploads · Cancel Anytime
          </p>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: '0 40px 80px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 2,
          }}>
            {[
              { n: '01', t: 'Browse the Vault', d: 'Search by mood, aesthetic, or region. Type "2AM dark workspace" — the library answers.' },
              { n: '02', t: 'Download Instantly', d: 'CC0 license. No attribution required. Post on TikTok, Reels, or anywhere.' },
              { n: '03', t: 'Post and Stand Out', d: 'Dark luxury content that looks nothing like generic stock. Your feed will show it.' },
            ].map(step => (
              <div key={step.n} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                padding: '32px 28px',
              }}>
                <div style={{
                  fontFamily: MONO, fontSize: 10, letterSpacing: 5,
                  color: 'rgba(201,168,76,0.4)', marginBottom: 16,
                  textTransform: 'uppercase',
                }}>
                  {step.n}
                </div>
                <p style={{
                  fontFamily: "'Cinzel', serif", fontSize: 14,
                  color: '#d4d4e0', marginBottom: 10, letterSpacing: 0.5,
                }}>
                  {step.t}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(212,212,224,0.45)', lineHeight: 1.75 }}>
                  {step.d}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* VAULT PREVIEW */}
        <section style={{ padding: '0 32px 80px', maxWidth: 1440, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28,
          }}>
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 7,
              color: '#8a6f33', textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>
              A Glimpse Inside
            </span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(201,168,76,0.18),transparent)' }} />
          </div>
          <div style={{ columns: '4 180px', columnGap: 3 }}>
            {TILES.map((tile, i) => (
              <div
                key={i}
                className="tile"
                style={{
                  breakInside: 'avoid', marginBottom: 3,
                  position: 'relative', height: tile.h,
                  background: tile.g, overflow: 'hidden',
                }}
                onMouseEnter={() => setHoveredTile(i)}
                onMouseLeave={() => setHoveredTile(null)}
              >
                <div
                  className="tile-inner"
                  style={{
                    position: 'absolute', inset: 0,
                    WebkitBackdropFilter: 'blur(14px)', backdropFilter: 'blur(14px)',
                    background: 'rgba(5,5,7,0.5)',
                    opacity: hoveredTile === i ? 0.18 : 1,
                    transition: 'opacity 0.38s',
                  }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16,
                }}>
                  <span
                    className="tile-loc"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: hoveredTile === i ? 14 : 11,
                      color: hoveredTile === i ? 'rgba(212,212,224,0.9)' : 'rgba(212,212,224,0.35)',
                      letterSpacing: 2, textAlign: 'center', lineHeight: 1.4,
                      transition: 'all 0.3s',
                    }}
                  >
                    {tile.loc}
                  </span>
                  {hoveredTile === i && (
                    <span
                      className="tile-mood"
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 12, fontStyle: 'italic',
                        color: 'rgba(201,168,76,0.7)', letterSpacing: 1,
                      }}
                    >
                      {tile.mood}
                    </span>
                  )}
                </div>
                <div style={{
                  position: 'absolute', bottom: 10, left: 12,
                  fontFamily: MONO, fontSize: 8, letterSpacing: 3,
                  color: 'rgba(201,168,76,0.3)', textTransform: 'uppercase',
                }}>
                  {tile.tag}
                </div>
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  fontFamily: MONO, fontSize: 7, letterSpacing: 2,
                  color: 'rgba(201,168,76,0.18)',
                  border: '1px solid rgba(201,168,76,0.07)',
                  padding: '2px 7px', textTransform: 'uppercase',
                }}>
                  LOCKED
                </div>
              </div>
            ))}
          </div>
          <p style={{
            textAlign: 'center', marginTop: 24,
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 16, fontStyle: 'italic',
            color: 'rgba(212,212,224,0.25)',
          }}>
            Kampala. Seoul. Havana. Tbilisi. Lagos. And hundreds more.
          </p>
        </section>

        {/* TIER CARDS — no free tier */}
        <section style={{ padding: '20px 32px 100px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{
              fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 8,
              color: '#8a6f33', textTransform: 'uppercase', marginBottom: 18,
            }}>
              Choose Your Access Level
            </p>
            <h2 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(28px,4vw,50px)', fontWeight: 700,
              color: '#d4d4e0', marginBottom: 14, lineHeight: 1.05,
            }}>
              Enter The Vault
            </h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 18, fontStyle: 'italic',
              color: '#7a7a8a', maxWidth: 460, margin: '0 auto',
            }}>
              Three chambers. Three depths. One standard of quality.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 4, alignItems: 'start',
          }}>
            {TIERS.map(tier => (
              <div
                key={tier.id}
                className={`tier-card${tier.featured ? ' featured' : ''}`}
                style={{
                  position: 'relative',
                  background: tier.featured
                    ? `linear-gradient(180deg,rgba(${tier.rgb},0.1),rgba(${tier.rgb},0.03))`
                    : 'rgba(255,255,255,0.015)',
                  border: tier.featured
                    ? `1px solid rgba(${tier.rgb},0.4)`
                    : '1px solid rgba(255,255,255,0.04)',
                  padding: tier.featured ? '48px 32px' : '38px 28px',
                  transform: tier.featured ? 'translateY(-8px)' : 'none',
                }}
              >
                {tier.featured && (
                  <div style={{
                    position: 'absolute', top: -11, left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: MONO, fontSize: 9, letterSpacing: 4,
                    color: `rgb(${tier.rgb})`,
                    background: BG, padding: '0 14px',
                    border: `1px solid rgba(${tier.rgb},0.35)`,
                    whiteSpace: 'nowrap', textTransform: 'uppercase',
                  }}>
                    Most Chosen
                  </div>
                )}

                <div style={{ width: 32, height: 2, background: `rgba(${tier.rgb},0.7)`, marginBottom: 24 }} />

                <p style={{
                  fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 7,
                  color: `rgba(${tier.rgb},0.8)`, textTransform: 'uppercase', marginBottom: 12,
                }}>
                  {tier.name}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontFamily: "'Cinzel', serif", fontSize: 50,
                    fontWeight: 700, color: '#d4d4e0', lineHeight: 1,
                  }}>
                    {tier.price}
                  </span>
                  <span style={{ fontSize: 12, color: '#5a5a6a', letterSpacing: 1 }}>
                    {tier.period}
                  </span>
                </div>

                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 17, fontStyle: 'italic',
                  color: 'rgba(212,212,224,0.75)', marginBottom: 8, lineHeight: 1.4,
                }}>
                  {tier.tagline}
                </p>
                <p style={{ fontSize: 13, color: '#7a7a8a', marginBottom: 28, lineHeight: 1.7 }}>
                  {tier.desc}
                </p>

                <div style={{ height: 1, background: `rgba(${tier.rgb},0.1)`, marginBottom: 24 }} />

                <ul style={{
                  listStyle: 'none', margin: '0 0 36px',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  {tier.features.map((f, i) => (
                    <li key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      fontSize: 13, color: '#9a9aaa', lineHeight: 1.5,
                    }}>
                      <span style={{ color: `rgba(${tier.rgb},0.6)`, fontSize: 8, marginTop: 4, flexShrink: 0 }}>
                        &#9670;
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className="tier-btn"
                  onClick={() => handleTierClick(tier)}
                  disabled={loading && activeTier === tier.name}
                  style={{
                    width: '100%', padding: '15px 24px',
                    background: tier.featured ? `rgba(${tier.rgb},0.18)` : 'transparent',
                    border: `1px solid rgba(${tier.rgb},0.45)`,
                    color: `rgb(${tier.rgb})`,
                    fontFamily: "'Cinzel', serif", fontSize: 10,
                    letterSpacing: 4, textTransform: 'uppercase',
                    cursor: loading && activeTier === tier.name ? 'not-allowed' : 'pointer',
                    opacity: loading && activeTier === tier.name ? 0.5 : 1,
                  }}
                >
                  {loading && activeTier === tier.name ? 'Opening...' : tier.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Trust line */}
          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <p style={{
              fontFamily: MONO, fontSize: 10, letterSpacing: 4,
              color: '#3a3a4a', marginBottom: 10, textTransform: 'uppercase',
            }}>
              Cancel Anytime · Paddle Secured · All Major Cards Accepted
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 15, fontStyle: 'italic',
              color: 'rgba(212,212,224,0.22)',
            }}>
              Prices in USD. Billed monthly. No hidden fees.
            </p>
          </div>
        </section>

        {/* FREE 10 CLIPS LEAD MAGNET */}
        <section style={{
          borderTop: '1px solid rgba(201,168,76,0.07)',
          borderBottom: '1px solid rgba(201,168,76,0.07)',
          padding: '56px 40px',
          background: 'rgba(201,168,76,0.03)',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 7,
            color: '#8a6f33', textTransform: 'uppercase', marginBottom: 18,
          }}>
            Not ready to subscribe?
          </p>
          <h3 style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(22px,3vw,36px)',
            fontWeight: 700, color: '#d4d4e0', marginBottom: 14, lineHeight: 1.15,
          }}>
            Download 10 free dark luxury clips
          </h3>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 17, fontStyle: 'italic',
            color: 'rgba(212,212,224,0.45)', maxWidth: 480, margin: '0 auto 32px',
            lineHeight: 1.7,
          }}>
            CC0. No account. No credit card. Just your email — and ten
            clips that will immediately change how your feed looks.
          </p>
          <Link
            href="/#waitlist"
            style={{
              display: 'inline-block',
              fontFamily: "'Cinzel', serif", fontSize: 10,
              letterSpacing: 5, textTransform: 'uppercase',
              color: GOLD, border: '1px solid rgba(201,168,76,0.4)',
              padding: '14px 36px', textDecoration: 'none',
            }}
          >
            Get 10 Free Clips
          </Link>
          <p style={{
            fontFamily: MONO, fontSize: 9, letterSpacing: 3,
            color: 'rgba(212,212,224,0.2)', marginTop: 16, textTransform: 'uppercase',
          }}>
            No attribution required · CC0 license · Keep forever
          </p>
        </section>

        {/* MANIFESTO CLOSE */}
        <div style={{ padding: '64px 40px', textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(18px,2.5vw,30px)', fontStyle: 'italic',
            color: 'rgba(212,212,224,0.3)', maxWidth: 640, margin: '0 auto',
            lineHeight: 1.7,
          }}>
            "What is limited is respected. What is rare is real. What is beautiful — belongs."
          </p>
          <div style={{
            width: 44, height: 1,
            background: 'linear-gradient(90deg,transparent,#c9a84c,transparent)',
            margin: '32px auto',
          }} />
          <p style={{
            fontFamily: MONO, fontSize: 10, letterSpacing: 5,
            color: '#3a3a4a', textTransform: 'uppercase',
          }}>
            UMBRA · The Shadow Gallery · 2026
          </p>
        </div>

      </div>
    </>
  );
}
