'use client'

import { useState, useEffect, useRef } from 'react'

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
  const [form, setForm]     = useState({ name: '', email: '', aesthetic_affinity: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [position, setPos]  = useState<number | null>(null)
  const [errMsg, setErr]    = useState('')
  const [ready, setReady]   = useState(false)
  const [mousePos, setMouse] = useState({ x: 0.5, y: 0.5 })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setReady(true)

    // Mouse parallax
    const handleMouse = (e: MouseEvent) => {
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }
    window.addEventListener('mousemove', handleMouse)

    // Particle canvas
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; gold: boolean
    }> = []

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        gold: Math.random() > 0.7,
      })
    }

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.gold
          ? `rgba(197,164,108,${p.opacity})`
          : `rgba(220,210,200,${p.opacity * 0.4})`
        ctx.fill()
      })
      animId = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', handleMouse)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animId)
    }
  }, [])

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

  // Parallax offset
  const ox = (mousePos.x - 0.5) * 40
  const oy = (mousePos.y - 0.5) * 40

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center bg-[#060606]">

      {/* ── Particle Canvas ── */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* ── Deep Gradient Mesh ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Primary gold halo — top left */}
        <div
          className="absolute rounded-full"
          style={{
            width: 900, height: 900,
            top: -300, left: -250,
            background: 'radial-gradient(circle, rgba(197,164,108,0.13) 0%, rgba(197,164,108,0.04) 35%, transparent 65%)',
            transform: ready ? `translate(${ox * 0.6}px, ${oy * 0.6}px)` : 'none',
            transition: 'transform 1.2s cubic-bezier(0.25,0.1,0.25,1)',
          }}
        />
        {/* Secondary halo — bottom right */}
        <div
          className="absolute rounded-full"
          style={{
            width: 800, height: 800,
            bottom: -250, right: -200,
            background: 'radial-gradient(circle, rgba(197,164,108,0.10) 0%, rgba(150,120,80,0.05) 40%, transparent 65%)',
            transform: ready ? `translate(${-ox * 0.4}px, ${-oy * 0.4}px)` : 'none',
            transition: 'transform 1.8s cubic-bezier(0.25,0.1,0.25,1)',
          }}
        />
        {/* Centre glow — behind content */}
        <div
          className="absolute rounded-full"
          style={{
            width: 600, height: 400,
            top: '50%', left: '50%',
            transform: `translate(-50%, -50%)`,
            background: 'radial-gradient(ellipse, rgba(197,164,108,0.055) 0%, transparent 60%)',
          }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)',
          }}
        />
      </div>

      {/* ── Grain Overlay ── */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '180px',
        }}
      />

      {/* ── Decorative Grid Lines ── */}
      {ready && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.04]">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute top-0 bottom-0 border-r border-[#c5a46c]"
              style={{ left: `${(i + 1) * 12.5}%` }} />
          ))}
        </div>
      )}

      {/* ── Top + Bottom Edges ── */}
      <div className="fixed top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(197,164,108,0.35)] to-transparent z-10" />
      <div className="fixed bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(197,164,108,0.15)] to-transparent z-10" />

      {/* ── Corner Accents ── */}
      {ready && (
        <>
          <div className="fixed top-6 left-6 w-8 h-8 border-t border-l border-[rgba(197,164,108,0.3)] z-10" />
          <div className="fixed top-6 right-6 w-8 h-8 border-t border-r border-[rgba(197,164,108,0.3)] z-10" />
          <div className="fixed bottom-6 left-6 w-8 h-8 border-b border-l border-[rgba(197,164,108,0.3)] z-10" />
          <div className="fixed bottom-6 right-6 w-8 h-8 border-b border-r border-[rgba(197,164,108,0.3)] z-10" />
        </>
      )}

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-[420px] px-5 text-center">

        {/* Eyebrow */}
        <p className="umbra-eyebrow animate-fade-in" style={{ opacity: 0, animationDelay: '0.2s' }}>
          The World Is Watching
        </p>

        {/* Wordmark */}
        <div className="relative my-6">
          {/* Glow behind wordmark */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(197,164,108,0.12) 0%, transparent 65%)',
              filter: 'blur(20px)',
            }}
          />
          <h1
            className="relative font-display font-light tracking-umbra text-[clamp(52px,14vw,96px)] text-[#ece8e0] leading-none animate-fade-in"
            style={{ opacity: 0, animationDelay: '0.4s', textShadow: '0 0 80px rgba(197,164,108,0.2)' }}
          >
            UMBRA
          </h1>
        </div>

        {/* Hairline */}
        <div
          className="w-16 mx-auto mb-5 animate-line-grow"
          style={{
            opacity: 0,
            animationDelay: '0.65s',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(197,164,108,0.6), transparent)',
            transformOrigin: 'center',
          }}
        />

        {/* Taglines */}
        <p className="font-body text-[0.78rem] tracking-wide text-[rgba(255,255,255,0.32)] leading-loose mb-1 animate-fade-in"
          style={{ opacity: 0, animationDelay: '0.75s' }}>
          The world&apos;s most complete aesthetic visual content ecosystem.
        </p>
        <p className="font-display italic text-[rgba(197,164,108,0.8)] text-[1.1rem] mb-10 animate-fade-in"
          style={{ opacity: 0, animationDelay: '0.9s' }}>
          Dark. Luminous. Global.
        </p>

        {/* ── FORM or SUCCESS ── */}
        {status === 'success' ? (
          <div className="animate-fade-up umbra-card text-left" style={{ opacity: 0 }}>
            <p className="umbra-eyebrow mb-4">You&apos;re In</p>
            <p className="font-display text-[1.8rem] font-light text-[#ece8e0] mb-3 leading-snug">
              Welcome to the Shadow.
            </p>
            {position !== null && (
              <p className="font-mono text-[11px] text-[rgba(255,255,255,0.3)]">
                Position{' '}
                <span className="text-[#c5a46c] font-medium">
                  #{String(position).padStart(4, '0')}
                </span>{' '}
                in the queue.
              </p>
            )}
            <div className="mt-7 pt-5 border-t border-[rgba(197,164,108,0.1)]">
              <p className="font-body text-[11px] text-[rgba(255,255,255,0.18)] leading-relaxed">
                You will be summoned when the gates open.<br />The shadow sees you.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="animate-fade-up space-y-3 text-left"
            style={{ opacity: 0, animationDelay: '1.1s' }}
          >
            {/* Form container with glass effect */}
            <div className="umbra-card space-y-3">
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
                  className="umbra-input cursor-pointer"
                  required
                >
                  <option value="" disabled>Your aesthetic affinity —</option>
                  {AFFINITIES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(197,164,108,0.5)] text-[10px]">
                  ▾
                </span>
              </div>

              {status === 'error' && (
                <p className="font-mono text-[10px] text-red-400/50 px-1">{errMsg}</p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="umbra-btn"
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#c5a46c] animate-pulse" />
                    <span className="w-1 h-1 rounded-full bg-[#c5a46c] animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1 h-1 rounded-full bg-[#c5a46c] animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </span>
                ) : 'Enter the Shadow'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <p
          className="mt-12 font-mono text-[8px] tracking-[0.6em] text-[rgba(255,255,255,0.1)] uppercase animate-fade-in"
          style={{ opacity: 0, animationDelay: '1.6s' }}
        >
          Nairobi &nbsp;&bull;&nbsp; For the World
        </p>
      </div>
    </main>
  )
}
