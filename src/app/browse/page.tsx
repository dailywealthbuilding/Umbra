'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

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

function AssetCard({ asset, isGated }: { asset: Asset; isGated: boolean }) {
  const [hovered, setHovered] = useState(false);
  const tier = (asset.tier_required ?? 'SHADOW').toUpperCase();
  const gold = '#c9a84c';
  const tierColor = tier === 'SHADOW' ? '#5a5a6a' : gold;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: '#0a0a0f',
        border: `1px solid ${hovered && !isGated ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)'}`,
        overflow: 'hidden',
        cursor: isGated ? 'default' : 'pointer',
        transition: 'border-color 0.3s, transform 0.3s',
        transform: hovered && !isGated ? 'translateY(-2px)' : 'none',
        paddingBottom: '133%',
      }}
    >
      {/* Background image via div — no ESLint img warnings */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, left: 0,
        backgroundImage: `url(${asset.cloudinary_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: isGated
          ? 'blur(18px) brightness(0.35)'
          : hovered ? 'brightness(0.82)' : 'brightness(0.9)',
        transform: isGated ? 'scale(1.08)' : hovered ? 'scale(1.03)' : 'scale(1)',
        transition: 'filter 0.5s, transform 0.5s',
      }} />

      {/* Tier badge */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        fontSize: 9,
        letterSpacing: 3,
        color: tierColor,
        background: 'rgba(5,5,7,0.85)',
        border: `1px solid ${tierColor}`,
        padding: '2px 8px',
        textTransform: 'uppercase',
        fontFamily: 'monospace',
      }}>
        {tier}
      </div>

      {/* Gated overlay */}
      {isGated && (
        <div style={{
          position: 'absolute',
          top: 0, right: 0, bottom: 0, left: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}>
          <span style={{
            fontSize: 9,
            letterSpacing: 3,
            color: gold,
            background: 'rgba(5,5,7,0.7)',
            border: '1px solid rgba(201,168,76,0.4)',
            padding: '3px 10px',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
          }}>
            {tier} +
          </span>
          <Link href="/access" style={{
            fontSize: 9,
            letterSpacing: 3,
            color: 'rgba(212,212,224,0.45)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
          }}>
            UNLOCK ACCESS
          </Link>
        </div>
      )}

      {/* Hover caption */}
      {!isGated && hovered && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(5,5,7,0.95))',
          padding: '32px 14px 14px',
        }}>
          <p style={{
            margin: '0 0 4px',
            fontSize: 12,
            fontWeight: 600,
            color: '#d4d4e0',
            letterSpacing: 0.5,
            fontFamily: 'Georgia, serif',
          }}>
            {asset.title ?? 'Vault Asset'}
          </p>
          {asset.aesthetic_tags && (
            <p style={{
              margin: 0,
              fontSize: 9,
              letterSpacing: 2,
              color: 'rgba(201,168,76,0.7)',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
            }}>
              {asset.aesthetic_tags.split(',').slice(0, 2).join('  ·  ')}
            </p>
          )}
        </div>
      )}

      {/* Click overlay for non-gated */}
      {!isGated && (
        <Link
          href={`/asset/${asset.id}`}
          style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0, left: 0,
            display: 'block',
          }}
          aria-label={asset.title ?? 'View asset'}
        />
      )}
    </div>
  );
}

export default function BrowsePage() {
  const [allAssets,    setAllAssets   ] = useState<Asset[]>([]);
  const [profile,      setProfile     ] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [loading,      setLoading     ] = useState(true);
  const [search,       setSearch      ] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [mounted,      setMounted     ] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (!uid) { if (alive) setProfileReady(true); return; }
      supabase
        .from('profiles')
        .select('tier, is_sovereign, display_name')
        .eq('id', uid)
        .single()
        .then(({ data: p }) => {
          if (!alive) return;
          if (p) setProfile(p as Profile);
          setProfileReady(true);
        })
        .catch(() => { if (alive) setProfileReady(true); });
    }).catch(() => { if (alive) setProfileReady(true); });
    return () => { alive = false; };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    supabase
      .from('assets')
      .select('id,title,cloudinary_url,aesthetic_tags,mood_tags,tier_required,origin_region')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (!error && data) setAllAssets(data as Asset[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(5,5,7,0.97)',
        borderBottom: '1px solid rgba(201,168,76,0.07)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        height: 60,
      }}>
        <Link href="/" style={{
          fontFamily: 'Georgia, serif',
          fontSize: 16,
          fontWeight: 700,
          color: '#c9a84c',
          letterSpacing: 6,
          textDecoration: 'none',
        }}>
          UMBRA
        </Link>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search the vault..."
          style={{
            flex: 1,
            maxWidth: 480,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(201,168,76,0.12)',
            padding: '8px 14px',
            color: '#d4d4e0',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {profileReady && isSovereign && (
            <span style={{
              fontFamily: 'monospace',
              fontSize: 9,
              letterSpacing: 3,
              color: '#c9a84c',
            }}>
              ◈ SOVEREIGN
            </span>
          )}
          {profileReady && !profile && (
            <Link href="/auth/login" style={{
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: 3,
              color: 'rgba(212,212,224,0.5)',
              textDecoration: 'none',
              padding: '6px 14px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              SIGN IN
            </Link>
          )}
          <Link href="/access" style={{
            fontFamily: 'monospace',
            fontSize: 10,
            letterSpacing: 3,
            color: '#050507',
            background: '#c9a84c',
            textDecoration: 'none',
            padding: '6px 14px',
          }}>
            UNLOCK ACCESS
          </Link>
        </div>
      </header>

      {/* Filter tabs */}
      <div style={{
        borderBottom: '1px solid rgba(201,168,76,0.07)',
        padding: '0 32px',
        display: 'flex',
        overflowX: 'auto',
      }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: activeFilter === f ? '#c9a84c' : 'rgba(212,212,224,0.4)',
              background: 'none',
              border: 'none',
              borderBottom: activeFilter === f ? '1px solid #c9a84c' : '1px solid transparent',
              padding: '14px 16px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <main style={{ padding: '40px 32px 80px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}>
          <p style={{
            fontFamily: 'monospace',
            fontSize: 11,
            letterSpacing: 4,
            color: 'rgba(201,168,76,0.5)',
            margin: 0,
            textTransform: 'uppercase',
          }}>
            {loading ? 'loading...' : `${filtered.length} pieces in the vault`}
          </p>
          {!isSovereign && (
            <Link href="/access" style={{
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: 3,
              color: 'rgba(201,168,76,0.6)',
              textDecoration: 'none',
            }}>
              UNLOCK MORE →
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
            fontFamily: 'monospace',
            fontSize: 11,
            letterSpacing: 4,
            color: 'rgba(201,168,76,0.3)',
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
              const assetLevel = TIER_ORDER[(asset.tier_required ?? 'SHADOW').toUpperCase()] ?? 0;
              const isGated    = !isSovereign && assetLevel > userTierLevel;
              return <AssetCard key={asset.id} asset={asset} isGated={isGated} />;
            })}
          </div>
        )}
      </main>
    </div>
  );
}
