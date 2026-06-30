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
  asset_type: string | null;          // FIXED: was file_type — DB column is asset_type
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

const GOLD  = '#c9a84c';
const BG    = '#050507';
const TEXT  = '#d4d4e0';
const MUTED = 'rgba(212,212,224,0.4)';
const MONO  = 'monospace';
const SERIF = 'Georgia, serif';

// ── Fix: derive a displayable JPEG from any Cloudinary URL ─────────────────
// Works immediately for existing video assets even without thumbnail_url set.
function getDisplayUrl(asset: Asset): string {
  if (asset.thumbnail_url) return asset.thumbnail_url;
  const url = asset.cloudinary_url;
  if (!url) return '';
  if (url.includes('/video/upload/') || asset.asset_type === 'video') {
    return url
      .replace('/video/upload/', '/video/upload/so_2,f_jpg,w_1200/')
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

function parseTags(raw: string[] | string | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return raw.split(',').map(t => t.trim()).filter(Boolean);
}

// ── Phone Mockup (Packsia-style) ──────────────────────────────────────────
type FeedFmt = 'tiktok' | 'reels' | 'square';

const FEED: Record<FeedFmt, { label: string; w: number; h: number; ratio: string }> = {
  tiktok: { label: 'TikTok',    w: 200, h: 356, ratio: '9:16' },
  reels:  { label: 'Reels',     w: 200, h: 250, ratio: '4:5'  },
  square: { label: 'Square',    w: 200, h: 200, ratio: '1:1'  },
};

function PhoneMockup({
  asset,
  displayUrl,
  isGated,
}: {
  asset: Asset;
  displayUrl: string;
  isGated: boolean;
}) {
  const [fmt, setFmt] = useState<FeedFmt>('tiktok');
  const f = FEED[fmt];

  if (isGated) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: 440, gap: 18,
      }}>
        <div style={{
          width: 56, height: 56,
          border: '1px solid rgba(201,168,76,0.14)',
          borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: MONO, fontSize: 24, color: 'rgba(201,168,76,0.18)' }}>+</span>
        </div>
        <p style={{
          fontFamily: MONO, fontSize: 8, letterSpacing: 3,
          color: 'rgba(201,168,76,0.22)', textTransform: 'uppercase',
          textAlign: 'center', lineHeight: 2.2, margin: 0,
        }}>
          Unlock to preview<br/>on your feed
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '32px 24px',
    }}>
      {/* Format tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 28 }}>
        {(Object.entries(FEED) as [FeedFmt, typeof FEED[FeedFmt]][]).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFmt(k)}
            style={{
              fontFamily: MONO, fontSize: 8, letterSpacing: 2,
              color: fmt === k ? GOLD : 'rgba(212,212,224,0.22)',
              background: fmt === k ? 'rgba(201,168,76,0.07)' : 'none',
              border: fmt === k
                ? '1px solid rgba(201,168,76,0.28)'
                : '1px solid rgba(255,255,255,0.05)',
              padding: '6px 14px', cursor: 'pointer',
              textTransform: 'uppercase', transition: 'all 0.2s',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Phone shell */}
      <div style={{
        position: 'relative', padding: '16px 10px',
        background: '#0c0c14', borderRadius: 36,
        border: '2px solid #1a1a28',
        boxShadow: '0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(201,168,76,0.06)',
      }}>
        {/* Side buttons */}
        <div style={{ position: 'absolute', right: -3, top: 92, width: 3, height: 52, background: '#1a1a28', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: -3, top: 78, width: 3, height: 34, background: '#1a1a28', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: -3, top: 120, width: 3, height: 34, background: '#1a1a28', borderRadius: 2 }} />
        {/* Notch */}
        <div style={{
          position: 'absolute', top: 16, left: '50%',
          transform: 'translateX(-50%)',
          width: 54, height: 7, background: '#0a0a0f', borderRadius: 4, zIndex: 2,
        }} />

        {/* Screen */}
        <div style={{
          width: f.w, height: f.h, borderRadius: 24, overflow: 'hidden',
          position: 'relative', background: '#000',
          transition: 'height 0.4s cubic-bezier(.16,1,.3,1)',
        }}>
          {/* Content: real video plays inside mockup */}
          {asset.asset_type === 'video' ? (
            <video
              src={asset.cloudinary_url}
              autoPlay muted loop playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              backgroundImage: `url(${displayUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
          )}

          {/* TikTok UI layer (vertical format only) */}
          {fmt === 'tiktok' && (
            <>
              <div style={{
                position: 'absolute', right: 7, bottom: 34,
                display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center',
              }}>
                {[
                  { icon: '\u2665', count: '12k' },
                  { icon: '\u29bf', count: '843' },
                  { icon: '\u21aa', count: '2.1k' },
                ].map((it, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 28, height: 28, background: 'rgba(0,0,0,0.42)',
                      borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: '#fff', margin: '0 auto 2px',
                    }}>
                      {it.icon}
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 7, color: '#fff' }}>{it.count}</span>
                  </div>
                ))}
              </div>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '20px 8px 9px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
              }}>
                <p style={{ fontFamily: MONO, fontSize: 8, color: '#fff', margin: 0, fontWeight: 700 }}>
                  @yourhandle
                </p>
                <p style={{ fontFamily: MONO, fontSize: 7, color: 'rgba(255,255,255,0.55)', margin: '3px 0 0' }}>
                  {asset.title ?? 'UMBRA'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Home bar */}
        <div style={{ width: 64, height: 3, background: '#1a1a28', borderRadius: 2, margin: '10px auto 0' }} />
      </div>

      <p style={{
        fontFamily: MONO, fontSize: 8, letterSpacing: 3,
        color: 'rgba(201,168,76,0.22)', marginTop: 16, textTransform: 'uppercase',
      }}>
        {f.ratio} — {f.label}
      </p>
    </div>
  );
}

// ── Asset Detail Page ──────────────────────────────────────────────────────
export default function AssetPage() {
  const params           = useParams();
  const id               = params?.id as string;
  const [asset,          setAsset        ] = useState<Asset | null>(null);
  const [profile,        setProfile      ] = useState<Profile | null>(null);
  const [profileReady,   setProfileReady ] = useState(false);
  const [assetLoading,   setAssetLoading ] = useState(true);
  const [mounted,        setMounted      ] = useState(false);
  const [downloading,    setDownloading  ] = useState(false);
  const [activeTab,      setActiveTab    ] = useState<'full' | 'preview'>('full');

  useEffect(() => { setMounted(true); }, []);

  // Auth
  useEffect(() => {
    if (!mounted) return;
    let alive = true;

    async function init() {
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
        if (!session?.user?.id) {
          if (alive) setProfileReady(true);
        } else if (user?.id && user.id !== session.user.id) {
          const p = await fetchProfile(user.id);
          if (alive && p) setProfile(p);
        }
      } catch (_) {}
      finally { if (alive) setProfileReady(true); }
    }
    init();

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

  // Asset
  useEffect(() => {
    if (!mounted || !id) return;
    async function load() {
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('id,title,description,cloudinary_url,thumbnail_url,asset_type,aesthetic_tags,mood_tags,tier_required,origin_region,era,license,download_count')
          .eq('id', id)
          .single();
        if (!error && data) setAsset(data as Asset);
      } catch (_) {}
      finally { setAssetLoading(false); }
    }
    load();
  }, [mounted, id]);

  async function handleDownload() {
    if (!asset || isGated || downloading) return;
    setDownloading(true);
    try {
      const link      = document.createElement('a');
      link.href       = `/api/download?id=${asset.id}`;
      link.download   = (asset.title ?? 'umbra-asset')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (_) {}
    finally { setDownloading(false); }
  }

  if (!mounted) return null;

  const isSovereign   = profile?.is_sovereign === true;
  const userTierLevel = TIER_ORDER[(profile?.tier ?? 'SHADOW').toUpperCase()] ?? 0;
  const assetTier     = (asset?.tier_required ?? 'SHADOW').toUpperCase();
  const safeAssetTier = TIER_ORDER[assetTier] !== undefined ? assetTier : 'SHADOW';
  const assetTierLvl  = TIER_ORDER[safeAssetTier] ?? 0;
  const isGated = !profileReady
    ? false
    : !profile
      ? true
      : !isSovereign && assetTierLvl > userTierLevel;

  const tierColor     = safeAssetTier === 'SHADOW' ? '#5a5a6a' : GOLD;
  const aestheticTags = parseTags(asset?.aesthetic_tags ?? null);
  const moodTags      = parseTags(asset?.mood_tags ?? null);
  const displayUrl    = asset ? getDisplayUrl(asset) : '';

  if (assetLoading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 4, color: 'rgba(201,168,76,0.3)' }}>
          ENTERING THE VAULT...
        </p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontFamily: SERIF, fontSize: 18, color: TEXT }}>Asset not found.</p>
        <Link href="/browse" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: GOLD, textDecoration: 'none' }}>
          BACK TO VAULT
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .al { display: flex; min-height: 100vh; }
        .al-left {
          flex: 1; position: relative; min-height: 100vh;
          background: #000; display: flex; flex-direction: column;
        }
        .al-right { width: 300px; min-width: 280px; flex-shrink: 0; }
        .tab-btn {
          font-family: monospace; font-size: 9px; letter-spacing: 3px;
          text-transform: uppercase; padding: 10px 22px;
          border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        @media (max-width: 880px) {
          .al { flex-direction: column; }
          .al-left { flex: none; width: 100%; min-height: 56vh; max-height: 72vh; }
          .al-right { width: 100%; min-width: 0; }
        }
      `}</style>

      {/* Top nav */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(rgba(5,5,7,0.9), transparent)',
        pointerEvents: 'none',
      }}>
        <Link href="/" style={{
          fontFamily: SERIF, fontSize: 14, fontWeight: 700,
          color: GOLD, letterSpacing: 6, textDecoration: 'none', pointerEvents: 'auto',
        }}>
          UMBRA
        </Link>
        <Link href="/browse" style={{
          fontFamily: MONO, fontSize: 9, letterSpacing: 3,
          color: MUTED, textDecoration: 'none', pointerEvents: 'auto',
        }}>
          BACK TO VAULT
        </Link>
      </header>

      <div className="al">

        {/* ── Left panel ── */}
        <div className="al-left">

          {/* View tabs — Full View | Feed Preview */}
          <div style={{
            position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, display: 'flex', gap: 0,
            background: 'rgba(5,5,7,0.88)',
            WebkitBackdropFilter: 'blur(12px)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(201,168,76,0.1)',
          }}>
            <button
              className="tab-btn"
              onClick={() => setActiveTab('full')}
              style={{
                background: activeTab === 'full' ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: activeTab === 'full' ? GOLD : 'rgba(212,212,224,0.28)',
                borderRight: '1px solid rgba(201,168,76,0.07)',
              }}
            >
              Full View
            </button>
            <button
              className="tab-btn"
              onClick={() => setActiveTab('preview')}
              style={{
                background: activeTab === 'preview' ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: activeTab === 'preview' ? GOLD : 'rgba(212,212,224,0.28)',
              }}
            >
              Feed Preview
            </button>
          </div>

          {/* Full View */}
          {activeTab === 'full' && (
            <>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: displayUrl ? `url(${displayUrl})` : 'none',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                filter: isGated ? 'blur(22px) brightness(0.28)' : 'brightness(0.95)',
                transform: isGated ? 'scale(1.1)' : 'scale(1)',
                transition: 'filter 0.6s, transform 0.6s',
              }} />
              {!isGated && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to right, transparent 60%, rgba(5,5,7,0.6) 100%)',
                  pointerEvents: 'none',
                }} />
              )}
              {isGated && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 16,
                }}>
                  <p style={{
                    fontFamily: MONO, fontSize: 10, letterSpacing: 5,
                    color: 'rgba(212,212,224,0.5)', margin: 0, textTransform: 'uppercase',
                  }}>
                    REQUIRES {safeAssetTier} ACCESS
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
                      marginTop: 8, fontFamily: MONO, fontSize: 9, letterSpacing: 4,
                      color: TEXT, border: '1px solid rgba(212,212,224,0.25)',
                      padding: '10px 28px', textDecoration: 'none', textTransform: 'uppercase',
                    }}
                  >
                    {profile ? `UNLOCK ${safeAssetTier}` : 'SIGN IN'}
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Feed Preview (phone mockup) */}
          {activeTab === 'preview' && (
            <div style={{
              flex: 1, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              paddingTop: 40, background: '#030305',
            }}>
              <PhoneMockup asset={asset} displayUrl={displayUrl} isGated={isGated} />
            </div>
          )}
        </div>

        {/* ── Right info panel ── */}
        <div className="al-right" style={{
          background: 'rgba(5,5,7,0.97)',
          borderLeft: '1px solid rgba(201,168,76,0.07)',
          padding: '80px 28px 40px',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>

          {/* Tier badge */}
          <div style={{
            display: 'inline-flex', marginBottom: 24,
            border: `1px solid ${tierColor}`,
            padding: '3px 10px', alignSelf: 'flex-start',
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
            color: TEXT, margin: '0 0 16px', lineHeight: 1.3, letterSpacing: 0.5,
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

          <div style={{ height: 1, background: 'rgba(201,168,76,0.07)', marginBottom: 24 }} />

          {/* Metadata rows */}
          {([
            ['REGION',    asset.origin_region ?? '—'],
            ['ERA',       asset.era ?? '2020s'],
            ['LICENSE',   asset.license ?? 'CC0'],
            ['DOWNLOADS', String(asset.download_count ?? 0)],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'baseline', marginBottom: 14,
            }}>
              <span style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: 3,
                color: 'rgba(212,212,224,0.28)', textTransform: 'uppercase',
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

          <div style={{ height: 1, background: 'rgba(201,168,76,0.07)', margin: '10px 0 20px' }} />

          {/* Aesthetic tags */}
          {aestheticTags.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: 3,
                color: 'rgba(212,212,224,0.28)', margin: '0 0 10px', textTransform: 'uppercase',
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
                color: 'rgba(212,212,224,0.28)', margin: '0 0 10px', textTransform: 'uppercase',
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
              border: isGated ? '1px solid rgba(201,168,76,0.25)' : 'none',
              color: isGated ? 'rgba(201,168,76,0.4)' : BG,
              fontFamily: MONO, fontSize: 9, letterSpacing: 3,
              textTransform: 'uppercase',
              cursor: isGated ? 'default' : 'pointer',
              transition: 'opacity 0.2s',
              opacity: downloading ? 0.6 : 1,
            }}
          >
            {isGated
              ? `UNLOCK ${safeAssetTier} TO DOWNLOAD`
              : downloading
                ? 'DOWNLOADING...'
                : 'DOWNLOAD ASSET'}
          </button>

          <p style={{
            fontFamily: MONO, fontSize: 8, letterSpacing: 2,
            color: 'rgba(212,212,224,0.18)', margin: '16px 0 0',
            textTransform: 'uppercase', textAlign: 'center',
          }}>
            {asset.license ?? 'CC0'} — NO ATTRIBUTION REQUIRED
          </p>
        </div>
      </div>
    </div>
  );
}
