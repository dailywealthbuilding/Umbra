'use client';

import { useEffect, useState } from 'react';
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
  const gold = '#c9a84c';
  const tierColor = tier === 'SHADOW' ? '#5a5a6a' : gold;

  const card = (
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
        aspectRatio: '3 / 4',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.cloudinary_url}
        alt={asset.title ?? 'Vault Asset'}
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover', display: 'block',
          filter: isGated ? 'blur(18px) brightness(0.35)' : 'brightness(0.88)',
          transform: isGated ? 'scale(1.08)' : hovered ? 'scale(1.03)' : 'scale(1)',
          transition: 'filter 0.5s, transform 0.5s',
        }}
      />

      <div style={{
        position: 'absolute', top: 10, right: 10,
        fontFamily: 'monospace', fontSize: 9, letterSpacing: 3,
        color: tierColor, background: 'rgba(5,5,7,0.85)',
        border: `1px solid ${tierColor}`,
        padding: '2px 8px', textTransform: 'uppercase',
      }}>
        {tier}
      </div>

      {isGated && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 9, letterSpacing: 3,
            color: gold, background: 'rgba(5,5,7,0.7)',
            border: '1px solid rgba(201,168,76,0.4)',
            padding: '3px 10px', textTransform: 'uppercase',
          }}>
            {tier} +
          </span>
          <Link href="/access" style={{
            fontFamily: 'monospace', fontSize: 9, letterSpacing: 3,
            color: 'rgba(212,212,224,0.45)',
            textDecoration: 'none', textTransform: 'uppercase',
          }}>
            UNLOCK ACCESS
          </Link>
        </div>
      )}

      {!isGated && hovered && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(5,5,7,0.95))',
          padding: '32px 14px 14px',
        }}>
          <p style={{
            margin: '0 0 4px',
            fontFamily: 'serif', fontSize: 12, fontWeight: 600,
            color: '#d4d4e0', letterSpacing: 0.5,
          }}>
            {asset.title ?? 'Vault Asset'}
          </p>
          {asset.aesthetic_tags && (
            <p style={{
              margin: 0, fontFamily: 'monospace',
              fontSize: 9, letterSpacing: 2,
              color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase',
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
  const [allAssets,    setAllAssets   ] = useState<Asset[]>([]);
  const [profile,      setProfile     ] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [loading,      setLoading     ] = useState(true);
  const [search,       setSearch      ] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Load profile from Supabase session
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id;
      if (!userId) { if (alive) setProfileReady(true); return; }
      supabase
        .from('profiles')
        .select('tier, is_sovereign, display_name')
        .eq('id', userId)
        .single()
        .then(({ data: p }) => {
          if (!alive) return;
          if (p) setProfile(p as Profile);
          setProfileReady(true);
        });
    });
    return () => { alive = false; };
  }, []);

  // Load all assets once — filter client-side (avoids TS query-chain issues)
  useEffect(() => {
    setLoading(true);
    supabase
      .from('assets')
      .select('id, title, cloudinary_url, aesthetic_tags, mood_tags, tier_required, origin_region')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (!error && data) setAllAssets(data as Asset[]);
        setLoading(false);
      });
  }, []);

  // Client-side filter — TypeScript-safe, no query reassignment
  const filtered = allAssets.filter(asset => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        asset.title?.toLowerCase().includes(q) ||
        asset.aesthetic_tags?.toLowerCase().includes(q) ||
        asset.mood_tags?.toLowerCase().includes(q) ||
        asset.origin_region?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (activeFilter !== 'ALL') {
      const f = activeFilter.toLowerCase();
      if (!asset.aesthetic_tags?.toLowerCase().includes(f)) return false;
    }
    return true;
  });

  const isSovereign   = profile?.is_sovereign === true;
  const userTierLevel = TIER_ORDER[profile?.tier ?? 'SHADOW'] ?? 0;
  const visibleCount  = isSovereign
    ? filtered.length
    : filtered.filter(a => (TIER_ORDER[a.tier_required ?? 'SHADOW'] ?? 0) <= userTierLevel).length;

  return (
    <div style={{ minHeight: '100vh', background: '#050507', color: '#d4d4e0' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,7,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(201,168,76,0.07)',
        padding: '0 32px', display: 'flex', alignItems: 'center',
        gap: 24, height: 60,
      }}>
        <Link href="/" style={{
          fontFamily: 'serif', fontSize: 16, fontWeight: 700,
          color: '#c9a84c', letterSpacing: 6, textDecoration: 'none',
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
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search the vault — mood, location, aesthetic..."
            style={{
              width: '100%', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(201,168,76,0.12)',
              padding: '8px 14px 8px 34px', color: '#d4d4e0',
              fontSize: 13, fontWeight: 300, outline: 'none',
              letterSpacing: 0.3, borderRadius: 0,
            }}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {profileReady && isSovereign && (
            <span style={{
              fontFamily: 'monospace', fontSize: 9, letterSpacing: 3,
              color: '#c9a84c', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#c9a84c',
                boxShadow: '0 0 8px rgba(201,168,76,0.8)',
                display: 'inline-block',
              }} />
              SOVEREIGN
            </span>
          )}
          {profileReady && !profile && (
            <Link href="/auth/login" style={{
              fontFamily: 'monospace', fontSize: 10, letterSpacing: 3,
              color: 'rgba(212,212,224,0.5)', textDecoration: 'none',
              padding: '6px 14px', border: '1px solid rgba(255,255,255,0.08)',
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

      {/* Filter tabs */}
      <div style={{
        borderBottom: '1px solid rgba(201,168,76,0.07)',
        padding: '0 32px', display: 'flex', overflowX: 'auto',
      }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            fontSize: 10, letterSpacing: 2,
            color: activeFilter === f ? '#c9a84c' : 'rgba(212,212,224,0.4)',
            background: 'none', border: 'none',
            borderBottom: activeFilter === f ? '1px solid #c9a84c' : '1px solid transparent',
            padding: '14px 16px', cursor: 'pointer',
            whiteSpace: 'nowrap', transition: 'color 0.2s',
            fontWeight: 300, textTransform: 'uppercase',
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
              fontFamily: 'serif', fontSize: 11, letterSpacing: 6,
              color: 'rgba(201,168,76,0.5)', margin: '0 0 4px',
              textTransform: 'uppercase',
            }}>THE VAULT</p>
            <p style={{
              fontFamily: 'monospace', fontSize: 11, letterSpacing: 2,
              color: 'rgba(212,212,224,0.3)', margin: 0,
            }}>
              {loading ? 'loading...' : `${visibleCount} pieces visible`}
            </p>
          </div>
          {!isSovereign && (
            <Link href="/access" style={{
              fontFamily: 'monospace', fontSize: 10, letterSpacing: 3,
              color: 'rgba(201,168,76,0.6)', textDecoration: 'none',
            }}>
              UNLOCK MORE PIECES →
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 300, fontFamily: 'monospace', fontSize: 11,
            letterSpacing: 4, color: 'rgba(201,168,76,0.3)',
            textTransform: 'uppercase',
          }}>
            entering the shadow...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 300, fontFamily: 'monospace', fontSize: 11,
            letterSpacing: 4, color: 'rgba(212,212,224,0.2)',
            textTransform: 'uppercase',
          }}>
            the vault is silent
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 2,
          }}>
            {filtered.map(asset => {
              const assetLevel = TIER_ORDER[asset.tier_required ?? 'SHADOW'] ?? 0;
              const isGated    = !isSovereign && assetLevel > userTierLevel;
              return <AssetCard key={asset.id} asset={asset} isGated={isGated} />;
            })}
          </div>
        )}
      </main>

      <style>{`
        input::placeholder { color: rgba(212,212,224,0.25); }
        input:focus { border-color: rgba(201,168,76,0.3) !important; }
      `}</style>
    </div>
  );
}
