'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const supabase = createClient();

const TIER_ORDER: Record<string, number> = {
  SHADOW: 0, NOIR: 1, PRESTIGE: 2, OBSIDIAN: 3,
};

const AESTHETIC_FILTERS = [
  'ALL','DARK LUXURY','QUIET ARCHITECTURE','RAW DOCUMENTARY',
  'INDUSTRIAL PASTORAL','SACRED GEOMETRY','NEON NOIR','CINEMATIC DECAY',
];

type AssetType = 'ALL' | 'IMAGE' | 'VIDEO';

type Asset = {
  id: string;
  title: string | null;
  cloudinary_url: string;
  thumbnail_url: string | null;
  asset_type: string | null;
  aesthetic_tags: string[] | string | null;
  mood_tags: string[] | string | null;
  tier_required: string;
  origin_region: string | null;
};

type Profile = {
  tier: string;
  is_sovereign: boolean;
  display_name: string | null;
};

function parseTags(raw: string[] | string | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw.split(',').map(t => t.trim()).filter(Boolean);
}

function getDisplayUrl(asset: Asset): string {
  if (asset.thumbnail_url) return asset.thumbnail_url;
  const url = asset.cloudinary_url;
  if (!url) return '';
  if (url.includes('/video/upload/') || asset.asset_type === 'video') {
    return url
      .replace('/video/upload/', '/video/upload/so_2,f_jpg,w_800/')
      .replace(/\.(mp4|mov|avi|webm|mkv)(\?.*)?$/, '.jpg');
  }
  return url;
}

async function fetchProfile(uid: string): Promise<Profile | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('tier, is_sovereign, display_name')
      .eq('id', uid)
      .single();
    return (data as Profile) ?? null;
  } catch (_) { return null; }
}

