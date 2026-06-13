'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const supabase = createClient();

const TIER_ORDER: Record<string, number> = {
  SHADOW: 0, NOIR: 1, PRESTIGE: 2, OBSIDIAN: 3,
};

const FILTERS = [
  'ALL','DARK LUXURY','QUIET ARCHITECTURE','RAW DOCUMENTARY',
  'INDUSTRIAL PASTORAL','SACRED GEOMETRY','NEON NOIR','CINEMATIC DECAY',
];

type Asset = {
  id: string;
  title: string | null;
  cloudinary_url: string;
  aesthetic_tags: string | null;
  mood_tags: string | null;
  tier_required: string;
  origin_region: string | null;
};

type Profile = {
  tier: string;
  is_sovereign: boolean;
  display_name: string | null;
};

// ── Shared profile loader ──────────────────────────────────────────────────
async function fetchProfile(uid: string): Promise<Profile | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('tier, is_sovereign, display_name')
      .eq('id', uid)
      .single();
    return (data as Profile) ?? null;
  } catch (_) {
    return null;
  }
}

// ── Card — zero JS hover state ─────────────────────────────────────────────
function AssetCard({ asset, isGated }: { asset: Asset; isGated: boolean }) {
  const raw  = (asset.tier_required ?? 'SHADOW').toUpperCase();
  // Guard against any malformed values slipping through
  const tier = TIER_ORDER[raw] !== undefined ? raw : 'SHADOW';
  const gold   = '#c9a84c';
  const tColor = tier === 'SHADOW' ? '#5a5a6a' : gold;

  const inner = (
    <div style={{
      position: 'relative',
      background: '#0a0a0f',
      border: '1px solid rgba(255,255,255,0.04)',
      overflow: 'hidden',
      paddingBottom: '133%',
      display: 'block',
    }}>
      {/* Image */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0,
        backgroundImage: `url(${asset.cloudinary_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: isGated
          ? 'blur(18px) brightness(0.3)'
          : 'brightness(0.85)',
        transform: isGated ? 'scale(1.08)' : 'scale(1)',
      }} />

      {/* Always-visible title strip */}
      {!isGated && (
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(5,5,7,0.92))',
          padding: '28px 12px 10px',
        }}>
          <p style={{
            margin: 0, fontSize: 11,
            color: 'rgba(212,212,224,0.85)',
            fontFamily: 'Georgia, serif',
            letterSpacing: 0.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {asset.title ?? 'Vault Asset'}
          </p>
        </div>
      )}

      {/* Tier badge */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        fontSize: 9, letterSpacing: 3, color: tColor,
        background: 'rgba(5,5,7,0.85)',
        border: `1px solid ${tColor}`,
        padding: '2px 8px',
        textTransform: 'uppercase', fontFamily: 'monospace',
      }}>
        {tier}
      </div>

      {/* Gated overlay */}
      {isGated && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span style={{
            fontSize: 9, letterSpacing: 3, color: gold,
            background: 'rgba(5,5,7,0.75)',
            border: '1px solid rgba(201,168,76,0.4)',
            padding: '3px 10px',
            textTransform: 'uppercase', fontFamily: 'monospace',
          }}>
            {tier} +
          </span>
          <span style={{
            fontSize: 9, letterSpacing: 3,
            color: 'rgba(212,212,224,0.4)',
            textTransform: 'uppercase', fontFamily: 'monospace',
          }}>
            UNLOCK ACCESS
          </span>
        </div>
      )}
    </div>
  );

  if (isGated) return <div style={{ cursor: 'default' }}>{inner}</div>;
  return (
    <Link href={`/asset/${asset.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      {inner}
    </Link>
  );
}

// ── Browse Page ─────────────────────────────────────────────────────────────
export default function BrowsePage() {
  const [allAssets,    setAllAssets   ] = useState<Asset[]>([]);
  const [profile,      setProfile     ] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [loading,      setLoading     ] = useState(true);
  const [search,       setSearch      ] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [mounted,      setMounted     ] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── AUTH: getUser() for initial load → no flicker ─────────────────────────
  // Pattern: getUser() is a network call that reliably resolves the session.
  // onAuthStateChange is ONLY for live sign-in / sign-out events afterward.
  // This stops the INITIAL_SESSION(null) → SIGNED_IN flip-flop.
  useEffect(() => {
    if (!mounted) return;
    let alive = true;

    // 1. Reliable initial session check
    async function initialLoad() {
      try {
        // Step 1: getSession() — instant cookie read, no network round-trip.
        // On a Kenyan mobile connection to EU-WEST-2, this saves 1–3 seconds.
        const { data: { session } } = await supabase.auth.getSession();
        if (!alive) return;
        if (session?.user?.id) {
          const p = await fetchProfile(session.user.id);
          if (alive && p) setProfile(p);
          if (alive) setProfileReady(true); // unlock UI immediately
        }
        // Step 2: getUser() — background JWT verification with Supabase server.
        const { data: { user } } = await supabase.auth.getUser();
        if (!alive) return;
        if (!session?.user?.id) {
          if (alive) setProfileReady(true);
        } else if (user?.id && user.id !== session.user.id) {
          const p = await fetchProfile(user.id);
          if (alive && p) setProfile(p);
        }
      } catch (_) {
        // silent — network error, no session
      } finally {
        if (alive) setProfileReady(true);
      }
    }
    initialLoad();

    // 2. Live changes only — ignore INITIAL_SESSION
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!alive) return;
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          return;
        }
        if (
          (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
          session?.user?.id
        ) {
          const p = await fetchProfile(session.user.id);
          if (alive && p) setProfile(p);
        }
        // INITIAL_SESSION, USER_UPDATED, PASSWORD_RECOVERY → ignored
      }
    );

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [mounted]);

  // ── ASSETS ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    async function loadAssets() {
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('id,title,cloudinary_url,aesthetic_tags,mood_tags,tier_required,origin_region')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(300);
        if (!error && data) setAllAssets(data as Asset[]);
      } catch (_) {
        // silent
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, [mounted]);

  const filtered = allAssets.filter(a => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !a.title?.toLowerCase().includes(q) &&
        !a.aesthetic_tags?.toLowerCase().includes(q) &&
        !a.mood_tags?.toLowerCase().includes(q) &&
        !a.origin_region?.toLowerCase().includes(q)
      ) return false;
    }
    if (activeFilter !== 'ALL') {
      if (!a.aesthetic_tags?.toLowerCase().includes(activeFilter.toLowerCase())) return false;
    }
    return true;
  });

  const isSovereign   = profile?.is_sovereign === true;
  const userTierLevel = TIER_ORDER[(profile?.tier ?? 'SHADOW').toUpperCase()] ?? 0;

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#050507', color: '#d4d4e0' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,7,0.97)',
        borderBottom: '1px solid rgba(201,168,76,0.07)',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', gap: 24, height: 60,
      }}>
        <Link href="/" style={{
          fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700,
          color: '#c9a84c', letterSpacing: 6, textDecoration: 'none',
        }}>
          UMBRA
        </Link>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search the vault — mood, aesthetic, region..."
          style={{
            flex: 1, maxWidth: 480,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(201,168,76,0.12)',
            padding: '8px 14px', color: '#d4d4e0',
            fontSize: 13, outline: 'none', fontFamily: 'inherit',
          }}
        />

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {profileReady && isSovereign && (
            <span style={{
              fontFamily: 'monospace', fontSize: 9,
              letterSpacing: 3, color: '#c9a84c',
            }}>
              ◈ SOVEREIGN
            </span>
          )}
          {profileReady && profile && !isSovereign && (
            <span style={{
              fontFamily: 'monospace', fontSize: 9,
              letterSpacing: 3, color: 'rgba(201,168,76,0.6)',
            }}>
              {profile.tier} TIER
            </span>
          )}
          {/* Only shows after we KNOW the user is logged out */}
          {profileReady && !profile && (
            <Link href="/auth/login" style={{
              fontFamily: 'monospace', fontSize: 10, letterSpacing: 3,
              color: 'rgba(212,212,224,0.5)', textDecoration: 'none',
              padding: '6px 14px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              SIGN IN
            </Link>
          )}
          <Link href="/access" style={{
            fontFamily: 'monospace', fontSize: 10, letterSpacing: 3,
            color: '#050507', background: '#c9a84c',
            textDecoration: 'none', padding: '6px 14px',
          }}>
            UNLOCK ACCESS
          </Link>
        </div>
      </header>

      {/* ── Filter tabs ── */}
      <div style={{
        borderBottom: '1px solid rgba(201,168,76,0.07)',
        padding: '0 32px', display: 'flex', overflowX: 'auto',
      }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            fontSize: 10, letterSpacing: 2,
            color: activeFilter === f ? '#c9a84c' : 'rgba(212,212,224,0.4)',
            background: 'none', border: 'none',
            borderBottom: activeFilter === f
              ? '1px solid #c9a84c'
              : '1px solid transparent',
            padding: '14px 16px', cursor: 'pointer',
            whiteSpace: 'nowrap', fontFamily: 'monospace',
            textTransform: 'uppercase',
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* ── Main ── */}
      <main style={{ padding: '40px 32px 80px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline',
          justifyContent: 'space-between', marginBottom: 28,
        }}>
          <p style={{
            fontFamily: 'monospace', fontSize: 11, letterSpacing: 4,
            color: 'rgba(201,168,76,0.5)', margin: 0, textTransform: 'uppercase',
          }}>
            {loading ? 'loading...' : `${filtered.length} pieces in the vault`}
          </p>
          {!isSovereign && (
            <Link href="/access" style={{
              fontFamily: 'monospace', fontSize: 10, letterSpacing: 3,
              color: 'rgba(201,168,76,0.6)', textDecoration: 'none',
            }}>
              UNLOCK MORE →
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 300, fontFamily: 'monospace', fontSize: 11,
            letterSpacing: 4, color: 'rgba(201,168,76,0.3)',
          }}>
            ENTERING THE SHADOW...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 2,
          }}>
            {filtered.map(asset => {
              const raw     = (asset.tier_required ?? 'SHADOW').toUpperCase();
              const safeTier = TIER_ORDER[raw] !== undefined ? raw : 'SHADOW';
              const lvl     = TIER_ORDER[safeTier];
              const isGated = !isSovereign && lvl > userTierLevel;
              return <AssetCard key={asset.id} asset={asset} isGated={isGated} />;
            })}
          </div>
        )}
      </main>
    </div>
  );
}
