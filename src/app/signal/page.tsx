'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

type SignalContent = {
  id: string
  type: string
  title: string
  description: string | null
  audio_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  episode_number: number | null
  tags: string[] | null
  is_published: boolean | null
  published_at: string | null
}

const CHANNEL_TYPES = [
  { key: 'news',       label: 'SIGNAL NEWS',       sub: 'Aesthetic intelligence. Broadcast twice daily.' },
  { key: 'radio',      label: 'SIGNAL RADIO',       sub: 'The frequency. Always on.' },
  { key: 'documentary',label: 'SIGNAL DOCUMENTARY', sub: 'Long-form visual essays.' },
  { key: 'podcast',    label: 'THE UNSEEN',         sub: 'A conversation about what visual culture refuses to say.' },
]

function formatDuration(s: number | null): string {
  if (!s) return ''
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// Animated waveform bars (pure CSS, no canvas)
function Waveform({ active }: { active: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 24 }}>
      {[0.4, 0.8, 0.6, 1, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4].map((h, i) => (
        <div key={i} style={{
          width: 2, height: `${h * 100}%`,
          background: active ? 'rgba(201,168,76,0.7)' : 'rgba(201,168,76,0.2)',
          borderRadius: 1,
          animation: active ? `wave ${0.8 + i * 0.1}s ease-in-out infinite alternate` : 'none',
          animationDelay: `${i * 0.07}s`,
        }} />
      ))}
      <style>{`@keyframes wave { from { transform: scaleY(0.3) } to { transform: scaleY(1) } }`}</style>
    </div>
  )
}