// ── Asset Card ────────────────────────────────────────────────────────────────
function AssetCard({ asset, isGated }: { asset: Asset; isGated: boolean }) {
  const raw      = (asset.tier_required ?? 'SHADOW').toUpperCase();
  const tier     = TIER_ORDER[raw] !== undefined ? raw : 'SHADOW';
  const gold     = '#c9a84c';
  const tColor   = tier === 'SHADOW' ? '#5a5a6a' : gold;
  const displayUrl = getDisplayUrl(asset);
  const isVideo  = asset.asset_type === 'video';

  const inner = (
    <div style={{
      position: 'relative',
      background: '#0a0a0f',
      border: '1px solid rgba(255,255,255,0.04)',
      overflow: 'hidden',
      paddingBottom: '133%',
      display: 'block',
    }}>
      {/* Background layer — static thumbnail for images, blurred poster for gated */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
        backgroundImage: displayUrl ? `url(${displayUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: isGated ? 'blur(18px) brightness(0.3)' : 'brightness(0.85)',
        transform: isGated ? 'scale(1.08)' : 'scale(1)',
      }} />

      {/* VIDEO: autoplay silently over the thumbnail — only if not gated */}
      {isVideo && !isGated && (
        <video
          src={asset.cloudinary_url}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: 1,
          }}
        />
      )}

      {/* VIDEO badge */}
      {isVideo && !isGated && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 3,
          fontSize: 'clamp(9px, 1.2vw, 11px)', letterSpacing: 3,
          color: 'rgba(240,217,138,0.9)',
          background: 'rgba(5,5,7,0.82)',
          border: '1px solid rgba(201,168,76,0.3)',
          padding: '3px 8px',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
        }}>
          VIDEO
        </div>
      )}

      {/* Title overlay */}
      {!isGated && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
          background: 'linear-gradient(transparent, rgba(5,5,7,0.92))',
          padding: '32px 14px 12px',
        }}>
          <p style={{
            margin: 0,
            fontSize: 'clamp(12px, 1.6vw, 14px)',
            color: 'rgba(212,212,224,0.9)',
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
        position: 'absolute', top: 10, right: 10, zIndex: 3,
        fontSize: 'clamp(9px, 1.2vw, 11px)', letterSpacing: 3,
        color: tColor,
        background: 'rgba(5,5,7,0.85)',
        border: `1px solid ${tColor}`,
        padding: '3px 9px',
        textTransform: 'uppercase',
        fontFamily: 'monospace',
      }}>
        {tier}
      </div>

      {/* Gated overlay */}
      {isGated && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 3,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span style={{
            fontSize: 'clamp(10px, 1.3vw, 12px)', letterSpacing: 3,
            color: gold, background: 'rgba(5,5,7,0.75)',
            border: '1px solid rgba(201,168,76,0.4)',
            padding: '4px 12px', textTransform: 'uppercase', fontFamily: 'monospace',
          }}>
            {tier} +
          </span>
          <span style={{
            fontSize: 'clamp(10px, 1.3vw, 12px)', letterSpacing: 3,
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

// ── Browse Page ───────────────────────────────────────────────────────────────
export default function BrowsePage() {
  const [allAssets,    setAllAssets   ] = useState<Asset[]>([]);
  const [profile,      setProfile     ] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [loading,      setLoading     ] = useState(true);
  const [search,       setSearch      ] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [activeType,   setActiveType  ] = useState<AssetType>('ALL');
  const [mounted,      setMounted     ] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    async function initialLoad() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!alive) return;
        if (session?.user?.id) {
          const p = await fetchProfile(session.user.id);
          if (alive && p) setProfile(p);
          if (alive) setProfileReady(true);
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!alive) return;
        if (!session?.user?.id) { if (alive) setProfileReady(true); }
        else if (user?.id && user.id !== session.user.id) {
          const p = await fetchProfile(user.id);
          if (alive && p) setProfile(p);
        }
      } catch (_) {}
      finally { if (alive) setProfileReady(true); }
    }
    initialLoad();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!alive) return;
        if (event === 'SIGNED_OUT') { setProfile(null); return; }
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.id) {
          const p = await fetchProfile(session.user.id);
          if (alive && p) setProfile(p);
        }
      }
    );
    return () => { alive = false; subscription.unsubscribe(); };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    async function loadAssets() {
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('id,title,cloudinary_url,thumbnail_url,asset_type,aesthetic_tags,mood_tags,tier_required,origin_region')
          .order('created_at', { ascending: false })
          .limit(300);
        if (!error && data) setAllAssets(data as Asset[]);
      } catch (_) {}
      finally { setLoading(false); }
    }
    loadAssets();
  }, [mounted]);

  const filtered = allAssets.filter(a => {
    if (activeType === 'IMAGE' && a.asset_type === 'video') return false;
    if (activeType === 'VIDEO' && a.asset_type !== 'video') return false;

    const tagList   = [...parseTags(a.aesthetic_tags), ...parseTags(a.mood_tags)];
    const tagString = tagList.join(' ').toLowerCase();
    if (search.trim()) {
      const q = search.toLowerCase();
      const haystack = [a.title ?? '', tagString, a.origin_region ?? ''].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (activeFilter !== 'ALL') {
      if (!tagString.includes(activeFilter.toLowerCase())) return false;
    }
    return true;
  });

  const imageCount    = allAssets.filter(a => a.asset_type !== 'video').length;
  const videoCount    = allAssets.filter(a => a.asset_type === 'video').length;
  const isSovereign   = profile?.is_sovereign === true;
  const userTierLevel = TIER_ORDER[(profile?.tier ?? 'SHADOW').toUpperCase()] ?? 0;

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#050507', color: '#d4d4e0' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,7,0.97)',
        WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(201,168,76,0.07)',
        padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 16, height: 64,
      }}>
        <Link href="/" style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(16px, 2.2vw, 20px)',
          fontWeight: 700,
          color: '#c9a84c', letterSpacing: 6, textDecoration: 'none', flexShrink: 0,
        }}>
          UMBRA
        </Link>

        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search the vault — mood, aesthetic, region..."
          style={{
            flex: 1, minWidth: 0, maxWidth: 480,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(201,168,76,0.12)',
            padding: '9px 16px',
            color: '#d4d4e0',
            fontSize: 'clamp(13px, 1.6vw, 15px)',
            outline: 'none',
            fontFamily: 'Georgia, serif',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginLeft: 'auto', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginRight: 20 }}>
            {(['Drift', 'Collections', 'Signal'] as const).map(link => (
              <Link key={link} href={`/${link.toLowerCase()}`} style={{
                fontFamily: 'monospace',
                fontSize: 'clamp(11px, 1.3vw, 13px)',
                letterSpacing: '0.25em',
                color: 'rgba(152,152,180,0.55)',
                textDecoration: 'none',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>{link}</Link>
            ))}
          </div>

          {profileReady && isSovereign && (
            <span style={{ fontFamily: 'monospace', fontSize: 'clamp(11px, 1.3vw, 13px)', letterSpacing: 3, color: '#c9a84c', marginRight: 14, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
              SOVEREIGN
            </span>
          )}
          {profileReady && profile && !isSovereign && (
            <span style={{ fontFamily: 'monospace', fontSize: 'clamp(11px, 1.3vw, 13px)', letterSpacing: 3, color: 'rgba(201,168,76,0.6)', marginRight: 14, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
              {profile.tier}
            </span>
          )}
          {profileReady && !profile && (
            <Link href="/auth/login" style={{
              fontFamily: 'monospace',
              fontSize: 'clamp(11px, 1.3vw, 13px)',
              letterSpacing: 3,
              color: 'rgba(212,212,224,0.5)',
              textDecoration: 'none',
              padding: '7px 14px',
              border: '1px solid rgba(255,255,255,0.08)',
              marginRight: 10,
              textTransform: 'uppercase',
            }}>SIGN IN</Link>
          )}
          {profileReady && (!profile || profile.tier === 'SHADOW') && (
            <Link href="/subscribe" style={{
              fontFamily: 'monospace',
              fontSize: 'clamp(11px, 1.3vw, 13px)',
              letterSpacing: 3,
              color: '#050507',
              background: '#c9a84c',
              textDecoration: 'none',
              padding: '7px 16px',
              textTransform: 'uppercase',
            }}>UNLOCK</Link>
          )}
        </div>
      </header>

      {/* ── Type filter: ALL | IMAGES | VIDEOS ── */}
      <div style={{
        padding: '0 24px',
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid rgba(201,168,76,0.05)',
        background: 'rgba(10,10,15,0.5)',
      }}>
        {(['ALL', 'IMAGE', 'VIDEO'] as AssetType[]).map(t => {
          const count = t === 'IMAGE' ? imageCount : t === 'VIDEO' ? videoCount : allAssets.length;
          const label = t === 'ALL' ? 'ALL' : t === 'IMAGE' ? 'IMAGES' : 'VIDEOS';
          const isActive = activeType === t;
          return (
            <button key={t} onClick={() => setActiveType(t)} style={{
              fontSize: 'clamp(11px, 1.3vw, 13px)',
              letterSpacing: 3,
              color: isActive ? '#c9a84c' : 'rgba(212,212,224,0.28)',
              background: isActive ? 'rgba(201,168,76,0.05)' : 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid #c9a84c' : '2px solid transparent',
              padding: '14px 20px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              {label}
              {!loading && count > 0 && (
                <span style={{ marginLeft: 8, fontSize: 'clamp(10px, 1.1vw, 12px)', color: isActive ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.14)' }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Aesthetic filter tabs ── */}
      <div style={{
        borderBottom: '1px solid rgba(201,168,76,0.07)',
        padding: '0 24px',
        display: 'flex',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {AESTHETIC_FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            fontSize: 'clamp(11px, 1.3vw, 13px)',
            letterSpacing: 2,
            color: activeFilter === f ? '#c9a84c' : 'rgba(212,212,224,0.4)',
            background: 'none', border: 'none',
            borderBottom: activeFilter === f ? '2px solid #c9a84c' : '2px solid transparent',
            padding: '14px 18px', cursor: 'pointer',
            whiteSpace: 'nowrap', fontFamily: 'monospace', textTransform: 'uppercase',
          }}>{f}</button>
        ))}
      </div>

      {/* ── Main grid ── */}
      <main style={{ padding: '36px 24px 80px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
          <p style={{
            fontFamily: 'monospace',
            fontSize: 'clamp(11px, 1.3vw, 13px)',
            letterSpacing: 4,
            color: 'rgba(201,168,76,0.5)',
            margin: 0,
            textTransform: 'uppercase',
          }}>
            {loading
              ? 'loading...'
              : `${filtered.length} ${activeType === 'VIDEO' ? 'videos' : activeType === 'IMAGE' ? 'images' : 'pieces'} in the vault`}
          </p>
          {!isSovereign && (
            <Link href="/subscribe" style={{
              fontFamily: 'monospace',
              fontSize: 'clamp(11px, 1.3vw, 13px)',
              letterSpacing: 3,
              color: 'rgba(201,168,76,0.6)',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}>
              UNLOCK MORE
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300,
            fontFamily: 'monospace',
            fontSize: 'clamp(12px, 1.5vw, 14px)',
            letterSpacing: 4, color: 'rgba(201,168,76,0.3)', textTransform: 'uppercase',
          }}>
            ENTERING THE SHADOW...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, gap: 20 }}>
            <p style={{
              fontFamily: 'monospace',
              fontSize: 'clamp(12px, 1.5vw, 14px)',
              letterSpacing: 4, color: 'rgba(201,168,76,0.3)', margin: 0, textTransform: 'uppercase', textAlign: 'center',
            }}>
              Nothing found
            </p>
            <button
              onClick={() => { setActiveType('ALL'); setActiveFilter('ALL'); setSearch(''); }}
              style={{
                fontFamily: 'monospace',
                fontSize: 'clamp(11px, 1.3vw, 13px)',
                letterSpacing: 3,
                color: '#c9a84c', background: 'none',
                border: '1px solid rgba(201,168,76,0.3)',
                padding: '10px 22px', cursor: 'pointer', textTransform: 'uppercase',
              }}
            >
              CLEAR FILTERS
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
            gap: 3,
          }}>
            {filtered.map(asset => {
              const raw      = (asset.tier_required ?? 'SHADOW').toUpperCase();
              const safeTier = TIER_ORDER[raw] !== undefined ? raw : 'SHADOW';
              const lvl      = TIER_ORDER[safeTier];
              const isGated  = !isSovereign && lvl > userTierLevel;
              return <AssetCard key={asset.id} asset={asset} isGated={isGated} />;
            })}
          </div>
        )}
      </main>
    </div>
  );
}
