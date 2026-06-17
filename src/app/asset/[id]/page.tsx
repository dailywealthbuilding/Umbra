'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const supabase = createClient();

const TIER_ORDER: Record<string, number> = {
  SHADOW: 0, NOIR: 1, PRESTIGE: 2, OBSIDIAN: 3,
};

type Asset = {
  id: string;
  title: string | null;
  description: string | null;
  cloudinary_url: string;
  thumbnail_url: string | null;
  aesthetic_tags: string[] | string | null;
  mood_tags: string[] | string | null;
  tier_required: string;
  origin_region: string | null;
  era: string | null;
  license: string | null;
  download_count: number | null;
};

type Profile = {
  tier: string;
  is_sovereign: boolean;
  display_name: string | null;
};

// ── Shared helpers ─────────────────────────────────────────────────────────
const GOLD   = '#c9a84c';
const BG     = '#050507';
const TEXT   = '#d4d4e0';
const MUTED  = 'rgba(212,212,224,0.4)';
const MONO   = 'monospace';
const SERIF  = 'Georgia, serif';

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

function parseTags(raw: string[] | string | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw.split(',').map(t => t.trim()).filter(Boolean);
}

// ── Asset Detail Page ──────────────────────────────────────────────────────
export default function AssetPage() {
  const params = useParams();
  const id     = params?.id as string;

  const [asset,        setAsset       ] = useState<Asset | null>(null);
  const [profile,      setProfile     ] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [assetLoading, setAssetLoading] = useState(true);
  const [mounted,      setMounted     ] = useState(false);
  const [downloading,  setDownloading ] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── AUTH — same getUser() pattern as browse page ───────────────────────
  useEffect(() => {
    if (!mounted) return;
    let alive = true;

    async function initialLoad() {
      try {
        // Step 1: getSession() — reads cookies instantly, no network call.
        // Shows logged-in UI immediately on slow connections (Kenya → EU).
        const { data: { session } } = await supabase.auth.getSession();
        if (!alive) return;
        if (session?.user?.id) {
          const p = await fetchProfile(session.user.id);
          if (alive && p) setProfile(p);
          if (alive) setProfileReady(true); // unblock UI now
        }
        // Step 2: getUser() — verifies JWT with server in background.
        // Only updates state if user ID changed (e.g. session was stale).
        const { data: { user } } = await supabase.auth.getUser();
        if (!alive) return;
        if (!session?.user?.id) {
          // No session found at all — mark ready and move on
          if (alive) setProfileReady(true);
        } else if (user?.id && user.id !== session.user.id) {
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
        if (
          (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
          session?.user?.id
        ) {
          const p = await fetchProfile(session.user.id);
          if (alive && p) setProfile(p);
        }
      }
    );

    return () => { alive = false; subscription.unsubscribe(); };
  }, [mounted]);

  // ── ASSET LOAD ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || !id) return;

    async function loadAsset() {
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('id,title,description,cloudinary_url,thumbnail_url,aesthetic_tags,mood_tags,tier_required,origin_region,era,license,download_count')
          .eq('id', id)
          .single();
        if (!error && data) setAsset(data as Asset);
      } catch (_) {}
      finally { setAssetLoading(false); }
    }
    loadAsset();
  }, [mounted, id]);

  // ── DOWNLOAD ───────────────────────────────────────────────────────────
  async function handleDownload() {
    if (!asset || isGated || downloading) return;
    setDownloading(true);
    try {
      // Use the server-side download route — forces a real file download,
      // not a browser tab open. The route verifies tier + increments count.
      const link      = document.createElement('a');
      link.href       = `/api/download?id=${asset.id}`;
      link.download   = asset.title
        ? asset.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
        : 'umbra-asset';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) {}
    finally { setDownloading(false); }
  }

  if (!mounted) return null;

  // ── GATE LOGIC ─────────────────────────────────────────────────────────
  const isSovereign   = profile?.is_sovereign === true;
  const userTierLevel = TIER_ORDER[(profile?.tier ?? 'SHADOW').toUpperCase()] ?? 0;
  const assetTier     = (asset?.tier_required ?? 'SHADOW').toUpperCase();
  const safeAssetTier = TIER_ORDER[assetTier] !== undefined ? assetTier : 'SHADOW';
  const assetTierLvl  = TIER_ORDER[safeAssetTier] ?? 0;

  // Not profileReady yet → don't gate (avoid flash of locked state)
  // Not signed in → all assets require account
  // Signed in → check tier match
  const isGated = !profileReady
    ? false
    : !profile
      ? true
      : !isSovereign && assetTierLvl > userTierLevel;

  const tierColor = safeAssetTier === 'SHADOW' ? '#5a5a6a' : GOLD;
  const aestheticTags = parseTags(asset?.aesthetic_tags ?? null);
  const moodTags      = parseTags(asset?.mood_tags ?? null);

  // ── LOADING STATE ──────────────────────────────────────────────────────
  if (assetLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{
          fontFamily: MONO, fontSize: 10, letterSpacing: 4,
          color: 'rgba(201,168,76,0.3)',
        }}>
          ENTERING THE VAULT...
        </p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{
        minHeight: '100vh', background: BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <p style={{ fontFamily: SERIF, fontSize: 18, color: TEXT }}>
          Asset not found.
        </p>
        <Link href="/browse" style={{
          fontFamily: MONO, fontSize: 10, letterSpacing: 3,
          color: GOLD, textDecoration: 'none',
        }}>
          ← THE VAULT
        </Link>
      </div>
    );
  }

  // ── UNLOCK TIER LABEL ──────────────────────────────────────────────────
  const unlockLabel = safeAssetTier === 'SHADOW'
    ? 'SHADOW'
    : safeAssetTier === 'NOIR'
      ? 'NOIR'
      : safeAssetTier === 'PRESTIGE'
        ? 'PRESTIGE'
        : 'OBSIDIAN';

  return (
    <div style={{
      minHeight: '100vh', background: BG,
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Responsive layout — full image, never cropped or over-zoomed ── */}
      <style>{`
        .umbra-asset-layout { flex: 1; display: flex; min-height: 100vh; }
        .umbra-asset-image  { flex: 1; position: relative; overflow: hidden; min-height: 100vh; background: #000; }
        .umbra-asset-info   { width: 300px; min-width: 280px; flex-shrink: 0; }
        @media (max-width: 880px) {
          .umbra-asset-layout { flex-direction: column; }
          .umbra-asset-image  { flex: none; width: 100%; min-height: 56vh; max-height: 70vh; }
          .umbra-asset-info   { width: 100%; min-width: 0; }
        }
      `}</style>

      {/* ── Top nav ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '18px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(rgba(5,5,7,0.9), transparent)',
        pointerEvents: 'none',
      }}>
        <Link href="/" style={{
          fontFamily: SERIF, fontSize: 14, fontWeight: 700,
          color: GOLD, letterSpacing: 6, textDecoration: 'none',
          pointerEvents: 'auto',
        }}>
          UMBRA
        </Link>
        <Link href="/browse" style={{
          fontFamily: MONO, fontSize: 9, letterSpacing: 3,
          color: MUTED, textDecoration: 'none', pointerEvents: 'auto',
        }}>
          ← THE VAULT
        </Link>
      </header>

      {/* ── Main layout ── */}
      <div className="umbra-asset-layout">

        {/* ── Image panel ── */}
        <div className="umbra-asset-image">
          {/* Full image — contain, never cropped or over-zoomed */}
          <div style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0, left: 0,
            backgroundImage: `url(${asset.cloudinary_url})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            filter: isGated ? 'blur(22px) brightness(0.28)' : 'brightness(0.95)',
            transform: isGated ? 'scale(1.1)' : 'scale(1)',
            transition: 'filter 0.6s, transform 0.6s',
          }} />

          {/* Subtle vignette */}
          {!isGated && (
            <div style={{
              position: 'absolute',
              top: 0, right: 0, bottom: 0, left: 0,
              background: 'linear-gradient(to right, transparent 60%, rgba(5,5,7,0.6) 100%)',
              pointerEvents: 'none',
            }} />
          )}

          {/* ── Gated overlay ── */}
          {isGated && (
            <div style={{
              position: 'absolute',
              top: 0, right: 0, bottom: 0, left: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16,
            }}>
              <p style={{
                fontFamily: MONO, fontSize: 10, letterSpacing: 5,
                color: 'rgba(212,212,224,0.5)', margin: 0,
                textTransform: 'uppercase',
              }}>
                REQUIRES {unlockLabel} ACCESS
              </p>
              <p style={{
                fontFamily: SERIF, fontSize: 14, fontStyle: 'italic',
                color: 'rgba(212,212,224,0.3)', margin: 0,
              }}>
                This piece lives in a deeper chamber of the vault.
              </p>
              <Link
                href={profile ? '/subscribe' : '/auth/login'}
                style={{
                  marginTop: 8,
                  fontFamily: MONO, fontSize: 9, letterSpacing: 4,
                  color: TEXT,
                  border: '1px solid rgba(212,212,224,0.25)',
                  padding: '10px 28px',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
              >
                {profile ? `UNLOCK ${unlockLabel}` : 'SIGN IN'}
              </Link>
            </div>
          )}
        </div>

        {/* ── Right info panel ── */}
        <div className="umbra-asset-info" style={{
          background: 'rgba(5,5,7,0.97)',
          borderLeft: '1px solid rgba(201,168,76,0.07)',
          padding: '80px 28px 40px',
          display: 'flex', flexDirection: 'column', gap: 0,
          overflowY: 'auto',
        }}>

          {/* Tier badge */}
          <div style={{
            display: 'inline-flex', marginBottom: 24,
            border: `1px solid ${tierColor}`,
            padding: '3px 10px',
            alignSelf: 'flex-start',
          }}>
            <span style={{
              fontFamily: MONO, fontSize: 9, letterSpacing: 3,
              color: tierColor, textTransform: 'uppercase',
            }}>
              {safeAssetTier} + TIER
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: SERIF, fontSize: 26, fontWeight: 400,
            color: TEXT, margin: '0 0 16px',
            lineHeight: 1.3, letterSpacing: 0.5,
          }}>
            {asset.title ?? 'Vault Asset'}
          </h1>

          {/* Description */}
          {asset.description && (
            <p style={{
              fontFamily: SERIF, fontSize: 13, fontStyle: 'italic',
              color: MUTED, margin: '0 0 32px', lineHeight: 1.7,
            }}>
              {asset.description}
            </p>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(201,168,76,0.07)', marginBottom: 24 }} />

          {/* Metadata rows */}
          {[
            ['REGION',    asset.origin_region ?? '—'],
            ['ERA',       asset.era ?? '2020s'],
            ['LICENSE',   asset.license ?? 'CCO'],
            ['DOWNLOADS', String(asset.download_count ?? 0)],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'baseline', marginBottom: 14,
            }}>
              <span style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: 3,
                color: 'rgba(212,212,224,0.3)', textTransform: 'uppercase',
              }}>
                {label}
              </span>
              <span style={{
                fontFamily: MONO, fontSize: 10,
                color: label === 'LICENSE' ? '#4a8cf5' : MUTED,
                letterSpacing: 1,
              }}>
                {value}
              </span>
            </div>
          ))}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(201,168,76,0.07)', margin: '10px 0 20px' }} />

          {/* Aesthetic tags */}
          {aestheticTags.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: 3,
                color: 'rgba(212,212,224,0.3)', margin: '0 0 10px',
                textTransform: 'uppercase',
              }}>
                AESTHETIC
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {aestheticTags.map(tag => (
                  <span key={tag} style={{
                    fontFamily: MONO, fontSize: 8, letterSpacing: 2,
                    color: MUTED, border: '1px solid rgba(212,212,224,0.12)',
                    padding: '3px 8px', textTransform: 'uppercase',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mood tags */}
          {moodTags.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: 3,
                color: 'rgba(212,212,224,0.3)', margin: '0 0 10px',
                textTransform: 'uppercase',
              }}>
                MOOD
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {moodTags.map(tag => (
                  <span key={tag} style={{
                    fontFamily: MONO, fontSize: 8, letterSpacing: 2,
                    color: MUTED, border: '1px solid rgba(212,212,224,0.12)',
                    padding: '3px 8px', textTransform: 'uppercase',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={isGated || downloading}
            style={{
              padding: '14px 20px',
              background: isGated ? 'transparent' : GOLD,
              border: isGated ? `1px solid rgba(201,168,76,0.25)` : 'none',
              color: isGated ? 'rgba(201,168,76,0.4)' : BG,
              fontFamily: MONO, fontSize: 9, letterSpacing: 3,
              textTransform: 'uppercase',
              cursor: isGated ? 'default' : 'pointer',
              transition: 'opacity 0.2s',
              opacity: downloading ? 0.6 : 1,
            }}
          >
            {isGated
              ? `UNLOCK ${unlockLabel} TO DOWNLOAD`
              : downloading
                ? 'DOWNLOADING...'
                : 'DOWNLOAD ASSET'}
          </button>

          {/* License note */}
          <p style={{
            fontFamily: MONO, fontSize: 8, letterSpacing: 2,
            color: 'rgba(212,212,224,0.2)', margin: '16px 0 0',
            textTransform: 'uppercase', textAlign: 'center',
          }}>
            {asset.license ?? 'CCO'} — NO ATTRIBUTION REQUIRED
          </p>
        </div>
      </div>
    </div>
  );
}