export default function SignalPage() {
  const router = useRouter()
  const [content, setContent]       = useState<SignalContent[]>([])
  const [activeType, setActiveType] = useState('radio')
  const [playing, setPlaying]       = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)
  const [mounted, setMounted]       = useState(false)
  const [tick, setTick]             = useState(0)   // live clock pulse
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Live clock pulse — updates every second so the "ON AIR" indicator feels live
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!mounted) return
    let alive = true
    async function load() {
      const { data } = await supabase
        .from('signal_content')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
      if (alive) {
        setContent((data ?? []) as SignalContent[])
        setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [mounted])

  function handlePlay(item: SignalContent) {
    if (!item.audio_url) return
    if (playing === item.id) {
      audioRef.current?.pause()
      setPlaying(null)
      return
    }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    const a = new Audio(item.audio_url)
    a.play().catch(() => {})
    a.onended = () => setPlaying(null)
    audioRef.current = a
    setPlaying(item.id)
  }

  const filtered = content.filter(c => c.type === activeType)
  if (!mounted) return null

  return (
    <div style={{ minHeight: '100vh', background: '#030305', color: '#d4d4e0' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(3,3,5,0.97)', WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,168,76,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 60 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontFamily: 'Georgia, serif', fontSize: 17, letterSpacing: '0.18em', color: 'rgba(201,168,76,0.8)', cursor: 'pointer', textTransform: 'uppercase' }}>
          UMBRA
        </button>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <button onClick={() => router.push('/browse')} style={{ background: 'none', border: 'none', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.3em', color: 'rgba(152,152,180,0.6)', cursor: 'pointer', textTransform: 'uppercase' }}>
            The Vault
          </button>
          <button onClick={() => router.push('/collections')} style={{ background: 'none', border: 'none', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.3em', color: 'rgba(152,152,180,0.6)', cursor: 'pointer', textTransform: 'uppercase' }}>
            Collections
          </button>
          <button onClick={() => router.push('/drift')} style={{ background: 'none', border: 'none', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.3em', color: 'rgba(152,152,180,0.6)', cursor: 'pointer', textTransform: 'uppercase' }}>
            Drift
          </button>
        </div>
      </nav>

      {/* Header — broadcast identity */}
      <div style={{ borderBottom: '1px solid rgba(201,168,76,0.06)', padding: '56px 48px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              {/* Live indicator */}
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: content.length > 0 ? '#8b1a1a' : 'rgba(139,26,26,0.3)', boxShadow: content.length > 0 ? '0 0 10px rgba(139,26,26,0.7)' : 'none', animation: content.length > 0 ? 'pulse 2s ease infinite' : 'none' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.4em', color: content.length > 0 ? 'rgba(139,80,80,0.8)' : 'rgba(139,80,80,0.3)', textTransform: 'uppercase' }}>
                {content.length > 0 ? 'On Air' : 'Off Air'}
              </span>
              <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 400, color: '#eeeeF8', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
              SIGNAL
            </h1>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 16, color: 'rgba(152,152,180,0.6)', marginTop: 10, lineHeight: 1.7, maxWidth: 480 }}>
              The broadcast network of UMBRA. Aesthetic intelligence as media.
            </p>
          </div>

          {/* Waveform display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <Waveform active={playing !== null} />
            <span style={{ fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.3em', color: 'rgba(201,168,76,0.3)', textTransform: 'uppercase' }}>
              {playing ? 'Transmitting' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Channel tabs */}
        <div style={{ display: 'flex', gap: 2, marginTop: 40, flexWrap: 'wrap' }}>
          {CHANNEL_TYPES.map(ch => (
            <button
              key={ch.key}
              onClick={() => setActiveType(ch.key)}
              style={{
                background: activeType === ch.key ? 'rgba(201,168,76,0.08)' : 'transparent',
                border: `1px solid ${activeType === ch.key ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.05)'}`,
                color: activeType === ch.key ? 'rgba(201,168,76,0.85)' : 'rgba(152,152,180,0.5)',
                fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase',
                padding: '8px 18px', cursor: 'pointer', transition: 'all 0.25s',
              }}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* Channel description */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 48px 0' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 14, color: 'rgba(120,120,144,0.6)', margin: 0 }}>
          {CHANNEL_TYPES.find(c => c.key === activeType)?.sub}
        </p>
      </div>

      {/* Content area */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 48px 120px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.4em', color: 'rgba(201,168,76,0.3)', textTransform: 'uppercase' }}>
              tuning the frequency
            </span>
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ display: 'grid', gap: 2 }}>
            {filtered.map(item => (
              <SignalItem key={item.id} item={item} isPlaying={playing === item.id} onPlay={() => handlePlay(item)} />
            ))}
          </div>
        ) : (
          <SignalEmpty type={activeType} />
        )}
      </div>
    </div>
  )
}

function SignalItem({ item, isPlaying, onPlay }: { item: SignalContent; isPlaying: boolean; onPlay: () => void }) {
  const canPlay = !!item.audio_url
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 24, alignItems: 'center', padding: '20px 24px', background: isPlaying ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.015)', border: `1px solid ${isPlaying ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)'}`, transition: 'all 0.3s' }}>
      {/* Thumbnail */}
      <div style={{ width: 80, height: 60, background: 'rgba(255,255,255,0.03)', overflow: 'hidden', flexShrink: 0 }}>
        {item.thumbnail_url
          ? <img src={item.thumbnail_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 7, color: 'rgba(201,168,76,0.2)', letterSpacing: '0.2em' }}>UMBRA</span>
            </div>
        }
      </div>

      {/* Info */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          {item.episode_number && (
            <span style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.3em', color: 'rgba(201,168,76,0.4)', textTransform: 'uppercase' }}>
              Ep. {String(item.episode_number).padStart(2, '0')}
            </span>
          )}
          {isPlaying && <Waveform active={true} />}
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#d4d4e0', marginBottom: 6 }}>
          {item.title}
        </div>
        {item.description && (
          <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(120,120,144,0.6)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        {item.duration_seconds && (
          <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(120,120,144,0.5)' }}>
            {formatDuration(item.duration_seconds)}
          </span>
        )}
        {canPlay && (
          <button
            onClick={onPlay}
            style={{
              background: isPlaying ? 'rgba(201,168,76,0.12)' : 'transparent',
              border: `1px solid ${isPlaying ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.2)'}`,
              color: 'rgba(201,168,76,0.7)', fontFamily: 'monospace', fontSize: 8,
              letterSpacing: '0.3em', textTransform: 'uppercase', padding: '6px 14px', cursor: 'pointer',
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        )}
      </div>
    </div>
  )
}

function SignalEmpty({ type }: { type: string }) {
  const messages: Record<string, string> = {
    news:        'The broadcast has not yet begun. The first transmission is being prepared.',
    radio:       'The frequency is being calibrated. The signal will carry when it is ready.',
    documentary: 'The first documentary is in production. Visual essays take time to become what they need to be.',
    podcast:     'The Unseen has not yet spoken. The first episode arrives when the signal is strong enough.',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 0', gap: 28, textAlign: 'center' }}>
      {/* Frequency sigil */}
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 40 }}>
        {[0.3, 0.5, 0.8, 1, 0.8, 0.5, 0.3].map((h, i) => (
          <div key={i} style={{ width: 3, height: `${h * 100}%`, background: 'rgba(201,168,76,0.12)', borderRadius: 1 }} />
        ))}
      </div>
      <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 18, color: 'rgba(152,152,180,0.5)', maxWidth: 440, lineHeight: 1.9 }}>
        {messages[type] ?? 'Nothing here yet.'}
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.4em', color: 'rgba(201,168,76,0.2)', textTransform: 'uppercase' }}>
        Standby
      </span>
    </div>
  )
}
