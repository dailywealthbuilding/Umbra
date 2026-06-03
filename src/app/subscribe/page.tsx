'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'

declare global {
  interface Window {
    PaystackPop: { newTransaction: (o: Record<string, unknown>) => { openIframe: () => void } }
  }
}

const TIERS = [
  { id: 'access',   name: 'ACCESS',   price: 'Free', kes: '',           color: 'rgba(180,180,205,.5)',  border: 'rgba(180,180,205,.12)', features: ['Browse the gallery', '5 downloads/month', 'Basic search'],                                                   cta: 'Current Plan',       free: true  },
  { id: 'noir',     name: 'NOIR',     price: '$15',  kes: 'KES 2,000',  color: 'rgba(201,168,76,.9)',   border: 'rgba(201,168,76,.3)',   features: ['30 downloads/month', 'Full search & filters', 'Early drop access', 'Watermark-free'],                          cta: 'Enter the Shadow',   free: false },
  { id: 'prestige', name: 'PRESTIGE', price: '$39',  kes: 'KES 5,000',  color: 'rgba(160,120,220,.9)',  border: 'rgba(160,120,220,.3)', features: ['Unlimited downloads', 'Ghost collections', 'Bidding access', 'Priority support'],                              cta: 'Claim Prestige',     free: false },
  { id: 'obsidian', name: 'OBSIDIAN', price: '$99',  kes: 'KES 13,000', color: 'rgba(40,200,180,.9)',   border: 'rgba(40,200,180,.3)',  features: ['Everything in PRESTIGE', 'API access', 'Spice Route curation', 'Founding member status'],                       cta: 'Ascend to Obsidian', free: false },
]

export default function SubscribePage() {
  const [userTier, setTier]       = useState('access')
  const [loading, setLoading]     = useState(false)
  const [ready, setReady]         = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/auth/signup'); return }
      const { data: p } = await sb.from('profiles').select('tier').eq('id', user.id).single()
      setTier(p?.tier ?? 'access')
    }
    init()
  }, [router])

  async function handleSubscribe(tierId: string) {
    if (loading || !ready) return
    setLoading(true)
    try {
      const res  = await fetch('/api/paystack/init', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: tierId }) })
      const data = await res.json()
      if (!data.access_code) throw new Error(data.error)
      window.PaystackPop.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        accessCode: data.access_code,
        onSuccess: () => router.push('/browse?subscribed=true'),
        onCancel:  () => setLoading(false),
      }).openIframe()
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <>
      <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" onLoad={() => setReady(true)} />
      <div style={{ minHeight: '100vh', background: '#050505', color: 'rgba(220,215,200,.9)', fontFamily: "'Courier Prime', monospace" }}>
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', background: 'rgba(5,5,5,.96)', borderBottom: '1px solid rgba(201,168,76,.07)', display: 'flex', alignItems: 'center', padding: '0 28px', zIndex: 100, backdropFilter: 'blur(12px)' }}>
          <Link href="/" style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', letterSpacing: '6px', color: 'rgba(201,168,76,.9)', textDecoration: 'none', flex: 1 }}>UMBRA</Link>
          <Link href="/browse" style={{ fontSize: '9px', letterSpacing: '3px', color: 'rgba(180,180,205,.35)', textDecoration: 'none' }}>BACK TO GALLERY</Link>
        </nav>

        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '100px 24px 80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', letterSpacing: '8px', color: 'rgba(201,168,76,.45)', fontWeight: 400, margin: '0 0 16px' }}>SHADOW TIERS</h1>
            <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(180,180,205,.25)', margin: 0 }}>Choose your depth of access.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
            {TIERS.map(t => {
              const isCurrent = userTier === t.id
              return (
                <div key={t.id} style={{ border: `1px solid ${isCurrent ? t.border : 'rgba(201,168,76,.06)'}`, background: isCurrent ? 'rgba(201,168,76,.02)' : '#080808', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                  {isCurrent && <div style={{ position: 'absolute', top: '-1px', right: '16px', fontSize: '7px', letterSpacing: '2px', color: t.color, background: '#050505', padding: '3px 8px', border: `1px solid ${t.border}`, borderTop: 'none' }}>ACTIVE</div>}

                  <div>
                    <div style={{ fontSize: '9px', letterSpacing: '5px', color: t.color, marginBottom: '12px' }}>{t.name}</div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: '26px', color: 'rgba(220,215,200,.9)' }}>
                      {t.price}{!t.free && <span style={{ fontSize: '11px', color: 'rgba(180,180,205,.3)' }}>/mo</span>}
                    </div>
                    {t.kes && <div style={{ fontSize: '8px', letterSpacing: '2px', color: 'rgba(180,180,205,.2)', marginTop: '4px' }}>{t.kes}/month</div>}
                  </div>

                  <div style={{ flex: 1 }}>
                    {t.features.map((f, i) => (
                      <div key={i} style={{ fontSize: '10px', letterSpacing: '1px', color: 'rgba(180,180,205,.45)', marginBottom: '10px', display: 'flex', gap: '8px' }}>
                        <span style={{ color: t.color }}>+</span>{f}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => !t.free && !isCurrent && handleSubscribe(t.id)}
                    disabled={t.free || isCurrent || loading}
                    style={{ background: 'transparent', border: `1px solid ${isCurrent ? t.border : t.free ? 'rgba(180,180,205,.08)' : 'rgba(201,168,76,.3)'}`, color: isCurrent ? t.color : t.free ? 'rgba(180,180,205,.25)' : 'rgba(201,168,76,.8)', fontSize: '9px', letterSpacing: '3px', padding: '12px', cursor: t.free || isCurrent ? 'default' : 'pointer', opacity: loading ? 0.5 : 1, fontFamily: "'Courier Prime', monospace", width: '100%', transition: 'all .3s' }}
                  >
                    {isCurrent ? 'ACTIVE' : loading ? '...' : t.cta.toUpperCase()}
                  </button>
                </div>
              )
            })}
          </div>

          <p style={{ textAlign: 'center', marginTop: '48px', fontSize: '9px', letterSpacing: '2px', color: 'rgba(180,180,205,.18)', lineHeight: 2.2 }}>
            Billed monthly in KES. International Visa/Mastercard accepted.<br/>
            Cancel anytime from your Paystack customer portal.
          </p>
        </main>
      </div>
    </>
  )
}
