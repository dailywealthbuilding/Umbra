'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TIER_ORDER: Record<string, number> = {
  SHADOW: 0, NOIR: 1, PRESTIGE: 2, OBSIDIAN: 3,
};

const FILTERS = [
  'ALL','DARK LUXURY','QUIET ARCHITECTURE','RAW DOCUMENTARY',
  'INDUSTRIAL PASTORAL','SACRED GEOMETRY','NEON NOIR','CINEMATIC DECAY',
];

interface Asset {
  id: string;
  title: string | null;
  cloudinary_url: string;
  aesthetic_tags: string | null;
  mood_tags: string | null;
  tier_required: string;
  origin_region: string | null;
}

interface Profile {
  tier: string;
  is_sovereign: boolean;
  display_name: string | null;
}

// ── Asset Card ───────────────────────────────────────────────────────────────
function AssetCard({ asset, isGated }: { asset: Asset; isGated: boolean }) {
  const [hovered, setHovered] = useState(false);
  const tier = asset.tier_required ?? 'SHADOW';
  const tierColor =
    tier === 'SHADOW'   ? '#5a5a6a' :
    tier === 'NOIR'     ? '#c9a84c' :
    tier === 'PRESTIGE' ? '#d4af37' : '#e8d5a3';

  const card = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: '#0a0a0f',
        border: `1px solid ${hovered && !isGated
          ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)'}`,
        overflow: 'hidden',
        cursor: isGated ? 'default' : 'pointer',
        transition: 'border-color 0.3s, transform 0.3s',
        transform: hovered && !isGated ? 'translateY(-2px)' : 'none',
        aspectRatio: '3 / 4',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.cloudinary_url}
        alt={asset.title ?? 'Vault Asset'}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          filter: isGated
            ? 'blur(18px) brightness(0.35)'
            : 'brightness(0.88)',
          transform: isGated ? 'scale(1.08)' : hovered ? 'scale(1.03)' : 'scale(1)',
          transition: 'filter 0.5s, transform 0.5s',
        }}
      />

      {/* Tier badge */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        fontFamily: "'Courier Prime', monospace",
        fontSize: 9, letterSpacing: 3, color: tierColor,
        background: 'rgba(5,5,7,0.85)',
        border: `1px solid ${tierColor}`,
        padding: '2px 8px', textTransform: 'uppercase' as const,
      }}>
        {tier}
      </div>

      {/* Gate overlay */}
      {isGated && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column' as const,
          alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: 9, letterSpacing: 3, color: '#c9a84c',
            background: 'rgba(5,5,7,0.7)',
            border: '1px solid rgba(201,168,76,0.4)',
            padding: '3px 10px', textTransform: 'uppercase' as const,
          }}>
            {tier} +
          </span>
          <Link href="/access" style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: 9, letterSpacing: 3,
            color: 'rgba(212,212,224,0.45)',
            textDecoration: 'none',
            textTransform: 'uppercase' as const,
          }}>
            UNLOCK ACCESS
          </Link>
        </div>
      )}

      {/* Hover reveal */}
      {!isGated && hovered && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(5,5,7,0.95))',
          padding: '32px 14px 14px',
        }}>
          <p style={{
            fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600,
            color: '#d4d4e0', margin: '0 0 4px', letterSpacing: 0.5,
          }}>
            {asset.title ?? 'Vault Asset'}
          </p>
          {asset.aesthetic_tags && (
            <p style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: 9, letterSpacing: 2, margin: 0,
              color: 'rgba(201,168,76,0.7)',
              textTransform: 'uppercase' as const,
            }}>
              {asset.aesthetic_tags.split(',').slice(0, 2).join('  ·  ')}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (isGated) return <div>{card}</div>;
  return (
    <Link href={`/asset/${asset.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      {card}
    </Link>
  );
}

// ── Browse Page ──────────────────────────────────────────────────────────────
export default function BrowsePage() {
  const [assets,        setAssets       ] = useState<Asset[]>([]);
  const [profile,       setProfile      ] = useState<Profile | null>(null);
  const [profileReady,  setProfileReady ] = useState(false);
  const [loading,       setLoading      ] = useState(true);
  const [search,        setSearch       ] = useState('');
  const [debouncedQ,    setDebouncedQ   ] = useState('');
  const [activeFilter,  setActiveFilter ] = useState('ALL');

  // Profile load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: authData } = await supabase.auth.getSession();
      const user = authData.session?.user ?? null;
      if (!user) { if (!cancelled) setProfileReady(true); return; }

      const { data } = await supabase
        .from('profiles')
        .select('tier, is_sovereign, display_name')
        .eq('id', user.id)
        .single<Profile>();

      if (!cancelled) {
        if (data) setProfile(data);
        setProfileReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch assets — FIX: build filter string first, no query reassignment
  const fetchAssets = useCallback(async () => {
    setLoading(true);

    // Build OR filter string upfront to avoid TypeScript type reassignment
    const searchFilter = debouncedQ.trim()
      ? `title.ilike.%${debouncedQ}%,aesthetic_tags.ilike.%${debouncedQ}%,mood_tags.ilike.%${debouncedQ}%,origin_region.ilike.%${debouncedQ}%`
      : null;

    const aestheticFilter = activeFilter !== 'ALL'
      ? `%${activeFilter.toLowerCase()}%`
      : null;

    // Single query — no reassignment
    const baseQuery = supabase
      .from('assets')
      .select('id, title, cloudinary_url, aesthetic_tags, mood_tags, tier_required, origin_region')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(200);

    const withSearch = searchFilter
      ? baseQuery.or(searchFilter)
      : baseQuery;

    const withFilter = aestheticFilter
      ? withSearch.ilike('aesthetic_tags', aestheticFilter)
      : withSearch;

    const { data, error } = await withFilter;
    if (!error && data) setAssets(data as Asset[]);
    setLoading(false);
  }, [debouncedQ, activeFilter]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const isSovereign   = profile?.is_sovereign === true;
  const userTierLevel = TIER_ORDER[profile?.tier ?? 'SHADOW'] ?? 0;
  const visibleCount  = isSovereign
    ? assets.length
    : assets.filter(a => (TIER_ORDER[a.tier_required ?? 'SHADOW'] ?? 0) <= userTierLevel).length;

  return (
    <div style={{
      minHeight: '100vh', background: '#050507',
      color: '#d4d4e0', fontFamily: "'DM Sans', sans-serif", fontWeight: 300,
    }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,7,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(201,168,76,0.07)',
        padding: '0 32px', display: 'flex', alignItems: 'center',
        gap: 24, height: 60,
      }}>
        <Link href="/" style={{
          fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700,
          color: '#c9a84c', letterSpacing: 6, textDecoration: 'none', flexShrink: 0,
        }}>
          UMBRA
        </Link>

        <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(201,168,76,0.4)', fontSize: 12, pointerEvents: 'none',
          }}>◈</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search the vault — mood, location, aesthetic..."
            style={{
              width: '100%', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(201,168,76,0.12)', borderRadius: 0,
              padding: '8px 14px 8px 34px', color: '#d4d4e0',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              fontWeight: 300, outline: 'none', letterSpacing: 0.3,
            }}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {profileReady && isSovereign && (
            <span style={{
              fontFamily: "'Courier Prime', monospace", fontSize: 9,
              letterSpacing: 3, color: '#c9a84c', opacity: 0.85,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#c9a84c', display: 'inline-block',
                boxShadow: '0 0 8px rgba(201,168,76,0.8)',
              }} />
              SOVEREIGN
            </span>
          )}

          {profileReady && !profile && (
            <Link href="/auth/login" style={{
              fontFamily: "'Courier Prime', monospace", fontSize: 10,
              letterSpacing: 3, color: 'rgba(212,212,224,0.5)',
              textDecoration: 'none', textTransform: 'uppercase' as const,
              padding: '6px 14px', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              SIGN IN
            </Link>
          )}

          <Link href="/access" style={{
            fontFamily: "'Courier Prime', monospace", fontSize: 10,
            letterSpacing: 3, color: '#050507', background: '#c9a84c',
            textDecoration: 'none', textTransform: 'uppercase' as const,
            padding: '6px 14px',
          }}>
            UNLOCK ACCESS
          </Link>
        </div>
      </header>

      {/* Filter tabs */}
      <div style={{
        borderBottom: '1px solid rgba(201,168,76,0.07)',
        padding: '0 32px', display: 'flex',
        overflowX: 'auto', scrollbarWidth: 'none' as const,
      }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 10,
            letterSpacing: 2, textTransform: 'uppercase' as const,
            color: activeFilter === f ? '#c9a84c' : 'rgba(212,212,224,0.4)',
            background: 'none', border: 'none',
            borderBottom: activeFilter === f
              ? '1px solid #c9a84c' : '1px solid transparent',
            padding: '14px 16px', cursor: 'pointer',
            whiteSpace: 'nowrap' as const, transition: 'color 0.2s', fontWeight: 300,
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* Main */}
      <main style={{ padding: '40px 32px 80px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline',
          justifyContent: 'space-between', marginBottom: 28,
        }}>
          <div>
            <p style={{
              fontFamily: "'Cinzel', serif", fontSize: 11,
              letterSpacing: 6, color: 'rgba(201,168,76,0.5)',
              textTransform: 'uppercase' as const, margin: '0 0 4px',
            }}>
              THE VAULT
            </p>
            <p style={{
              fontFamily: "'Courier Prime', monospace", fontSize: 11,
              letterSpacing: 2, color: 'rgba(212,212,224,0.3)', margin: 0,
            }}>
              {loading ? 'loading...' : `${visibleCount} pieces visible`}
            </p>
          </div>
          {!isSovereign && (
            <Link href="/access" style={{
              fontFamily: "'Courier Prime', monospace", fontSize: 10,
              letterSpacing: 3, color: 'rgba(201,168,76,0.6)',
              textDecoration: 'none', textTransform: 'uppercase' as const,
            }}>
              UNLOCK MORE PIECES →
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 300, fontFamily: "'Courier Prime', monospace",
            fontSize: 11, letterSpacing: 4,
            color: 'rgba(201,168,76,0.3)', textTransform: 'uppercase' as const,
          }}>
            entering the shadow...
          </div>
        ) : assets.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 300, fontFamily: "'Courier Prime', monospace",
            fontSize: 11, letterSpacing: 4,
            color: 'rgba(212,212,224,0.2)', textTransform: 'uppercase' as const,
          }}>
            the vault is silent
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 2,
          }}>
            {assets.map(asset => {
              const assetLevel = TIER_ORDER[asset.tier_required ?? 'SHADOW'] ?? 0;
              const isGated    = !isSovereign && assetLevel > userTierLevel;
              return <AssetCard key={asset.id} asset={asset} isGated={isGated} />;
            })}
          </div>
        )}
      </main>

      <style>{`
        input::placeholder { color: rgba(212,212,224,0.25); }
        input:focus        { border-color: rgba(201,168,76,0.3) !important; }
        ::-webkit-scrollbar       { width: 2px; height: 2px; }
        ::-webkit-scrollbar-track { background: #050507; }
        ::-webkit-scrollbar-thumb { background: #3a3a4a; }
      `}</style>
    </div>
  );
}
