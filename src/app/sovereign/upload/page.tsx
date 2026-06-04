'use client'
import { useState, useCallback, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

type Stage = 'gate' | 'drop' | 'uploading' | 'analyzing' | 'review' | 'publishing' | 'done'

type AssetMeta = {
  title: string
  description: string
  aesthetic_tags: string[]
  mood_tags: string[]
  origin_region: string
  era: string
  asset_type: string
  tier_required: string
  cloudinary_url: string
  thumbnail_url: string
  cloudinary_public_id: string
  is_featured: boolean
  is_sovereign_marked: boolean
}

const EMPTY_META: AssetMeta = {
  title: '', description: '', aesthetic_tags: [], mood_tags: [],
  origin_region: '', era: '2020s', asset_type: 'image',
  tier_required: 'access', cloudinary_url: '', thumbnail_url: '',
  cloudinary_public_id: '', is_featured: false, is_sovereign_marked: false,
}

const TIER_COLORS: Record<string, string> = {
  access: '90,90,106',
  noir: '201,168,76',
  prestige: '139,92,246',
  obsidian: '13,148,136',
}

export default function SovereignUploadPage() {
  const [stage, setStage] = useState<Stage>('gate')
  const [key, setKey] = useState('')
  const [meta, setMeta] = useState<AssetMeta>(EMPTY_META)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [published, setPublished] = useState<{ id: string; title: string }[]>([])
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ─── AUTHENTICATE ───────────────────────────────────────────
  function authenticate() {
    const expected = process.env.NEXT_PUBLIC_OBSIDIAN_KEY
    const valid = !expected ? key.trim().length > 8 : key === expected
    if (valid) { setStage('drop'); return }
    setError('Key rejected.')
    setTimeout(() => setError(''), 2000)
  }

  // ─── UPLOAD TO CLOUDINARY ────────────────────────────────────
  async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !preset) {
      throw new Error('Cloudinary env vars not set. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to Vercel.')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', preset)
    formData.append('folder', 'umbra')

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    )

    if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`)
    const data = await res.json()

    return {
      url: data.secure_url,
      publicId: data.public_id,
    }
  }

  // ─── ANALYZE WITH AI ─────────────────────────────────────────
  async function analyzeImage(url: string): Promise<Partial<AssetMeta>> {
    const res = await fetch('/api/analyze-asset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (!res.ok) throw new Error('AI analysis failed')
    const { metadata, error: apiError } = await res.json()
    if (apiError) throw new Error(apiError)
    return metadata
  }

  // ─── PROCESS FILE ────────────────────────────────────────────
  async function processFile(file: File) {
    setError('')

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Stage 1: Upload
    setStage('uploading')
    let cloudinaryUrl = ''
    let publicId = ''
    let thumbUrl = ''

    try {
      const { url, publicId: pid } = await uploadToCloudinary(file)
      cloudinaryUrl = url
      publicId = pid
      thumbUrl = url.replace('/upload/', '/upload/w_400,q_80/')
    } catch (e) {
      setError(String(e))
      setStage('drop')
      return
    }

    // Stage 2: AI Analysis
    setStage('analyzing')
    let aiMeta: Partial<AssetMeta> = {}

    try {
      aiMeta = await analyzeImage(cloudinaryUrl)
    } catch {
      // If AI fails, still proceed to review — let user fill manually
      aiMeta = {}
    }

    // Merge
    setMeta({
      ...EMPTY_META,
      ...aiMeta,
      cloudinary_url: cloudinaryUrl,
      thumbnail_url: thumbUrl,
      cloudinary_public_id: publicId,
    })

    setStage('review')
  }

  // ─── DROP HANDLERS ───────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) processFile(file)
  }, [])

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  // ─── PUBLISH ─────────────────────────────────────────────────
  async function publish() {
    if (!meta.title || !meta.cloudinary_url) return
    setStage('publishing')

    const { data, error: dbError } = await supabase.from('assets').insert([{
      title: meta.title,
      description: meta.description,
      cloudinary_url: meta.cloudinary_url,
      thumbnail_url: meta.thumbnail_url,
      cloudinary_public_id: meta.cloudinary_public_id,
      asset_type: meta.asset_type,
      aesthetic_tags: meta.aesthetic_tags,
      mood_tags: meta.mood_tags,
      origin_region: meta.origin_region,
      era: meta.era,
      tier_required: meta.tier_required,
      is_featured: meta.is_featured,
      is_sovereign_marked: meta.is_sovereign_marked,
      license: 'cc0',
      status: 'active',
      view_count: 0,
      download_count: 0,
      vintage_score: 0,
    }]).select('id, title').single()

    if (dbError) {
      setError(dbError.message)
      setStage('review')
      return
    }

    setPublished(p => [{ id: data.id, title: data.title }, ...p])
    setStage('done')
  }

  function reset() {
    setMeta(EMPTY_META)
    setPreview('')
    setError('')
    setStage('drop')
    if (fileRef.current) fileRef.current.value = ''
  }

  function toggleTag(field: 'aesthetic_tags' | 'mood_tags', tag: string) {
    setMeta(m => ({
      ...m,
      [field]: m[field].includes(tag)
        ? m[field].filter(t => t !== tag)
        : [...m[field], tag]
    }))
  }

  // ─── STYLES ──────────────────────────────────────────────────
  const root: React.CSSProperties = {
    background: '#050507', minHeight: '100vh', color: '#d4d4e0',
    fontFamily: "'DM Sans', sans-serif", fontWeight: 300,
  }

  // ─── RENDER: KEY GATE ─────────────────────────────────────────
  if (stage === 'gate') return (
    <div style={{ ...root, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Courier+Prime:wght@400;700&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet" />
      <p style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 8, color: '#8a6f33', textTransform: 'uppercase', marginBottom: 40 }}>Sovereign Access</p>
      <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 52, fontWeight: 900, color: 'transparent', background: 'linear-gradient(135deg,#c9a84c,#f0d990 40%,#8a6f33)', WebkitBackgroundClip: 'text', backgroundClip: 'text', marginBottom: 52, letterSpacing: 8 }}>UMBRA</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 340 }}>
        <input type="password" placeholder="Obsidian Key" value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && authenticate()}
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.15)', color: '#d4d4e0', padding: '14px 20px', fontSize: 13, fontFamily: "'Courier Prime',monospace", letterSpacing: 3, outline: 'none', textAlign: 'center' }} />
        <button onClick={authenticate}
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.35)', color: '#c9a84c', padding: '13px', fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 6, textTransform: 'uppercase', cursor: 'pointer' }}>
          Enter
        </button>
        {error && <p style={{ color: '#e57373', fontFamily: "'Courier Prime',monospace", fontSize: 11, textAlign: 'center', letterSpacing: 2 }}>{error}</p>}
      </div>
    </div>
  )

  // ─── RENDER: DROP ZONE ────────────────────────────────────────
  if (stage === 'drop') return (
    <div style={root}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;1,300&family=Courier+Prime:wght@400;700&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet" />
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 56, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 700, color: '#c9a84c', letterSpacing: 5 }}>UMBRA</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/browse" style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#3a3a4a', textDecoration: 'none', textTransform: 'uppercase' }}>Vault</Link>
          <button onClick={() => setStage('gate')} style={{ background: 'none', border: 'none', fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#3a3a4a', cursor: 'pointer', textTransform: 'uppercase' }}>Lock</button>
        </div>
      </nav>

      <div style={{ maxWidth: 700, margin: '80px auto', padding: '0 40px' }}>
        <p style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 7, color: '#8a6f33', textTransform: 'uppercase', marginBottom: 12 }}>AI Archive</p>
        <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 28, fontWeight: 700, color: '#d4d4e0', marginBottom: 8 }}>Drop a file. AI does the rest.</h1>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: 'italic', color: '#5a5a6a', marginBottom: 56 }}>Upload, analyze, publish — three breaths.</p>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.06)'}`,
            background: dragging ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.01)',
            borderRadius: 2, padding: '80px 40px', cursor: 'pointer', textAlign: 'center',
            transition: 'all 0.3s',
          }}>
          <div style={{ fontSize: 40, marginBottom: 20, opacity: 0.3 }}>&#8593;</div>
          <p style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: dragging ? '#c9a84c' : '#5a5a6a', letterSpacing: 4, marginBottom: 8, textTransform: 'uppercase' }}>
            {dragging ? 'Release to upload' : 'Drop image here'}
          </p>
          <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, color: '#3a3a4a', letterSpacing: 2 }}>or click to browse</p>
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={onFileSelect} style={{ display: 'none' }} />

        {published.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase', marginBottom: 12 }}>Session</p>
            {published.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '10px 0' }}>
                <span style={{ fontSize: 13, color: '#9a9aaa' }}>{p.title}</span>
                <Link href={`/asset/${p.id}`} style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#8a6f33', textDecoration: 'none', textTransform: 'uppercase' }}>View</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // ─── RENDER: LOADING STATES ──────────────────────────────────
  if (stage === 'uploading' || stage === 'analyzing' || stage === 'publishing') return (
    <div style={{ ...root, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Courier+Prime:wght@400&display=swap" rel="stylesheet" />
      {preview && (
        <div style={{ width: 120, height: 160, overflow: 'hidden', filter: 'brightness(0.5)' }}>
          <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        </div>
      )}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 5, color: '#8a6f33', textTransform: 'uppercase', marginBottom: 12 }}>
          {stage === 'uploading' && 'Uploading to vault...'}
          {stage === 'analyzing' && 'UMBRA AI is reading the image...'}
          {stage === 'publishing' && 'Publishing to vault...'}
        </p>
        <p style={{ fontFamily: "'Cinzel',serif", fontSize: 18, color: 'rgba(201,168,76,0.3)', letterSpacing: 4 }}>
          {stage === 'uploading' && 'Transfer'}
          {stage === 'analyzing' && 'Analysis'}
          {stage === 'publishing' && 'Commit'}
        </p>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.8}}.pulse{animation:pulse 1.5s ease-in-out infinite}`}</style>
      <div className="pulse" style={{ width: 1, height: 48, background: 'linear-gradient(to bottom,transparent,#c9a84c,transparent)' }} />
    </div>
  )

  // ─── RENDER: DONE ─────────────────────────────────────────────
  if (stage === 'done') return (
    <div style={{ ...root, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Courier+Prime:wght@400&family=Cormorant+Garamond:ital,wght@1,300&display=swap" rel="stylesheet" />
      {preview && (
        <div style={{ width: 100, height: 130, overflow: 'hidden' }}>
          <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        </div>
      )}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Cinzel',serif", fontSize: 20, color: '#c9a84c', letterSpacing: 4, marginBottom: 8 }}>{meta.title}</p>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: 'italic', color: '#5a5a6a', marginBottom: 32 }}>The vault holds it now.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {published[0] && (
            <Link href={`/asset/${published[0].id}`}
              style={{ padding: '10px 24px', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, textDecoration: 'none', textTransform: 'uppercase' }}>
              View Asset
            </Link>
          )}
          <button onClick={reset}
            style={{ padding: '10px 24px', border: '1px solid rgba(255,255,255,0.06)', color: '#5a5a6a', fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, background: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
            Upload Another
          </button>
        </div>
      </div>
    </div>
  )

  // ─── RENDER: REVIEW FORM ─────────────────────────────────────
  const AESTHETICS = ['Dark Luxury','Quiet Architecture','Raw Documentary','Industrial Pastoral','Sacred Geometry','Neon Noir','Cinematic Decay','East African Light','Urban Pulse','Brutalist Memory','Mediterranean Texture','Wilderness Sublime']
  const MOODS = ['Golden Hour','Blue Hour','Nocturnal','Dusk','Dawn','Electric','Silence','Sacred','Decay','Rain','Gold','Stone','Mist','Fire','Amber','Void']
  const REGIONS = ['East Africa','West Africa','North Africa','East Asia','South Asia','Southeast Asia','Middle East','Caucasus','Mediterranean','Caribbean','South America','North America','Japan','Oceania','Central Asia','Nordic','Eastern Europe']

  return (
    <div style={root}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;1,300&family=Courier+Prime:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 56, background: 'rgba(5,5,7,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 700, color: '#c9a84c', letterSpacing: 5 }}>UMBRA</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <button onClick={reset} style={{ background: 'none', border: 'none', fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#5a5a6a', cursor: 'pointer', textTransform: 'uppercase' }}>New Upload</button>
          <Link href="/browse" style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#3a3a4a', textDecoration: 'none', textTransform: 'uppercase' }}>Vault</Link>
        </div>
      </nav>

      {error && (
        <div style={{ background: 'rgba(139,26,26,0.08)', borderBottom: '1px solid rgba(139,26,26,0.2)', padding: '12px 40px', fontSize: 12, color: '#e57373', fontFamily: "'Courier Prime',monospace" }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: 'calc(100vh - 56px)' }}>

        {/* LEFT — IMAGE PREVIEW */}
        <div style={{ position: 'sticky', top: 56, height: 'calc(100vh - 56px)', overflow: 'hidden', background: '#030305' }}>
          {preview && <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65)' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(5,5,7,0.9) 0%,transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: 24, left: 20, right: 20 }}>
            {meta.tier_required && (
              <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 3, padding: '3px 10px', border: `1px solid rgba(${TIER_COLORS[meta.tier_required]},0.4)`, color: `rgb(${TIER_COLORS[meta.tier_required]})`, textTransform: 'uppercase', marginBottom: 8, display: 'inline-block' }}>
                {meta.tier_required}
              </span>
            )}
            <p style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: 'rgba(212,212,224,0.8)', letterSpacing: 1, lineHeight: 1.5 }}>{meta.title || 'Untitled'}</p>
          </div>
        </div>

        {/* RIGHT — FORM */}
        <div style={{ padding: '40px 48px 80px', overflowY: 'auto' }}>

          {/* AI BADGE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#13d498' }} />
            <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#13d498', textTransform: 'uppercase' }}>AI analysis complete — review and publish</p>
          </div>

          {/* TITLE */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Title</label>
            <input value={meta.title} onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#d4d4e0', padding: '12px 16px', fontSize: 16, fontFamily: "'Cinzel',serif", outline: 'none', letterSpacing: 1 }} />
          </div>

          {/* DESCRIPTION */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Description</label>
            <textarea value={meta.description} onChange={e => setMeta(m => ({ ...m, description: e.target.value }))} rows={2}
              style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#d4d4e0', padding: '12px 16px', fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', outline: 'none', resize: 'none', lineHeight: 1.7 }} />
          </div>

          {/* AESTHETICS */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Aesthetic {meta.aesthetic_tags.length > 0 && <span style={{ color: '#c9a84c', marginLeft: 8 }}>{meta.aesthetic_tags.join(', ')}</span>}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {AESTHETICS.map(a => (
                <button key={a} onClick={() => toggleTag('aesthetic_tags', a)}
                  style={{ fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 1.5, padding: '5px 12px', border: `1px solid ${meta.aesthetic_tags.includes(a) ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.05)'}`, background: meta.aesthetic_tags.includes(a) ? 'rgba(201,168,76,0.08)' : 'none', color: meta.aesthetic_tags.includes(a) ? '#c9a84c' : '#4a4a5a', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.15s' }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* MOODS */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Mood {meta.mood_tags.length > 0 && <span style={{ color: 'rgba(201,168,76,0.6)', marginLeft: 8 }}>{meta.mood_tags.join(', ')}</span>}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {MOODS.map(m => (
                <button key={m} onClick={() => toggleTag('mood_tags', m)}
                  style={{ fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 1.5, padding: '4px 10px', border: `1px solid ${meta.mood_tags.includes(m) ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.04)'}`, background: meta.mood_tags.includes(m) ? 'rgba(201,168,76,0.06)' : 'none', color: meta.mood_tags.includes(m) ? 'rgba(201,168,76,0.7)' : '#3a3a4a', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.15s' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* ROW: REGION + ERA + TIER */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 12, marginBottom: 32 }}>
            <div>
              <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Region</label>
              <select value={meta.origin_region} onChange={e => setMeta(m => ({ ...m, origin_region: e.target.value }))}
                style={{ width: '100%', background: '#050507', border: '1px solid rgba(255,255,255,0.06)', color: '#9a9aaa', padding: '10px 12px', fontSize: 12, fontFamily: "'DM Sans',sans-serif", outline: 'none' }}>
                <option value="">Select</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Era</label>
              <select value={meta.era} onChange={e => setMeta(m => ({ ...m, era: e.target.value }))}
                style={{ width: '100%', background: '#050507', border: '1px solid rgba(255,255,255,0.06)', color: '#9a9aaa', padding: '10px 12px', fontSize: 12, fontFamily: "'DM Sans',sans-serif", outline: 'none' }}>
                {['1970s','1980s','1990s','2000s','2010s','2020s'].map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Tier</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { id: 'access', label: 'SHADOW' },
                  { id: 'noir', label: 'NOIR' },
                  { id: 'prestige', label: 'PRESTIGE' },
                  { id: 'obsidian', label: 'OBSIDIAN' },
                ].map(t => (
                  <button key={t.id} onClick={() => setMeta(m => ({ ...m, tier_required: t.id }))}
                    style={{ padding: '6px 10px', fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', border: `1px solid ${meta.tier_required === t.id ? `rgba(${TIER_COLORS[t.id]},0.5)` : 'rgba(255,255,255,0.04)'}`, background: meta.tier_required === t.id ? `rgba(${TIER_COLORS[t.id]},0.08)` : 'none', color: meta.tier_required === t.id ? `rgb(${TIER_COLORS[t.id]})` : '#3a3a4a', cursor: 'pointer', textAlign: 'left' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FEATURED TOGGLE */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
            <button onClick={() => setMeta(m => ({ ...m, is_featured: !m.is_featured }))}
              style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, padding: '6px 16px', border: `1px solid ${meta.is_featured ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.05)'}`, background: meta.is_featured ? 'rgba(201,168,76,0.08)' : 'none', color: meta.is_featured ? '#c9a84c' : '#3a3a4a', cursor: 'pointer', textTransform: 'uppercase' }}>
              {meta.is_featured ? 'Featured' : 'Not Featured'}
            </button>
            <button onClick={() => setMeta(m => ({ ...m, is_sovereign_marked: !m.is_sovereign_marked }))}
              style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, padding: '6px 16px', border: `1px solid ${meta.is_sovereign_marked ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.05)'}`, background: meta.is_sovereign_marked ? 'rgba(201,168,76,0.08)' : 'none', color: meta.is_sovereign_marked ? '#c9a84c' : '#3a3a4a', cursor: 'pointer', textTransform: 'uppercase' }}>
              {meta.is_sovereign_marked ? 'Sovereign Mark' : 'No Mark'}
            </button>
          </div>

          {/* PUBLISH */}
          <button onClick={publish}
            disabled={!meta.title || !meta.cloudinary_url}
            style={{ width: '100%', padding: '18px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: '#c9a84c', fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 6, textTransform: 'uppercase', cursor: 'pointer', opacity: (!meta.title || !meta.cloudinary_url) ? 0.4 : 1, transition: 'background 0.3s' }}
            onMouseEnter={e => { if (meta.title && meta.cloudinary_url) e.currentTarget.style.background = 'rgba(201,168,76,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.1)' }}>
            Publish to Vault
          </button>
        </div>
      </div>
    </div>
  )
}
