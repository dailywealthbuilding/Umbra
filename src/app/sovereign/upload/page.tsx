'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'umbra_unsigned';
const OR_KEY        = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY!;
const CORRECT_KEY   = process.env.NEXT_PUBLIC_OBSIDIAN_KEY!;

// ── Vision model chain ────────────────────────────────────────────────────────
// Model 1: nvidia — confirmed working, always first
// Model 2: qwen2-vl — confirmed vision on free tier (replaces gemma which doesn't accept image_url blocks)
// Model 3: llama-3.2-vision — confirmed vision on free tier (replaces nemotron-omni which timed out)
const VISION_MODELS = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'qwen/qwen2-vl-7b-instruct:free',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
];

type Tab    = 'single' | 'bulk';
type Status = 'pending' | 'uploading' | 'analyzing' | 'ready' | 'publishing' | 'published' | 'error';

interface Meta {
  title: string; description: string; aesthetic_tags: string;
  mood_tags: string; origin_region: string; era: string; tier_required: string;
}

interface BulkItem {
  id: string; file: File; previewUrl: string; status: Status;
  cloudUrl: string; thumbUrl: string; assetType: string; meta: Meta; errorMsg: string;
}

const DEFAULT_META: Meta = {
  title: '', description: '', aesthetic_tags: '',
  mood_tags: '', origin_region: '', era: '', tier_required: 'NOIR',
};

const STATUS_COLOR: Record<Status, string> = {
  pending: '#5a5a6a', uploading: '#c9a84c', analyzing: '#c9a84c',
  ready: '#4caf87', publishing: '#c9a84c', published: '#3a3a4a', error: '#cf4c4c',
};

const TIERS = ['SHADOW', 'NOIR', 'PRESTIGE', 'OBSIDIAN'];

const fileIsVideo = (file: File) => file.type.startsWith('video/');

// ── Upload ────────────────────────────────────────────────────────────────────
async function uploadToCloudinary(source: File | string): Promise<{ url: string; thumb: string; assetType: string }> {
  const fd = new FormData();
  fd.append('file', source as Blob);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'umbra');

  const isVid = source instanceof File && fileIsVideo(source);
  const resourceType = isVid ? 'video' : 'image';

  const res  = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: fd }
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Cloudinary upload failed');

  const thumb = isVid
    ? data.secure_url
        .replace('/video/upload/', '/video/upload/w_400,q_80,so_2/')
        .replace(/\.[^.]+$/, '.jpg')
    : data.secure_url.replace('/upload/', '/upload/w_400,q_80/');

  return { url: data.secure_url, thumb, assetType: isVid ? 'video' : 'image' };
}

// ── AI Analysis ───────────────────────────────────────────────────────────────
async function analyzeWithAI(imageUrl: string): Promise<{ meta: Meta; model: string }> {
  const prompt = `Analyze this image. Return ONLY a JSON object — no markdown, no explanation.
{"title":"evocative title 4-6 words","description":"one atmospheric sentence sensory language","aesthetic_tags":"2-3 comma-separated from: Dark Luxury, Quiet Architecture, Raw Documentary, Sacred Geometry, Industrial Pastoral, Urban Myth, Coastal Silence, Ritual Space","mood_tags":"3 comma-separated from: Still, Weight, Shadow, Solitude, Reverence, Ancient, Raw, Dusk, Memory, Decay, Silence, Intimacy","origin_region":"region or country implied","era":"2020s","tier_required":"SHADOW or NOIR or PRESTIGE or OBSIDIAN"}`;

  for (let i = 0; i < VISION_MODELS.length; i++) {
    const model = VISION_MODELS[i];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${OR_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://umbra-wine.vercel.app',
          'X-Title': 'UMBRA Sovereign Upload',
        },
        body: JSON.stringify({
          model,
          max_tokens: 350,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageUrl } },
              { type: 'text', text: prompt },
            ],
          }],
        }),
      });

      clearTimeout(timeout);
      if (!res.ok) { await new Promise(r => setTimeout(r, 1000)); continue; }

      const data = await res.json();
      const raw  = (data.choices?.[0]?.message?.content || '').trim();
      if (!raw) continue;

      const jsonMatch = raw.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) continue;

      const p = JSON.parse(jsonMatch[0]);
      if (!p.title && !p.aesthetic_tags) continue;

      return {
        meta: {
          title         : (p.title          || '').slice(0, 80),
          description   : p.description    || '',
          aesthetic_tags: p.aesthetic_tags || '',
          mood_tags     : p.mood_tags       || '',
          origin_region : p.origin_region  || '',
          era           : p.era            || '2020s',
          tier_required : p.tier_required  || 'NOIR',
        },
        model: `[${i + 1}/${VISION_MODELS.length}] ${model.split('/')[1]}`,
      };
    } catch {
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    meta: { ...DEFAULT_META, title: `Vault Asset — ${stamp}`, era: '2020s', tier_required: 'NOIR' },
    model: 'manual',
  };
}

