'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const TIER_ORDER: Record<string, number> = { SHADOW: 0, NOIR: 1, PRESTIGE: 2, OBSIDIAN: 3 }
const DRIFT_INTERVAL = 6000   // ms between transitions
const FADE_DURATION  = 1800   // ms for cross-fade

type DriftAsset = {
  id: string
  title: string | null
  cloudinary_url: string
  aesthetic_tags: string[] | null
  tier_required: string | null
}

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[]
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
  }
  return []
}

export default function DriftPage() {
  const router  = useRouter()
  const [assets, setAssets]     = useState<DriftAsset[]>([])
  const [idx, setIdx]           = useState(0)
  const [nextIdx, setNextIdx]   = useState(1)
  const [fading, setFading]     = useState(false)
  const [showUI, setShowUI]     = useState(true)
  const [loaded, setLoaded]     = useState(false)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const alive     = useRef(true)

  // ── Load accessible assets ───────────────────────────────────────────────
  useEffect(() => {
    alive.current = true
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id ?? null

      let userTier = 0
      if (userId) {
        const { data: p } = await supabase
          .from('profiles')
          .select('tier, is_sovereign')
          .eq('id', userId)
          .single()
        if (p?.is_sovereign) userTier = 999
        else userTier = TIER_ORDER[(p?.tier ?? 'SHADOW').toUpperCase()] ?? 0
      }

      const { data } = await supabase
        .from('assets')
        .select('id, title, cloudinary_url, aesthetic_tags, tier_required')
        .order('created_at', { ascending: false })

      if (!alive.current || !data) return

      // Filter by tier access
      const accessible = data.filter(a => {
        const req = TIER_ORDER[(a.tier_required ?? 'SHADOW').toUpperCase()] ?? 0
        return userTier >= req || userTier === 999
      })

      // Shuffle
      const shuffled = [...accessible].sort(() => Math.random() - 0.5)
      if (alive.current && shuffled.length > 0) {
        setAssets(shuffled)
        setLoaded(true)
      }
    }
    load()
    return () => { alive.current = false }
  }, [])

  // ── Auto-advance ─────────────────────────────────────────────────────────
  const advance = useCallback(() => {
    if (!alive.current || assets.length < 2) return
    setFading(true)
    setTimeout(() => {
      if (!alive.current) return
      setIdx(prev => {
        const ni = (prev + 1) % assets.length
        setNextIdx((ni + 1) % assets.length)
        return ni
      })
      setFading(false)
    }, FADE_DURATION)
  }, [assets.length])

  useEffect(() => {
    if (!loaded || assets.length < 2) return
    timerRef.current = setInterval(advance, DRIFT_INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [loaded, assets.length, advance])

  // ── UI auto-hide after 3s of no movement ─────────────────────────────────
  const resetUiTimer = useCallback(() => {
    setShowUI(true)
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current)
    uiTimerRef.current = setTimeout(() => setShowUI(false), 3000)
  }, [])

  useEffect(() => {
    resetUiTimer()
    return () => { if (uiTimerRef.current) clearTimeout(uiTimerRef.current) }
  }, [resetUiTimer])

  const handleKey = useCallback((e: KeyboardEvent) => {
    resetUiTimer()
    if (e.key === 'Escape' || e.key === 'q') router.back()
    if (e.key === 'ArrowRight' || e.key === ' ') advance()
  }, [router, advance, resetUiTimer])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    window.addEventListener('mousemove', resetUiTimer)
    window.addEventListener('touchstart', resetUiTimer)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('mousemove', resetUiTimer)
      window.removeEventListener('touchstart', resetUiTimer)
    }
  }, [handleKey, resetUiTimer])

  const cur  = assets[idx]
  const next = assets[nextIdx]

  // ── Render ────────────────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#030305', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.4em', color: 'rgba(201,168,76,0.4)', textTransform: 'uppercase' }}>
          calibrating the drift
        </span>
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#030305', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.4em', color: 'rgba(201,168,76,0.3)', textTransform: 'uppercase' }}>
          the vault is empty
        </span>
        <button onClick={() => router.back()} style={{ background: 'none', border: '1px solid rgba(201,168,76,0.25)', color: 'rgba(201,168,76,0.6)', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', padding: '8px 20px', cursor: 'pointer' }}>
          return
        </button>
      </div>
    )
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#030305', overflow: 'hidden', cursor: showUI ? 'default' : 'none' }}
      onClick={resetUiTimer}
    >
      {/* Current asset */}
      {cur && (
        <img
          key={cur.id}
          src={cur.cloudinary_url}
          alt={cur.title ?? ''}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: fading ? 0 : 1,
            transition: `opacity ${FADE_DURATION}ms ease`,
            zIndex: 1,
          }}
        />
      )}

      {/* Preload next — invisible */}
      {next && (
        <img
          key={next.id + '-pre'}
          src={next.cloudinary_url}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0, zIndex: 0 }}
        />
      )}

      {/* Vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(3,3,5,0.55) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Asset info — bottom left */}
      {showUI && cur && (
        <div style={{
          position: 'absolute', bottom: 48, left: 48, zIndex: 10,
          opacity: showUI ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}>
          {cur.title && (
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: 'rgba(238,238,248,0.9)', letterSpacing: '0.05em', marginBottom: 10 }}>
              {cur.title}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {parseTags(cur.aesthetic_tags).slice(0, 3).map(tag => (
              <span key={tag} style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', border: '1px solid rgba(201,168,76,0.2)', padding: '3px 8px' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {showUI && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, height: 2, background: 'rgba(255,255,255,0.04)' }}>
          <div style={{
            height: '100%',
            background: 'rgba(201,168,76,0.5)',
            width: fading ? '100%' : '0%',
            transition: fading ? `width ${FADE_DURATION}ms ease` : 'none',
          }} />
        </div>
      )}

      {/* Top controls — UMBRA mark + exit */}
      {showUI && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '24px 32px',
          background: 'linear-gradient(to bottom, rgba(3,3,5,0.6) 0%, transparent 100%)',
        }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 16, letterSpacing: '0.18em', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase' }}>
            UMBRA
          </span>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.3em', color: 'rgba(152,152,180,0.5)', textTransform: 'uppercase' }}>
              {idx + 1} / {assets.length}
            </span>
            <button
              onClick={() => router.back()}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(238,238,248,0.5)', fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', padding: '6px 14px', cursor: 'pointer' }}
            >
              exit drift
            </button>
          </div>
        </div>
      )}

      {/* Keyboard hint — fades out */}
      {showUI && (
        <div style={{ position: 'absolute', bottom: 48, right: 48, zIndex: 10 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.25em', color: 'rgba(120,120,144,0.35)', textTransform: 'uppercase' }}>
            esc to exit · → to skip
          </span>
        </div>
      )}
    </div>
  )
}
