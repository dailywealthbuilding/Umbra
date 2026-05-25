'use client'

import { useState, useEffect } from 'react'

const AFFINITIES = [
  { value: 'shadow_noir',       label: 'Shadow Noir — Dark. Cinematic. Absolute.' },
  { value: 'luminous_void',     label: 'Luminous Void — Minimal. Ethereal. Still.' },
  { value: 'ancient_futures',   label: 'Ancient Futures — History meets horizon.' },
  { value: 'brutalist_harmony', label: 'Brutalist Harmony — Raw form. Raw truth.' },
  { value: 'wabi_sabi',         label: 'Wabi-Sabi — Imperfect. Transient. Beautiful.' },
  { value: 'digital_sublime',   label: 'Digital Sublime — Code as art. Light as signal.' },
  { value: 'global_roots',      label: 'Global Roots — Every culture. Every terrain.' },
  { value: 'other',             label: 'Something else entirely.' },
]

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function WaitlistPage() {
  const [form, setForm] = useState({ name: '', email: '', aesthetic_affinity: '' })
  const [status, setStatus]   = useState<Status>('idle')
  const [position, setPos]    = useState<number | null>(null)
  const [errMsg, setErr]       = useState('')
  const [ready, setReady]      = useState(false)

  useEffect(() => { setReady(true) }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.aesthetic_affinity) return

    setStatus('loading')
    setErr('')

    try {
      const res  = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (res.status === 409) { setStatus('success'); setPos(data.position); return }
      if (!res.ok) throw new Error(data.error || 'Failed to enter.')

      setStatus('success')
      setPos(data.position)
    } catch (err: unknown) {
      setStatus('error')
      setErr(err instanceof Error ? err.message : 'An error occurred.')
    }
  }

  const canSubmit = form.email && form.aesthetic_affinity && status !== 'loading'

  return (
    <main className="relative min-h-screen bg-[#080808] overflow-hidden flex flex-col items-center justify-center px-5 py-16">

      {/* ── Ambient Orbs ── */}
      {ready && (
        <>
          <div
            className="umbra-orb animate-orb-drift"
            style={{
              width: 700, height: 700,
              top: -200, left: -250,
              background: 'radial-gradient(circle, rgba(197,164,108,0.055) 0%, transparent 65%)',
            }}
          />
          <div
            className="umbra-orb animate-orb-drift2"
            style={{
              width: 500, height: 500,
              bottom: -150, right: -150,
              background: 'radial-gradient(circle, rgba(197,164,108,0.04) 0%, transparent 65%)',
            }}
          />
          <div
            className="umbra-orb animate-glow-pulse"
            style={{
              width: 320, height: 320,
              top: '35%', left: '55%',
              background: 'radial-gradient(circle, rgba(197,164,108,0.03) 0%, transparent 60%)',
            }}
          />
        </>
      )}

      {/* ── Grain Overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'repeat',
          backgroundSize: '200px',
        }}
      />

      {/* ── Top Edge ── */}
      <div className="fixed top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(197,164,108,0.18)] to-transparent" />

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-[440px] text-center">

        {/* Eyebrow */}
        <p
          className="font-mono text-[9px] tracking-[0.5em] text-[rgba(197,164,108,0.5)] uppercase mb-8 animate-fade-in"
          style={{ opacity: 0, animationDelay: '0.15s' }}
        >
          The World Is Watching
        </p>

        {/* Wordmark */}
        <h1
          className="font-display font-light tracking-umbra text-[clamp(48px,13vw,88px)] text-[#ece8e0] leading-none mb-5 animate-fade-in"
          style={{ opacity: 0, animationDelay: '0.35s' }}
        >
          UMBRA
        </h1>

        {/* Gold Hairline */}
        <div
          className="gold-line w-12 mx-auto mb-6 animate-line-grow"
          style={{ opacity: 0, animationDelay: '0.55s' }}
        />

        {/* Sub-tagline */}
        <p
          className="font-body font-light text-[0.78rem] tracking-wide text-[#444] leading-loose mb-1 animate-fade-in"
          style={{ opacity: 0, animationDelay: '0.65s' }}
        >
          The world&apos;s most complete aesthetic visual content ecosystem.
        </p>
        <p
          className="font-display italic text-[rgba(197,164,108,0.65)] text-[1.05rem] mb-12 animate-fade-in"
          style={{ opacity: 0, animationDelay: '0.8s' }}
        >
          Dark. Luminous. Global.
        </p>

        {/* ── FORM or SUCCESS ── */}
        {status === 'success' ? (
          <div
            className="animate-fade-up border border-[rgba(197,164,108,0.18)] bg-[rgba(197,164,108,0.04)] rounded-sm p-8 text-left"
            style={{ opacity: 0 }}
          >
            <p className="font-mono text-[9px] tracking-[0.45em] text-[rgba(197,164,108,0.55)] uppercase mb-4">
              You&apos;re In
            </p>
            <p className="font-display text-[1.6rem] font-light text-[#ece8e0] mb-3 leading-snug">
              Welcome to the Shadow.
            </p>
            {position !== null && (
              <p className="font-mono text-[11px] text-[#444]">
                Position{' '}
                <span className="text-[#c5a46c]">
                  #{String(position).padStart(4, '0')}
                </span>{' '}
                in the queue.
              </p>
            )}
            <div className="mt-7 pt-6 border-t border-[#1e1e1e]">
              <p className="font-body text-[11px] text-[rgba(255,255,255,0.2)] leading-relaxed">
                You will be contacted when the gates open. The shadow sees you.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="animate-fade-up space-y-3 text-left"
            style={{ opacity: 0, animationDelay: '1s' }}
          >
            <input
              type="text"
              placeholder="Your name (optional)"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="umbra-input"
            />
            <input
              type="email"
              placeholder="Your email address"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="umbra-input"
              required
            />
            <div className="relative">
              <select
                value={form.aesthetic_affinity}
                onChange={e => set('aesthetic_affinity', e.target.value)}
                className="umbra-input cursor-pointer pr-8"
                required
              >
                <option value="" disabled>Your aesthetic affinity —</option>
                {AFFINITIES.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {/* Custom select arrow */}
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(197,164,108,0.4)] text-xs">
                ▾
              </span>
            </div>

            {status === 'error' && (
              <p className="font-mono text-[10px] text-red-400/60 px-1 pt-1">
                {errMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full mt-2 py-4 font-mono text-[10px] tracking-[0.45em] uppercase
                border border-[rgba(197,164,108,0.3)] text-[rgba(197,164,108,0.8)]
                bg-transparent rounded-sm
                hover:bg-[rgba(197,164,108,0.07)] hover:border-[rgba(197,164,108,0.55)]
                disabled:opacity-25 disabled:cursor-not-allowed
                transition-all duration-400"
            >
              {status === 'loading' ? 'Entering...' : 'Enter the Shadow'}
            </button>
          </form>
        )}

        {/* Footer */}
        <p
          className="mt-16 font-mono text-[8px] tracking-[0.55em] text-[rgba(255,255,255,0.12)] uppercase animate-fade-in"
          style={{ opacity: 0, animationDelay: '1.4s' }}
        >
          Nairobi. For the World.
        </p>
      </div>

      {/* ── Bottom Edge ── */}
      <div className="fixed bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(197,164,108,0.08)] to-transparent" />
    </main>
  )
}
