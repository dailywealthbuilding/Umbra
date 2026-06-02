'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Asset = {
  id: string
  title: string | null
  thumbnail_url: string | null
  asset_type: string | null
  content_tier: string
  aesthetic_tags: string[] | null
  is_drop: boolean | null
  is_featured: boolean | null
}

const RANK: Record<string, number> = { access: 0, noir: 1, prestige: 2, obsidian: 3 }
const LABEL: Record<string, string> = { access: 'FREE', noir: 'NOIR', prestige: 'PRESTIGE', obsidian: 'OBSIDIAN' }
const COLOR: Record<string, string> = {
  access: 'rgba(180,180,205,.5)',
  noir: 'rgba(201,168,76,.85)',
  prestige: 'rgba(160,120,220,.85)',
  obsidian: 'rgba(40,200,180,.85)',
}

const canAccess = (ut: string, ct: string) => (RANK[ut] ?? 0) >= (RANK[ct] ?? 0)

export default function BrowsePage() {
  const [assets, setAssets]   = useState<Asset[]>([])
  const [userTier, setTier]   = useState('access')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }
      const [{ data: prof }, { data: rows }] = await Promise.all([
        sb.from('profiles').select('tier').eq('id', user.id).single(),
        sb.from('assets')
          .select('id,title,thumbnail_url,asset_type,content_tier,aesthetic_tags,is_drop,is_featured')
          .eq('status', 'published').order('created_at', { ascending: false }).limit(80),
      ])
      setTier(prof?.tier ?? 'access')
      setAssets(rows ?? [])
      setLoading(false)
    }
    init()
  }, [router])

  async function leave() {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'rgba(220,215,200,.9)', fontFamily: "'Courier Prime', monospace" }}>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', background: 'rgba(5,5,5,.96)', borderBottom: '1px solid rgba(201,168,76,.07)', display: 'flex', alignItems: 'center', padding: '0 28px', zIndex: 100, backdropFilter: 'blur(12px)', gap: '20px' }}>
        <Link href="/" style={{ fontFamily: "'Cinzel', serif", fontSize: '14px', letterSpacing: '6px', color: 'rgba(201,168,76,.9)', textDecoration: 'none' }}>UMBRA</Link>
        <span style={{ fontSize: '9px', letterSpacing: '4px', color: 'rgba(180,180,205,.2)', flex: 1 }}>SHADOW GALLERY</span>
        <span style={{ fontSize: '9px', letterSpacing: '3px', color: COLOR[userTier], border: `1px solid ${COLOR[userTier]}`, padding: '3px 9px' }}>{LABEL[userTier] ?? userTier.toUpperCase()}</span>
        {userTier === 'access' && (
          <Link href="/subscribe" style={{ fontSize: '9px', letterSpacing: '3px', color: 'rgba(201,168,76,.8)', border: '1px solid rgba(201,168,76,.3)', padding: '5px 14px', textDecoration: 'none' }}>UPGRADE</Link>
        )}
        <button onClick={leave} style={{ background: 'none', border: 'none', color: 'rgba(180,180,205,.25)', fontSize: '9px', letterSpacing: '2px', cursor: 'pointer', fontFamily: "'Courier Prime', monospace" }}>LEAVE</button>
      </nav>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '88px 24px 80px' }}>
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '6px', color: 'rgba(201,168,76,.4)', fontWeight: 400, margin: '0 0 6px' }}>SHADOW GALLERY</h1>
          <p style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(180,180,205,.2)', margin: 0 }}>
            {loading ? 'LOADING...' : `${assets.length} ASSET${assets.length !== 1 ? 'S' : ''}`}
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '10px', letterSpacing: '4px', color: 'rgba(180,180,205,.2)' }}>
            LOADING THE SHADOW...
          </div>
        )}

        {!loading && assets.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 40px', border: '1px solid rgba(201,168,76,.06)' }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: '12px', letterSpacing: '6px', color: 'rgba(201,168,76,.35)', marginBottom: '16px' }}>THE GALLERY AWAKENS SOON</p>
            <p style={{ fontSize: '10px', letterSpacing: '2px', color: 'rgba(180,180,205,.2)', lineHeight: 2.4 }}>
              Assets are being curated.<br />
              The shadow library opens at launch.
            </p>
          </div>
        )}

        {!loading && assets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {assets.map(asset => {
              const ok   = canAccess(userTier, asset.content_tier ?? 'access')
              const tier = asset.content_tier ?? 'access'
              return (
                <div key={asset.id}
                  onClick={() => ok && router.push(`/asset/${asset.id}`)}
                  style={{ border: '1px solid rgba(201,168,76,.06)', background: '#080808', overflow: 'hidden', cursor: ok ? 'pointer' : 'default', transition: 'border-color .3s' }}
                >
                  <div style={{ position: 'relative', aspectRatio: asset.asset_type === 'video' ? '16/9' : '3/4', overflow: 'hidden', background: '#0a0a12' }}>
                    {asset.thumbnail_url
                      ? <img src={asset.thumbnail_url} alt={asset.title ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: ok ? 'none' : 'blur(18px) brightness(.25)', transition: 'filter .4s' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '9px', letterSpacing: '3px', color: 'rgba(201,168,76,.2)' }}>{(asset.asset_type ?? 'ASSET').toUpperCase()}</span></div>
                    }
                    {!ok && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '9px', letterSpacing: '4px', color: COLOR[tier] }}>{LABEL[tier]}</span>
                        <Link href="/subscribe" onClick={e => e.stopPropagation()} style={{ fontSize: '9px', letterSpacing: '3px', color: 'rgba(201,168,76,.8)', border: '1px solid rgba(201,168,76,.3)', padding: '6px 14px', textDecoration: 'none' }}>UNLOCK</Link>
                      </div>
                    )}
                    {asset.asset_type === 'video' && <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '8px', letterSpacing: '2px', color: 'rgba(201,168,76,.6)', background: 'rgba(0,0,0,.6)', padding: '3px 7px' }}>VIDEO</span>}
                    {asset.is_drop && <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '8px', letterSpacing: '2px', color: 'rgba(220,80,80,.9)', background: 'rgba(0,0,0,.7)', padding: '3px 7px' }}>DROP</span>}
                    {asset.is_featured && !asset.is_drop && <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '8px', letterSpacing: '2px', color: 'rgba(201,168,76,.7)', background: 'rgba(0,0,0,.7)', padding: '3px 7px' }}>FEATURED</span>}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <p style={{ fontSize: '11px', letterSpacing: '1px', color: ok ? 'rgba(220,215,200,.8)' : 'rgba(180,180,205,.2)', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.title ?? 'UNTITLED'}</p>
                    <p style={{ fontSize: '9px', letterSpacing: '2px', color: 'rgba(180,180,205,.25)', margin: 0 }}>{asset.aesthetic_tags?.[0] ?? ''}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
