'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type Asset = {
  id: string
  title: string
  description: string | null
  cloudinary_url: string
  thumbnail_url: string
  aesthetic_tags: string[]
  mood_tags: string[]
  color_palette: string[]
  origin_region: string | null
  era: string | null
  asset_type: string
  tier_required: string
  license: string
  download_count: number
  view_count: number
  is_featured: boolean
  is_sovereign_marked: boolean
  sovereign_note: string | null
  vintage_score: number
  created_at: string
}

type UserTier = 'access' | 'noir' | 'prestige' | 'obsidian' | null

const TIER_ORDER: Record<string, number> = { access: 0, noir: 1, prestige: 2, obsidian: 3 }
const TIER_COLORS: Record<string, string> = {
  access: '90,90,106', noir: '201,168,76', prestige: '139,92,246', obsidian: '13,148,136'
}

export default function AssetPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [asset, setAsset] = useState<Asset | null>(null)
  const [related, setRelated] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [userTier, setUserTier] = useState<UserTier>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: sub } = await supabase
          .from('subscriptions').select('tier')
          .eq('user_id', user.id).eq('status', 'active').single()
        if (sub) setUserTier(sub.tier as UserTier)
        else setUserTier('access')
      }
      const { data } = await supabase.from('assets').select('*').eq('id', id).eq('status', 'active').single()
      if (!data) { router.push('/browse'); return }
      setAsset(data)
      // View count bump (fire and forget)
      supabase.from('assets').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id)
      // Related assets
      if (data.aesthetic_tags?.length) {
        const { data: rel } = await supabase.from('assets')
          .select('id,title,thumbnail_url,aesthetic_tags,tier_required,origin_region')
          .eq('status', 'active')
          .contains('aesthetic_tags', [data.aesthetic_tags[0]])
          .neq('id', id)
          .limit(6)
        if (rel) setRelated(rel as Asset[])
      }
      setLoading(false)
    }
    if (id) init()
  }, [id])

  function canAccess(assetTier: string): boolean {
    if (!userTier) return assetTier === 'access'
    return TIER_ORDER[userTier] >= TIER_ORDER[assetTier]
  }

  async function handleDownload() {
    if (!asset) return
    if (!userId) { router.push('/auth/login?redirect=/asset/' + id); return }
    if (!canAccess(asset.tier_required)) { router.push('/subscribe'); return }
    setDownloading(true)
    try {
      const response = await fetch(asset.cloudinary_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `umbra_${asset.title.toLowerCase().replace(/\s+/g, '_')}.${asset.asset_type === 'video' ? 'mp4' : 'jpg'}`
      a.click()
      URL.revokeObjectURL(url)
      supabase.from('assets').update({ download_count: (asset.download_count || 0) + 1 }).eq('id', id)
      setDownloaded(true)
    } catch {
      alert('Download failed. Try again.')
    }
    setDownloading(false)
  }

  if (loading) return (
    <div style={{ background: '#050507', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 8, color: '#8a6f33', textTransform: 'uppercase', animation: 'pulse 1.5s ease infinite' }}>Opening chamber...</p>
    </div>
  )

  if (!asset) return null

  const isLocked = !canAccess(asset.tier_required)
  const tierRgb = TIER_COLORS[asset.tier_required] || '90,90,106'

  return (
    <div style={{ background: '#050507', minHeight: '100vh', color: '#d4d4e0', fontFamily: "'DM Sans',sans-serif", fontWeight: 300 }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Courier+Prime:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,7,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,168,76,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 58 }}>
        <Link href="/" style={{ fontFamily: "'Cinzel',serif", fontSize: 16, fontWeight: 700, color: '#c9a84c', letterSpacing: 4, textDecoration: 'none' }}>UMBRA</Link>
        <Link href="/browse" style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(212,212,224,0.4)', textDecoration: 'none' }}>&larr; The Vault</Link>
      </nav>

      {/* MAIN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', minHeight: 'calc(100vh - 58px)', gap: 0 }}>

        {/* LEFT — ASSET DISPLAY */}
        <div style={{ position: 'relative', background: '#030305', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', overflow: 'hidden', cursor: isLocked ? 'default' : 'zoom-in' }} onClick={() => !isLocked && setFullscreen(true)}>
          <img
            src={isLocked ? asset.thumbnail_url : (asset.cloudinary_url || asset.thumbnail_url)}
            alt={asset.title}
            style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', filter: isLocked ? 'blur(20px) brightness(0.3)' : 'none', transition: 'filter 0.4s' }}
          />

          {isLocked && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: 6, color: `rgba(${tierRgb},0.8)`, textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 }}>
                Requires {asset.tier_required.toUpperCase()} access
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontStyle: 'italic', color: 'rgba(212,212,224,0.4)', textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
                This piece lives in a deeper chamber of the vault.
              </p>
              <Link href="/subscribe" style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 4, color: `rgb(${tierRgb})`, border: `1px solid rgba(${tierRgb},0.4)`, padding: '12px 28px', textDecoration: 'none', textTransform: 'uppercase', marginTop: 8 }}>
                Unlock {asset.tier_required.toUpperCase()}
              </Link>
            </div>
          )}

          {!isLocked && (
            <div style={{ position: 'absolute', bottom: 16, right: 16, fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 3, color: 'rgba(201,168,76,0.3)', textTransform: 'uppercase' }}>
              Click to expand
            </div>
          )}
        </div>

        {/* RIGHT — METADATA PANEL */}
        <div style={{ borderLeft: '1px solid rgba(201,168,76,0.07)', padding: '48px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* TIER BADGE */}
          <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: `rgba(${tierRgb},0.8)`, border: `1px solid rgba(${tierRgb},0.25)`, padding: '4px 12px', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
            {asset.tier_required === 'access' ? 'Open Vault' : asset.tier_required.toUpperCase() + ' + tier'}
          </div>

          {/* TITLE */}
          <div>
            <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 700, color: '#d4d4e0', lineHeight: 1.2, marginBottom: 12 }}>
              {asset.title}
            </h1>
            {asset.description && (
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontStyle: 'italic', color: '#7a7a8a', lineHeight: 1.7 }}>
                {asset.description}
              </p>
            )}
          </div>

          {/* DIVIDER */}
          <div style={{ height: 1, background: 'linear-gradient(90deg,rgba(201,168,76,0.15),transparent)' }} />

          {/* METADATA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {asset.origin_region && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#5a5a6a', textTransform: 'uppercase' }}>Region</span>
                <span style={{ fontSize: 12, color: '#9a9aaa' }}>{asset.origin_region}</span>
              </div>
            )}
            {asset.era && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#5a5a6a', textTransform: 'uppercase' }}>Era</span>
                <span style={{ fontSize: 12, color: '#9a9aaa' }}>{asset.era}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#5a5a6a', textTransform: 'uppercase' }}>License</span>
              <span style={{ fontSize: 12, color: asset.license === 'cc0' ? 'rgba(13,148,136,0.8)' : '#9a9aaa', textTransform: 'uppercase', letterSpacing: 1 }}>{asset.license}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#5a5a6a', textTransform: 'uppercase' }}>Downloads</span>
              <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 11, color: '#7a7a8a' }}>{asset.download_count || 0}</span>
            </div>
          </div>

          {/* AESTHETIC TAGS */}
          {asset.aesthetic_tags?.length > 0 && (
            <div>
              <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#5a5a6a', textTransform: 'uppercase', marginBottom: 10 }}>Aesthetic</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {asset.aesthetic_tags.map((tag, i) => (
                  <Link key={i} href={`/browse?filter=${encodeURIComponent(tag)}`}
                    style={{ fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 2, color: 'rgba(201,168,76,0.6)', border: '1px solid rgba(201,168,76,0.15)', padding: '3px 10px', textDecoration: 'none', textTransform: 'uppercase' }}>
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* MOOD TAGS */}
          {asset.mood_tags?.length > 0 && (
            <div>
              <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#5a5a6a', textTransform: 'uppercase', marginBottom: 10 }}>Mood</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {asset.mood_tags.map((tag, i) => (
                  <span key={i} style={{ fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 2, color: '#5a5a6a', border: '1px solid rgba(255,255,255,0.05)', padding: '3px 10px', textTransform: 'uppercase' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SOVEREIGN NOTE */}
          {asset.is_sovereign_marked && asset.sovereign_note && (
            <div style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)', padding: '16px 18px' }}>
              <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase', marginBottom: 8 }}>Sovereign Mark</p>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: 'italic', color: 'rgba(212,212,224,0.6)', lineHeight: 1.65 }}>{asset.sovereign_note}</p>
            </div>
          )}

          {/* DIVIDER */}
          <div style={{ height: 1, background: 'linear-gradient(90deg,rgba(201,168,76,0.1),transparent)' }} />

          {/* DOWNLOAD BUTTON */}
          {isLocked ? (
            <Link href="/subscribe" style={{ display: 'block', textAlign: 'center', fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 4, color: `rgb(${tierRgb})`, border: `1px solid rgba(${tierRgb},0.4)`, padding: '16px 24px', textDecoration: 'none', textTransform: 'uppercase' }}>
              Unlock {asset.tier_required.toUpperCase()} to Download
            </Link>
          ) : (
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{ width: '100%', padding: '16px 24px', background: downloaded ? 'rgba(13,148,136,0.1)' : 'rgba(201,168,76,0.08)', border: `1px solid ${downloaded ? 'rgba(13,148,136,0.4)' : 'rgba(201,168,76,0.35)'}`, color: downloaded ? 'rgb(13,148,136)' : '#c9a84c', fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', cursor: downloading ? 'wait' : 'pointer', transition: 'all 0.3s' }}
            >
              {downloading ? 'Preparing...' : downloaded ? 'Downloaded' : 'Download Asset'}
            </button>
          )}

          <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, color: '#3a3a4a', textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase' }}>
            {asset.license === 'cc0' ? 'CC0 — No attribution required' : `License: ${asset.license}`}
          </p>
        </div>
      </div>

      {/* RELATED ASSETS */}
      {related.length > 0 && (
        <section style={{ padding: '60px 32px 80px', borderTop: '1px solid rgba(201,168,76,0.07)' }}>
          <p style={{ fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 7, color: '#8a6f33', textTransform: 'uppercase', marginBottom: 32 }}>
            From the same aesthetic family
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 3 }}>
            {related.map(r => (
              <Link key={r.id} href={`/asset/${r.id}`} style={{ display: 'block', textDecoration: 'none', position: 'relative', overflow: 'hidden' }}>
                <img src={r.thumbnail_url} alt={r.title} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block', filter: 'brightness(0.65)', transition: 'filter 0.3s' }}
                  onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.85)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(0.65)')}
                />
                <div style={{ position: 'absolute', bottom: 8, left: 10 }}>
                  <p style={{ fontFamily: "'Cinzel',serif", fontSize: 10, color: 'rgba(212,212,224,0.7)', letterSpacing: 1 }}>{r.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FULLSCREEN MODAL */}
      {fullscreen && asset && (
        <div
          onClick={() => setFullscreen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(3,3,5,0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <img src={asset.cloudinary_url || asset.thumbnail_url} alt={asset.title} style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }} />
          <div style={{ position: 'absolute', top: 20, right: 28, fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#5a5a6a', textTransform: 'uppercase' }}>
            Click anywhere to close
          </div>
        </div>
      )}
    </div>
  )
}