// ── Publish ───────────────────────────────────────────────────────────────────
// CRITICAL FIX: asset_type was never saved — this is why the video tab was always empty
async function publishToVault(cloudUrl: string, thumbUrl: string, meta: Meta, assetType: string = 'image') {
  const parse = (s: string) => s.split(',').map(t => t.trim()).filter(Boolean);
  const { error } = await supabase.from('assets').insert({
    cloudinary_url: cloudUrl,
    thumbnail_url : thumbUrl,
    asset_type    : assetType,   // FIXED: was missing — caused empty video tab
    title         : meta.title,
    description   : meta.description,
    aesthetic_tags: parse(meta.aesthetic_tags),
    mood_tags     : parse(meta.mood_tags),
    origin_region : meta.origin_region,
    era           : meta.era,
    tier_required : meta.tier_required,
  });
  if (error) throw error;
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const labelStyle = {
  fontFamily: "'Courier Prime', monospace",
  fontSize: 12,
  color: '#7a7a8a',
  letterSpacing: 2,
  display: 'block' as const,
  marginBottom: 7,
  textTransform: 'uppercase' as const,
};

const inputStyle = {
  width: '100%',
  background: '#0a0a0f',
  border: '1px solid #2a2a3a',
  color: '#d4d4e0',
  padding: '11px 14px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box' as const,
};

// ── Root ──────────────────────────────────────────────────────────────────────
export default function SovereignUpload() {
  const [key,           setKey          ] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [tab,           setTab          ] = useState<Tab>('single');

  useEffect(() => {
    const stored = localStorage.getItem('umbra_sovereign');
    if (stored && stored === CORRECT_KEY) setAuthenticated(true);
  }, []);

  function handleAuth() {
    if (key === CORRECT_KEY) {
      setAuthenticated(true);
      localStorage.setItem('umbra_sovereign', CORRECT_KEY);
    } else {
      alert('Access denied. The vault remains closed.');
    }
  }

  if (!authenticated) return <AuthGate keyVal={key} setKey={setKey} onAuth={handleAuth} />;

  return (
    <div style={{ minHeight: '100vh', background: '#050507', color: '#d4d4e0', fontFamily: "'DM Sans', sans-serif" }}>
      <Header tab={tab} setTab={setTab} />
      <div style={{ padding: '40px 48px' }}>
        {tab === 'single' ? <SingleUpload /> : <BulkUpload />}
      </div>
    </div>
  );
}

// ── Auth Gate ─────────────────────────────────────────────────────────────────
function AuthGate({ keyVal, setKey, onAuth }: { keyVal: string; setKey: (v: string) => void; onAuth: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#050507', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 440, padding: '56px', border: '1px solid #1a1a2e', background: '#0a0a0f' }}>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: 24, color: '#c9a84c', letterSpacing: 6, marginBottom: 10 }}>UMBRA</p>
        <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#5a5a6a', letterSpacing: 4, marginBottom: 40, textTransform: 'uppercase' }}>Sovereign Access Required</p>
        <input
          type="password"
          value={keyVal}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAuth()}
          placeholder="Obsidian Key"
          style={{ width: '100%', padding: '14px 16px', background: '#050507', border: '1px solid #2a2a3a', color: '#d4d4e0', fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
        />
        <button
          onClick={onAuth}
          style={{ width: '100%', padding: '15px', background: '#c9a84c', color: '#050507', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: 4, fontWeight: 700 }}
        >
          AUTHENTICATE
        </button>
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div style={{ borderBottom: '1px solid #1a1a2e', padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color: '#c9a84c', margin: 0, letterSpacing: 5 }}>UMBRA</p>
        <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#5a5a6a', margin: '5px 0 0', letterSpacing: 3, textTransform: 'uppercase' }}>Sovereign Upload Panel</p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['single', 'bulk'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 28px',
              border: `1px solid ${tab === t ? '#c9a84c' : '#2a2a3a'}`,
              background: tab === t ? 'rgba(201,168,76,0.08)' : 'transparent',
              color: tab === t ? '#c9a84c' : '#5a5a6a',
              cursor: 'pointer',
              fontFamily: "'Courier Prime', monospace",
              fontSize: 12, letterSpacing: 3, textTransform: 'uppercase' as const,
              transition: 'all 0.2s',
            }}
          >
            {t === 'single' ? 'SINGLE' : 'BULK'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Single Upload ─────────────────────────────────────────────────────────────
function SingleUpload() {
  const [preview,    setPreview   ] = useState('');
  const [isVidFile,  setIsVidFile ] = useState(false);
  const [cloudUrl,   setCloudUrl  ] = useState('');
  const [thumbUrl,   setThumbUrl  ] = useState('');
  const [assetType,  setAssetType ] = useState('image');
  const [meta,       setMeta      ] = useState<Meta>({ ...DEFAULT_META });
  const [status,     setStatus    ] = useState('');
  const [processing, setProcessing] = useState(false);
  const [published,  setPublished ] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;

    setPreview(URL.createObjectURL(file));
    setIsVidFile(fileIsVideo(file));
    setCloudUrl(''); setMeta({ ...DEFAULT_META }); setPublished(false);
    setProcessing(true);
    setStatus(fileIsVideo(file) ? 'Uploading video to Cloudinary...' : 'Uploading image to Cloudinary...');

    try {
      const { url, thumb, assetType: at } = await uploadToCloudinary(file);
      setCloudUrl(url); setThumbUrl(thumb); setAssetType(at);
      setStatus('Analyzing with AI...');
      const { meta: m, model } = await analyzeWithAI(thumb);
      setMeta(m);
      setStatus(`Tagged by ${model}`);
      setTimeout(() => setStatus(''), 3000);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  }

  async function handlePublish() {
    setProcessing(true); setStatus('Publishing to vault...');
    try {
      await publishToVault(cloudUrl, thumbUrl, meta, assetType);
      setPublished(true);
      setPreview(''); setCloudUrl(''); setMeta({ ...DEFAULT_META }); setStatus('');
      setIsVidFile(false); setAssetType('image');
    } catch (e: any) {
      setStatus(`Publish failed: ${e.message}`);
    } finally {
      setProcessing(false);
    }
  }

  function pickFile() {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = 'image/*,video/*';
    i.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) handleFile(f);
    };
    i.click();
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {published && (
        <div style={{ padding: '16px 20px', background: 'rgba(76,175,135,0.08)', border: '1px solid #4caf87', marginBottom: 32, fontFamily: "'Courier Prime', monospace", fontSize: 13, color: '#4caf87', letterSpacing: 3 }}>
          ASSET PUBLISHED — LIVE IN THE VAULT
        </div>
      )}

      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f && (f.type.startsWith('image/') || f.type.startsWith('video/'))) handleFile(f);
        }}
        onClick={pickFile}
        style={{
          border: `2px dashed ${preview ? '#c9a84c' : '#2a2a3a'}`,
          cursor: 'pointer', overflow: 'hidden',
          minHeight: preview ? 'auto' : 240,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.3s', position: 'relative' as const,
        }}
      >
        {preview ? (
          isVidFile ? (
            <video src={preview} style={{ width: '100%', maxHeight: 440, objectFit: 'cover', display: 'block' }} autoPlay muted loop playsInline />
          ) : (
            <img src={preview} alt="" style={{ width: '100%', maxHeight: 440, objectFit: 'cover', display: 'block' }} />
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 40px' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: '#5a5a6a', fontStyle: 'italic', margin: '0 0 12px' }}>
              Drop image or video here
            </p>
            <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#3a3a4a', letterSpacing: 3, margin: 0, textTransform: 'uppercase' }}>
              or click to browse — image + video
            </p>
          </div>
        )}
      </div>

      {status && (
        <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: 13, color: '#c9a84c', letterSpacing: 3, margin: '16px 0 0' }}>
          {status}
        </p>
      )}

      {cloudUrl && !processing && (
        <div style={{ marginTop: 44 }}>
          {assetType === 'video' && (
            <div style={{ marginBottom: 20, padding: '10px 16px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#c9a84c', letterSpacing: 2 }}>
              VIDEO — asset_type will be saved as "video"
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
            {(['title', 'origin_region', 'aesthetic_tags', 'mood_tags', 'era'] as (keyof Meta)[]).map(field => (
              <div key={field}>
                <label style={labelStyle}>{field.replace(/_/g, ' ')}</label>
                <input
                  type="text"
                  value={meta[field]}
                  onChange={e => setMeta(p => ({ ...p, [field]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            ))}
            <div>
              <label style={labelStyle}>Tier Required</label>
              <select
                value={meta.tier_required}
                onChange={e => setMeta(p => ({ ...p, tier_required: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {TIERS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={meta.description}
                onChange={e => setMeta(p => ({ ...p, description: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>
          <button
            onClick={handlePublish}
            disabled={processing}
            style={{
              marginTop: 28, width: '100%', padding: '18px',
              background: '#c9a84c', color: '#050507', border: 'none',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontFamily: "'Cinzel', serif", fontSize: 14, letterSpacing: 4, fontWeight: 700,
              opacity: processing ? 0.5 : 1, transition: 'opacity 0.2s',
            }}
          >
            PUBLISH TO VAULT
          </button>
        </div>
      )}
    </div>
  );
}

// ── Bulk Upload ───────────────────────────────────────────────────────────────
function BulkUpload() {
  const [items,      setItems     ] = useState<BulkItem[]>([]);
  const [processing, setProcessing] = useState(false);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(
      f => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    const newItems: BulkItem[] = arr.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: 'pending', cloudUrl: '', thumbUrl: '', assetType: fileIsVideo(f) ? 'video' : 'image',
      meta: { ...DEFAULT_META }, errorMsg: '',
    }));
    setItems(prev => [...prev, ...newItems]);
  }

  function update(id: string, patch: Partial<BulkItem>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  }

  function updateMeta(id: string, field: keyof Meta, val: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, meta: { ...i.meta, [field]: val } } : i));
  }

  async function processItem(item: BulkItem) {
    update(item.id, { status: 'uploading' });
    try {
      const { url, thumb, assetType } = await uploadToCloudinary(item.file);
      update(item.id, { cloudUrl: url, thumbUrl: thumb, assetType, status: 'analyzing' });
      const { meta, model } = await analyzeWithAI(thumb);
      update(item.id, {
        meta, status: 'ready',
        errorMsg: model === 'manual' ? 'Fields blank — fill manually' : `Tagged by ${model}`,
      });
    } catch (e: any) {
      update(item.id, { status: 'error', errorMsg: e.message });
    }
  }

  async function analyzeAll() {
    if (processing) return;
    setProcessing(true);
    const targets = items.filter(i => i.status === 'pending' || i.status === 'error');
    for (const item of targets) {
      await processItem(item);
      await new Promise(r => setTimeout(r, 5000));
    }
    setProcessing(false);
  }

  async function uploadOnly(item: BulkItem) {
    update(item.id, { status: 'uploading' });
    try {
      const { url, thumb, assetType } = await uploadToCloudinary(item.file);
      update(item.id, {
        cloudUrl: url, thumbUrl: thumb, assetType,
        status: 'ready', errorMsg: 'Skipped AI — fill fields manually',
      });
    } catch (e: any) {
      update(item.id, { status: 'error', errorMsg: e.message });
    }
  }

  async function uploadAllSkipAI() {
    if (processing) return;
    setProcessing(true);
    const targets = items.filter(i => i.status === 'pending' || i.status === 'error');
    for (const item of targets) {
      await uploadOnly(item);
      await new Promise(r => setTimeout(r, 800));
    }
    setProcessing(false);
  }

  async function publishItem(id: string) {
    const item = items.find(i => i.id === id);
    if (!item || item.status !== 'ready') return;
    update(id, { status: 'publishing' });
    try {
      // FIXED: pass item.assetType so videos get saved correctly
      await publishToVault(item.cloudUrl, item.thumbUrl, item.meta, item.assetType);
      update(id, { status: 'published' });
    } catch (e: any) {
      update(id, { status: 'error', errorMsg: e.message });
    }
  }

  async function publishAllReady() {
    const ready = items.filter(i => i.status === 'ready');
    for (const item of ready) {
      await publishItem(item.id);
      await new Promise(r => setTimeout(r, 400));
    }
  }

  function clearPublished() {
    setItems(prev => prev.filter(i => i.status !== 'published'));
  }

  async function retryAI(item: BulkItem) {
    const analyzeUrl = item.thumbUrl || item.cloudUrl;
    if (!analyzeUrl) return;
    update(item.id, { status: 'analyzing', errorMsg: '' });
    try {
      const { meta, model } = await analyzeWithAI(analyzeUrl);
      update(item.id, {
        meta, status: 'ready',
        errorMsg: model === 'manual' ? 'Fields blank — fill manually' : `Tagged by ${model}`,
      });
    } catch (e: any) {
      update(item.id, { status: 'ready', errorMsg: `Retry failed: ${e.message}` });
    }
  }

  async function retryAllFailed() {
    if (processing) return;
    setProcessing(true);
    const targets = items.filter(
      i => i.status === 'ready' && (
        i.errorMsg === 'Fields blank — fill manually' ||
        i.errorMsg === 'Skipped AI — fill fields manually'
      )
    );
    for (const item of targets) {
      await retryAI(item);
      await new Promise(r => setTimeout(r, 4000));
    }
    setProcessing(false);
  }

  function pickFiles() {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = 'image/*,video/*';
    i.multiple = true;
    i.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files;
      if (f) addFiles(f);
    };
    i.click();
  }

  const readyCount     = items.filter(i => i.status === 'ready').length;
  const publishedCount = items.filter(i => i.status === 'published').length;
  const pendingCount   = items.filter(i => i.status === 'pending' || i.status === 'error').length;
  const retryCount     = items.filter(i =>
    i.status === 'ready' && (
      i.errorMsg === 'Fields blank — fill manually' ||
      i.errorMsg === 'Skipped AI — fill fields manually'
    )
  ).length;

  const bulkLabelStyle = {
    fontFamily: "'Courier Prime', monospace", fontSize: 11,
    color: '#7a7a8a', letterSpacing: 2, display: 'block' as const,
    marginBottom: 5, textTransform: 'uppercase' as const,
  };
  const bulkInputStyle = {
    width: '100%', background: '#050507', border: '1px solid #2a2a3a',
    color: '#d4d4e0', padding: '9px 12px', fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  };

  return (
    <div>
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        onClick={pickFiles}
        style={{
          border: '2px dashed #2a2a3a', padding: '56px 40px', textAlign: 'center',
          cursor: 'pointer', marginBottom: 32, background: 'rgba(201,168,76,0.02)',
          transition: 'border-color 0.3s',
        }}
      >
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: '#5a5a6a', fontStyle: 'italic', margin: '0 0 10px' }}>
          Drop images or videos
        </p>
        <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#3a3a4a', letterSpacing: 3, margin: 0, textTransform: 'uppercase' }}>
          or click to select — no limit — image + video
        </p>
      </div>

      {items.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 40, alignItems: 'center', flexWrap: 'wrap' as const }}>
            {pendingCount > 0 && (
              <>
                <button
                  onClick={analyzeAll} disabled={processing}
                  style={{ padding: '11px 24px', background: 'transparent', border: '1px solid #c9a84c', color: '#c9a84c', cursor: processing ? 'not-allowed' : 'pointer', fontFamily: "'Courier Prime', monospace", fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', opacity: processing ? 0.6 : 1 }}
                >
                  {processing ? 'PROCESSING...' : `AI TAG ALL (${pendingCount})`}
                </button>
                <button
                  onClick={uploadAllSkipAI} disabled={processing}
                  style={{ padding: '11px 24px', background: 'transparent', border: '1px solid #3a3a4a', color: '#7a7a8a', cursor: processing ? 'not-allowed' : 'pointer', fontFamily: "'Courier Prime', monospace", fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', opacity: processing ? 0.6 : 1 }}
                >
                  {processing ? 'UPLOADING...' : `SKIP AI (${pendingCount})`}
                </button>
              </>
            )}
            {readyCount > 0 && (
              <button
                onClick={publishAllReady}
                style={{ padding: '11px 24px', background: '#c9a84c', border: 'none', color: '#050507', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase' }}
              >
                PUBLISH ALL READY ({readyCount})
              </button>
            )}
            {retryCount > 0 && (
              <button
                onClick={retryAllFailed} disabled={processing}
                style={{ padding: '11px 24px', background: 'transparent', border: '1px solid #4a8cf5', color: '#4a8cf5', cursor: processing ? 'not-allowed' : 'pointer', fontFamily: "'Courier Prime', monospace", fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', opacity: processing ? 0.6 : 1 }}
              >
                {processing ? 'RETRYING...' : `RETRY AI (${retryCount})`}
              </button>
            )}
            {publishedCount > 0 && (
              <button
                onClick={clearPublished}
                style={{ padding: '11px 24px', background: 'transparent', border: '1px solid #3a3a4a', color: '#5a5a6a', cursor: 'pointer', fontFamily: "'Courier Prime', monospace", fontSize: 12, letterSpacing: 3, textTransform: 'uppercase' }}
              >
                CLEAR PUBLISHED ({publishedCount})
              </button>
            )}
            <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#3a3a4a', letterSpacing: 2, marginLeft: 'auto', textTransform: 'uppercase' }}>
              {items.length} total &middot; {publishedCount} in vault
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  background: '#0a0a0f',
                  border: `1px solid ${item.status === 'error' ? '#3a1a1a' : item.status === 'published' ? '#1a1a1a' : '#1a1a2e'}`,
                  opacity: item.status === 'published' ? 0.45 : 1,
                  transition: 'opacity 0.4s',
                }}
              >
                <div style={{ position: 'relative' as const, height: 160, overflow: 'hidden' }}>
                  {fileIsVideo(item.file) ? (
                    <video
                      src={item.previewUrl}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      autoPlay muted loop playsInline
                    />
                  ) : (
                    <img src={item.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                  <div style={{ position: 'absolute', top: 8, right: 8, padding: '4px 9px', background: '#050507', fontFamily: "'Courier Prime', monospace", fontSize: 10, letterSpacing: 2, color: STATUS_COLOR[item.status], border: `1px solid ${STATUS_COLOR[item.status]}`, textTransform: 'uppercase' }}>
                    {item.status}
                  </div>
                  {fileIsVideo(item.file) && (
                    <div style={{ position: 'absolute', bottom: 8, left: 8, padding: '3px 8px', background: 'rgba(5,5,7,0.85)', fontFamily: "'Courier Prime', monospace", fontSize: 10, letterSpacing: 2, color: '#c9a84c', textTransform: 'uppercase' }}>
                      VIDEO
                    </div>
                  )}
                  <button
                    onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                    style={{ position: 'absolute', top: 8, left: 8, width: 24, height: 24, background: 'rgba(5,5,7,0.8)', border: '1px solid #3a3a4a', color: '#7a7a8a', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                  >
                    &times;
                  </button>
                  {(item.status === 'uploading' || item.status === 'analyzing' || item.status === 'publishing') && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#1a1a2e' }}>
                      <div style={{ height: '100%', width: '60%', background: '#c9a84c', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    </div>
                  )}
                </div>

                <div style={{ padding: '16px 18px' }}>
                  {item.errorMsg && (
                    <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: 11, color: item.errorMsg.includes('Tagged by') ? '#4caf87' : '#cf4c4c', letterSpacing: 2, margin: '0 0 12px', textTransform: 'uppercase' }}>
                      {item.errorMsg}
                    </p>
                  )}

                  {(['title', 'aesthetic_tags', 'mood_tags', 'origin_region'] as (keyof Meta)[]).map(field => (
                    <div key={field} style={{ marginBottom: 10 }}>
                      <label style={bulkLabelStyle}>{field.replace(/_/g, ' ')}</label>
                      <input
                        type="text"
                        value={item.meta[field]}
                        onChange={e => updateMeta(item.id, field, e.target.value)}
                        placeholder={item.status === 'pending' ? '—' : ''}
                        style={bulkInputStyle}
                      />
                    </div>
                  ))}

                  <div style={{ marginBottom: 14 }}>
                    <label style={bulkLabelStyle}>Tier</label>
                    <select
                      value={item.meta.tier_required}
                      onChange={e => updateMeta(item.id, 'tier_required', e.target.value)}
                      style={{ ...bulkInputStyle, cursor: 'pointer' }}
                    >
                      {TIERS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                    {(item.status === 'pending' || item.status === 'error') && (
                      <>
                        <button
                          onClick={() => processItem(item)}
                          style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #c9a84c', color: '#c9a84c', cursor: 'pointer', fontFamily: "'Courier Prime', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}
                        >
                          AI TAG
                        </button>
                        <button
                          onClick={() => uploadOnly(item)}
                          style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #3a3a4a', color: '#7a7a8a', cursor: 'pointer', fontFamily: "'Courier Prime', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}
                        >
                          SKIP AI
                        </button>
                      </>
                    )}
                    {item.status === 'ready' && (
                      <>
                        {(item.errorMsg === 'Fields blank — fill manually' ||
                          item.errorMsg === 'Skipped AI — fill fields manually') && (
                          <button
                            onClick={() => retryAI(item)}
                            style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #4a8cf5', color: '#4a8cf5', cursor: 'pointer', fontFamily: "'Courier Prime', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}
                          >
                            RETRY AI
                          </button>
                        )}
                        <button
                          onClick={() => publishItem(item.id)}
                          style={{ flex: 1, padding: '10px', background: '#c9a84c', border: 'none', color: '#050507', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}
                        >
                          PUBLISH
                        </button>
                      </>
                    )}
                    {item.status === 'published' && (
                      <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#4caf87', letterSpacing: 2, textTransform: 'uppercase' }}>
                        IN THE VAULT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <style>{`@keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:1 } }`}</style>
        </>
      )}
    </div>
  );
}
