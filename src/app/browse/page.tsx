'use client'
import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

type Asset = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string
  cloudinary_url: string
  aesthetic_tags: string[]
  mood_tags: string[]
  origin_region: string | null
  tier_required: string
  is_featured: boolean
  is_sovereign_marked: boolean
  download_count: number
}

type UserTier = 'access' | 'noir' | 'prestige' | 'obsidian' | null

const TIER_ORDER: Record<string, number> = { access: 0, noir: 1, prestige: 2, obsidian: 3 }

function canAccess(userTier: UserTier, assetTier: string): boolean {
  if (!userTier) return assetTier === 'access'
  return TIER_ORDER[userTier] >= TIER_ORDER[assetTier]
}

const AESTHETICS = ['Dark Luxury', 'Quiet Architecture', 'Raw Documentary', 'Industrial Pastoral', 'Sacred Geometry', 'Neon Noir', 'Cinematic Decay']

export default function BrowsePage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<UserTier>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || null)
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()
        if (sub) setUserTier(sub.tier as UserTier)
        else setUserTier('access')
      }
    }
    init()
  }, [])

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('assets')
      .select('id,title,description,thumbnail_url,cloudinary_url,aesthetic_tags,mood_tags,origin_region,tier_required,is_featured,is_sovereign_marked,download_count')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (search.trim()) {
      query = query.textSearch('search_vector', search.trim(), { type: 'websearch' })
    }

    if (activeFilter) {
      query = query.contains('aesthetic_tags', [activeFilter])
    }

    const { data, error } = await query.limit(60)
    if (!error && data) setAssets(data)
    setLoading(false)
  }, [search, activeFilter])

  useEffect(() => {
    const t = setTimeout(fetchAssets, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [fetchAssets, search])

  const locked = (asset: Asset) => !canAccess(userTier, asset.tier_required)

  const TIER_COLORS: Record<string, string> = {
    access: '90,90,106',
    noir: '201,168,76',
    prestige: '139,92,246',
    obsidian: '13,148,136',
  }

  return (
    <div style={{ background: '#050507', minHeight: '100vh', color: '#d4d4e0', fontFamily: "'DM Sans',sans-serif", fontWeight: 300 }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Courier+Prime:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,7,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,168,76,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 58, gap: 20 }}>
        <Link href="/" style={{ fontFamily: "'Cinzel',serif", fontSize: 16, fontWeight: 700, color: '#c9a84c', letterSpacing: 4, textDecoration: 'none', flexShrink: 0 }}>UMBRA</Link>

        {/* SEARCH */}
        <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search the vault — mood, location, aesthetic..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(201,168,76,0.1)', color: '#d4d4e0', padding: '9px 16px 9px 38px', fontSize: 12, letterSpacing: 1, outline: 'none', fontFamily: "'DM Sans',sans-serif", fontWeight: 300 }}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#5a5a6a' }}>&#9740;</span>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
          {userEmail
            ? <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: 3, color: '#c9a84c', textTransform: 'uppercase' }}>{userEmail.split('@')[0]}</span>
            : <Link href="/auth/login" style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(212,212,224,0.4)', textDecoration: 'none' }}>Sign In</Link>
          }
          <Link href="/subscribe" style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 3, color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)', padding: '7px 16px', textDecoration: 'none', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {userTier === 'access' || !userTier ? 'Unlock Access' : userTier.toUpperCase()}
          </Link>
        </div>
      </nav>

      {/* FILTER BAR */}
      <div style={{ borderBottom: '1px solid rgba(201,168,76,0.05)', padding: '0 32px', display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button
          onClick={() => setActiveFilter(null)}
          style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', padding: '13px 16px', background: 'none', border: 'none', borderBottom: !activeFilter ? '1px solid #c9a84c' : '1px solid transparent', color: !activeFilter ? '#c9a84c' : '#5a5a6a', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
        >All</button>
        {AESTHETICS.map(a => (
          <button key={a}
            onClick={() => setActiveFilter(activeFilter === a ? null : a)}
            style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', padding: '13px 16px', background: 'none', border: 'none', borderBottom: activeFilter === a ? '1px solid #c9a84c' : '1px solid transparent', color: activeFilter === a ? '#c9a84c' : '#5a5a6a', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >{a}</button>
        ))}
      </div>

      {/* VAULT HEADER */}
      <div style={{ padding: '32px 32px 20px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 7, color: '#8a6f33', textTransform: 'uppercase', marginBottom: 6 }}>
            {activeFilter || 'The Vault'}
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: 'italic', color: '#5a5a6a' }}>
            {loading ? 'Unlocking chambers...' : `${assets.length} piece${assets.length !== 1 ? 's' : ''} visible`}
          </p>
        </div>
        {(!userTier || userTier === 'access') && (
          <Link href="/subscribe" style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: 'rgba(201,168,76,0.5)', textDecoration: 'none', textTransform: 'uppercase', borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 2 }}>
            Unlock more pieces &rarr;
          </Link>
        )}
      </div>

      {/* MASONRY GRID */}
      <div style={{ padding: '0 32px 80px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 3 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ height: [280, 200, 340, 220][i % 4], background: 'rgba(255,255,255,0.02)', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '120px 0' }}>
            <p style={{ fontFamily: "'Cinzel',serif", fontSize: 13, letterSpacing: 5, color: '#3a3a4a', textTransform: 'uppercase' }}>No pieces found</p>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: 'italic', color: '#3a3a4a', marginTop: 8 }}>Try a different search or filter</p>
          </div>
        ) : (
          <div style={{ columns: '4 240px', columnGap: 3 }}>
            {assets.map((asset) => {
              const isLocked = locked(asset)
              const tierRgb = TIER_COLORS[asset.tier_required] || '90,90,106'
              const isHovered = hoveredId === asset.id
              return (
                <div
                  key={asset.id}
                  style={{ breakInside: 'avoid', marginBottom: 3, position: 'relative', overflow: 'hidden', cursor: 'pointer', display: 'block' }}
                  onMouseEnter={() => setHoveredId(asset.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <Link href={`/asset/${asset.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                    {/* IMAGE */}
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={asset.thumbnail_url}
                        alt={asset.title}
                        style={{ width: '100%', display: 'block', filter: isLocked ? 'blur(12px) brightness(0.4)' : isHovered ? 'brightness(0.85)' : 'brightness(0.7)', transition: 'all 0.4s ease', transform: isHovered && !isLocked ? 'scale(1.03)' : 'scale(1)' }}
                        loading="lazy"
                      />

                      {/* HOVER OVERLAY */}
                      <div style={{ position: 'absolute', inset: 0, background: isHovered ? 'rgba(5,5,7,0.3)' : 'rgba(5,5,7,0)', transition: 'background 0.3s', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 16 }}>

                        {/* LOCKED STATE */}
                        {isLocked && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: `rgba(${tierRgb},0.7)`, border: `1px solid rgba(${tierRgb},0.3)`, padding: '6px 14px', textTransform: 'uppercase' }}>
                              {asset.tier_required.toUpperCase()} +
                            </div>
                            <Link href="/subscribe" style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: 3, color: 'rgba(212,212,224,0.4)', textDecoration: 'none', textTransform: 'uppercase' }} onClick={e => e.stopPropagation()}>
                              Unlock Access
                            </Link>
                          </div>
                        )}

                        {/* HOVER INFO */}
                        {!isLocked && isHovered && (
                          <div style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s' }}>
                            <p style={{ fontFamily: "'Cinzel',serif", fontSize: 12, color: '#d4d4e0', letterSpacing: 1, marginBottom: 4, lineHeight: 1.3 }}>{asset.title}</p>
                            {asset.origin_region && (
                              <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 3, color: `rgba(${tierRgb},0.7)`, textTransform: 'uppercase' }}>{asset.origin_region}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* SOVEREIGN MARK */}
                      {asset.is_sovereign_marked && (
                        <div style={{ position: 'absolute', top: 10, left: 10, fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: 2, color: '#c9a84c', background: 'rgba(5,5,7,0.8)', border: '1px solid rgba(201,168,76,0.4)', padding: '2px 8px', textTransform: 'uppercase' }}>
                          Marked
                        </div>
                      )}

                      {/* TIER BADGE */}
                      {asset.tier_required !== 'access' && (
                        <div style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 2, color: `rgba(${tierRgb},0.8)`, border: `1px solid rgba(${tierRgb},0.25)`, padding: '2px 8px', textTransform: 'uppercase', background: 'rgba(5,5,7,0.7)' }}>
                          {asset.tier_required}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FOOTER CTA */}
      {assets.length > 0 && (!userTier || userTier === 'access') && (
        <div style={{ borderTop: '1px solid rgba(201,168,76,0.07)', padding: '56px 32px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontStyle: 'italic', color: 'rgba(212,212,224,0.4)', marginBottom: 24 }}>
            You are seeing the surface. The vault goes deeper.
          </p>
          <Link href="/subscribe" style={{ fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 5, color: '#c9a84c', border: '1px solid rgba(201,168,76,0.35)', padding: '14px 36px', textDecoration: 'none', textTransform: 'uppercase' }}>
            Choose Your Chamber
          </Link>
        </div>
      )}
    </div>
  )
}
