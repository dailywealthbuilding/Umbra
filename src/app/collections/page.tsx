'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

type Collection = {
  id: string
  title: string
  description: string | null
  cover_url: string | null
  is_public: boolean | null
  is_ghost: boolean | null
  asset_ids: string[] | null
  user_id: string | null
  created_at: string | null
}

type Profile = {
  id: string
  tier: string
  is_sovereign: boolean
}

const SOVEREIGN_ID = '565508fc-a939-4d90-bd45-8742c7138f38'

export default function CollectionsPage() {
  const router  = useRouter()
  const [profile, setProfile]         = useState<Profile | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading]         = useState(true)
  const [mounted, setMounted]         = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    let alive = true
    async function load() {
      // Fast session read
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id ?? null

      if (userId) {
        const { data: p } = await supabase
          .from('profiles')
          .select('id, tier, is_sovereign')
          .eq('id', userId)
          .single()
        if (alive && p) setProfile(p as Profile)
      }

      // Fetch public collections + user's own
      let query = supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false })

      if (!userId) {
        // Logged out — public only
        query = query.eq('is_public', true).eq('is_ghost', false)
      } else {
        // Logged in — public OR own
        query = query.or(`is_public.eq.true,user_id.eq.${userId}`)
      }

      const { data } = await query
      if (alive) {
        setCollections((data ?? []) as Collection[])
        setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [mounted])

  if (!mounted) return null

  const sovereignCollections = collections.filter(c => c.user_id === SOVEREIGN_ID && c.is_public)
  const myCollections        = collections.filter(c => c.user_id !== SOVEREIGN_ID || !c.is_public)

  return (
    <div style={{ minHeight: '100vh', background: '#030305', color: '#d4d4e0', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(3,3,5,0.97)', WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,168,76,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 60 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', fontFamily: 'Georgia, serif', fontSize: 17, letterSpacing: '0.18em', color: 'rgba(201,168,76,0.8)', cursor: 'pointer', textTransform: 'uppercase' }}>
          UMBRA
        </button>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <button onClick={() => router.push('/browse')} style={{ background: 'none', border: 'none', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.3em', color: 'rgba(152,152,180,0.6)', cursor: 'pointer', textTransform: 'uppercase' }}>
            The Vault
          </button>
          <button onClick={() => router.push('/drift')} style={{ background: 'none', border: 'none', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.3em', color: 'rgba(152,152,180,0.6)', cursor: 'pointer', textTransform: 'uppercase' }}>
            Drift
          </button>
          <button onClick={() => router.push('/signal')} style={{ background: 'none', border: 'none', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.3em', color: 'rgba(152,152,180,0.6)', cursor: 'pointer', textTransform: 'uppercase' }}>
            Signal
          </button>
        </div>
      </nav>

      {/* Header */}
      <div style={{ padding: '80px 48px 56px', maxWidth: 1200, margin: '0 auto' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.5em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
          The Collections
        </span>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 400, color: '#eeeeF8', letterSpacing: '0.04em', marginBottom: 16 }}>
          Curated worlds within the vault.
        </h1>
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 17, color: 'rgba(152,152,180,0.7)', maxWidth: 560, lineHeight: 1.8 }}>
          Each collection is a deliberate act. Not a folder. A perspective.
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 48px 120px' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.4em', color: 'rgba(201,168,76,0.3)', textTransform: 'uppercase' }}>
              entering the collections
            </span>
          </div>
        ) : (
          <>
            {/* Sovereign Collections */}
            {sovereignCollections.length > 0 && (
              <div style={{ marginBottom: 80 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.4em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase' }}>
                    Sovereign Collections
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(201,168,76,0.12), transparent)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                  {sovereignCollections.map(c => (
                    <CollectionCard key={c.id} collection={c} onClick={() => router.push(`/collections/${c.id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* My Collections */}
            {profile && myCollections.length > 0 && (
              <div style={{ marginBottom: 80 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.4em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase' }}>
                    Your Collections
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(201,168,76,0.12), transparent)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                  {myCollections.map(c => (
                    <CollectionCard key={c.id} collection={c} onClick={() => router.push(`/collections/${c.id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {collections.length === 0 && (
              <EmptyState profile={profile} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CollectionCard({ collection, onClick }: { collection: Collection; onClick: () => void }) {
  const count = collection.asset_ids?.length ?? 0
  return (
    <div
      onClick={onClick}
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden', aspectRatio: '4/3' }}
    >
      {/* Cover image */}
      {collection.cover_url ? (
        <img src={collection.cover_url} alt={collection.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 100%)' }} />
      )}

      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(3,3,5,0.9) 0%, rgba(3,3,5,0.2) 60%, transparent 100%)' }} />

      {/* Ghost badge */}
      {collection.is_ghost && (
        <div style={{ position: 'absolute', top: 14, right: 14, fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', border: '1px solid rgba(201,168,76,0.2)', padding: '3px 8px', background: 'rgba(3,3,5,0.7)' }}>
          Ghost
        </div>
      )}

      {/* Info */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 22px' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#eeeeF8', marginBottom: 6, letterSpacing: '0.02em' }}>
          {collection.title}
        </div>
        {collection.description && (
          <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(152,152,180,0.7)', marginBottom: 10, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {collection.description}
          </div>
        )}
        <span style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: '0.3em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase' }}>
          {count} {count === 1 ? 'piece' : 'pieces'}
        </span>
      </div>
    </div>
  )
}

function EmptyState({ profile }: { profile: Profile | null }) {
  const isSovereign = profile?.is_sovereign === true
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: 32, textAlign: 'center' }}>
      {/* Sigil */}
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="23" y="4" width="2" height="10" fill="rgba(201,168,76,0.25)" />
        <rect x="23" y="34" width="2" height="10" fill="rgba(201,168,76,0.25)" />
        <rect x="4" y="23" width="10" height="2" fill="rgba(201,168,76,0.25)" />
        <rect x="34" y="23" width="10" height="2" fill="rgba(201,168,76,0.25)" />
        <polygon points="24,16 28,20 24,24 20,20" fill="none" stroke="rgba(201,168,76,0.35)" strokeWidth="0.8" />
        <circle cx="24" cy="24" r="3" fill="rgba(201,168,76,0.15)" stroke="rgba(201,168,76,0.3)" strokeWidth="0.8" />
      </svg>

      <div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: 'rgba(238,238,248,0.6)', marginBottom: 12, letterSpacing: '0.04em' }}>
          {isSovereign ? 'No collections exist yet.' : 'The collections have not yet been opened.'}
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: 'rgba(152,152,180,0.5)', lineHeight: 1.9, maxWidth: 400 }}>
          {isSovereign
            ? 'Create the first collection from the upload interface. What you curate becomes permanent.'
            : 'The Sovereign is preparing the first collections. Return when the shadow deepens.'}
        </div>
      </div>

      {!profile && (
        <a href="/auth/login" style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.6)', border: '1px solid rgba(201,168,76,0.2)', padding: '10px 24px', textDecoration: 'none' }}>
          Sign In
        </a>
      )}
    </div>
  )
}
