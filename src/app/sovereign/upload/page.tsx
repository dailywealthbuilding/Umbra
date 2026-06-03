'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const AESTHETICS = [
  'Dark Luxury', 'Quiet Architecture', 'Raw Documentary',
  'Industrial Pastoral', 'Sacred Geometry', 'Neon Noir',
  'Cinematic Decay', 'East African Light', 'Urban Pulse',
  'Brutalist Memory', 'Mediterranean Texture', 'Wilderness Sublime',
  'Sacred Ritual', 'Islamic Light', 'Nordic Silence',
]

const MOODS = [
  'Golden Hour', 'Blue Hour', 'Nocturnal', 'Dusk', 'Dawn',
  'Electric', 'Silence', 'Sacred', 'Decay', 'Rain',
  'Gold', 'Stone', 'Mist', 'Fire', 'Amber', 'Void',
]

const REGIONS = [
  'East Africa', 'West Africa', 'North Africa', 'East Asia', 'South Asia',
  'Southeast Asia', 'Middle East', 'Caucasus', 'Europe', 'Caribbean',
  'South America', 'North America', 'Japan', 'Oceania', 'Central Asia',
]

type FormState = {
  title: string
  description: string
  cloudinary_url: string
  thumbnail_url: string
  cloudinary_public_id: string
  asset_type: string
  aesthetic_tags: string[]
  mood_tags: string[]
  origin_region: string
  era: string
  tier_required: string
  license: string
  is_featured: boolean
  is_sovereign_marked: boolean
  sovereign_note: string
}

const EMPTY: FormState = {
  title: '', description: '', cloudinary_url: '', thumbnail_url: '',
  cloudinary_public_id: '', asset_type: 'image',
  aesthetic_tags: [], mood_tags: [], origin_region: '',
  era: '2020s', tier_required: 'access', license: 'cc0',
  is_featured: false, is_sovereign_marked: false, sovereign_note: '',
}

export default function SovereignUploadPage() {
  const [key, setKey] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [status, setStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [published, setPublished] = useState<{ id: string; title: string }[]>([])
  const [preview, setPreview] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  function authenticate() {
    const expected = process.env.NEXT_PUBLIC_OBSIDIAN_KEY
    if (!expected) {
      // If no env var, accept any non-empty key for development
      if (key.trim().length > 8) { setAuthenticated(true); return }
    }
    if (key === expected) { setAuthenticated(true); return }
    alert('Key rejected.')
  }

  function toggleTag(list: 'aesthetic_tags' | 'mood_tags', tag: string) {
    setForm(f => {
      const current = f[list]
      return { ...f, [list]: current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag] }
    })
  }

  // Auto-generate thumbnail from Cloudinary URL
  function handleUrlChange(url: string) {
    setForm(f => {
      const thumb = url.includes('cloudinary.com')
        ? url.replace('/upload/', '/upload/w_400,q_80/')
        : url + '?w=400'
      const pid = url.split('/upload/')[1]?.split('?')[0] || ''
      return { ...f, cloudinary_url: url, thumbnail_url: thumb, cloudinary_public_id: pid }
    })
  }

  async function publish() {
    if (!form.title || !form.cloudinary_url) {
      setErrorMsg('Title and URL are required.')
      return
    }
    setStatus('publishing')
    setErrorMsg('')
    const { data, error } = await supabase.from('assets').insert([{
      ...form,
      status: 'active',
      view_count: 0,
      download_count: 0,
      vintage_score: 0,
    }]).select('id, title').single()

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
      return
    }
    setPublished(p => [{ id: data.id, title: data.title }, ...p])
    setStatus('success')
    setForm(EMPTY)
    setTimeout(() => setStatus('idle'), 3000)
  }

  if (!authenticated) return (
    <div style={{ background: '#050507', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Courier+Prime:wght@400;700&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet" />
      <p style={{ fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 8, color: '#8a6f33', textTransform: 'uppercase', marginBottom: 48 }}>Sovereign Access</p>
      <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 48, fontWeight: 900, color: 'transparent', background: 'linear-gradient(135deg,#c9a84c,#f0d990 40%,#8a6f33)', WebkitBackgroundClip: 'text', backgroundClip: 'text', marginBottom: 56 }}>UMBRA</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 360 }}>
        <input
          type="password"
          placeholder="Enter Obsidian Key"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && authenticate()}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.2)', color: '#d4d4e0', padding: '14px 18px', fontSize: 13, fontFamily: "'Courier Prime',monospace", letterSpacing: 2, outline: 'none', textAlign: 'center' }}
        />
        <button
          onClick={authenticate}
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: '#c9a84c', padding: '14px 24px', fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', cursor: 'pointer' }}
        >
          Enter
        </button>
      </div>
      <Link href="/" style={{ marginTop: 48, fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: 4, color: '#3a3a4a', textDecoration: 'none', textTransform: 'uppercase' }}>
        Return to Vault
      </Link>
    </div>
  )

  return (
    <div style={{ background: '#050507', minHeight: '100vh', color: '#d4d4e0', fontFamily: "'DM Sans',sans-serif", fontWeight: 300 }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Courier+Prime:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,7,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,168,76,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 58 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontFamily: "'Cinzel',serif", fontSize: 16, fontWeight: 700, color: '#c9a84c', letterSpacing: 4 }}>UMBRA</span>
          <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase', border: '1px solid rgba(201,168,76,0.2)', padding: '3px 10px' }}>Sovereign Panel</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/browse" style={{ fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: 3, color: '#5a5a6a', textDecoration: 'none', textTransform: 'uppercase' }}>View Vault</Link>
          <button onClick={() => setAuthenticated(false)} style={{ background: 'none', border: 'none', fontFamily: "'Courier Prime',monospace", fontSize: 10, letterSpacing: 3, color: '#5a5a6a', cursor: 'pointer', textTransform: 'uppercase' }}>Lock</button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '56px 40px 100px' }}>

        {/* HEADER */}
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 7, color: '#8a6f33', textTransform: 'uppercase', marginBottom: 12 }}>Publish to the Vault</p>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 32, fontWeight: 700, color: '#d4d4e0', marginBottom: 8 }}>New Asset</h1>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontStyle: 'italic', color: '#5a5a6a' }}>What the vault receives, it holds forever.</p>
        </div>

        {/* SUCCESS BANNER */}
        {status === 'success' && (
          <div style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.3)', padding: '16px 24px', marginBottom: 32, fontFamily: "'Courier Prime',monospace", fontSize: 11, color: 'rgb(13,148,136)', letterSpacing: 2 }}>
            Asset published to the vault. It is live now.
          </div>
        )}
        {status === 'error' && (
          <div style={{ background: 'rgba(139,26,26,0.1)', border: '1px solid rgba(139,26,26,0.3)', padding: '16px 24px', marginBottom: 32, fontSize: 12, color: '#e57373' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 3 }}>

          {/* FORM */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* TITLE */}
            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', padding: '20px 24px' }}>
              <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Lagos Blue Hour"
                style={{ width: '100%', background: 'none', border: 'none', color: '#d4d4e0', fontSize: 18, fontFamily: "'Cinzel',serif", outline: 'none', letterSpacing: 1 }} />
            </div>

            {/* DESCRIPTION */}
            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', padding: '20px 24px' }}>
              <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Atmospheric Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="One sentence. The feeling the piece holds."
                rows={2}
                style={{ width: '100%', background: 'none', border: 'none', color: '#d4d4e0', fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', outline: 'none', resize: 'none', lineHeight: 1.7 }} />
            </div>

            {/* CLOUDINARY URL */}
            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', padding: '20px 24px' }}>
              <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Cloudinary URL
                <span style={{ marginLeft: 12, color: '#3a3a4a' }}>Thumbnail auto-generated</span>
              </label>
              <input value={form.cloudinary_url} onChange={e => handleUrlChange(e.target.value)}
                placeholder="https://res.cloudinary.com/your-cloud/image/upload/v123/umbra/filename.jpg"
                style={{ width: '100%', background: 'none', border: 'none', color: '#9a9aaa', fontSize: 12, fontFamily: "'Courier Prime',monospace", outline: 'none', letterSpacing: 0.5 }} />
              {form.thumbnail_url && (
                <p style={{ marginTop: 8, fontFamily: "'Courier Prime',monospace", fontSize: 9, color: '#5a5a6a', letterSpacing: 1 }}>
                  Thumb: {form.thumbnail_url.slice(0, 60)}...
                </p>
              )}
            </div>

            {/* AESTHETICS */}
            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', padding: '20px 24px' }}>
              <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>
                Aesthetic Family {form.aesthetic_tags.length > 0 && <span style={{ color: '#c9a84c', marginLeft: 8 }}>{form.aesthetic_tags.length} selected</span>}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {AESTHETICS.map(a => (
                  <button key={a} onClick={() => toggleTag('aesthetic_tags', a)}
                    style={{ fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 2, padding: '5px 12px', border: `1px solid ${form.aesthetic_tags.includes(a) ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.06)'}`, background: form.aesthetic_tags.includes(a) ? 'rgba(201,168,76,0.1)' : 'none', color: form.aesthetic_tags.includes(a) ? '#c9a84c' : '#5a5a6a', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* MOODS */}
            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', padding: '20px 24px' }}>
              <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>
                Mood Tags {form.mood_tags.length > 0 && <span style={{ color: '#c9a84c', marginLeft: 8 }}>{form.mood_tags.length} selected</span>}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {MOODS.map(m => (
                  <button key={m} onClick={() => toggleTag('mood_tags', m)}
                    style={{ fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 2, padding: '5px 12px', border: `1px solid ${form.mood_tags.includes(m) ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.04)'}`, background: form.mood_tags.includes(m) ? 'rgba(201,168,76,0.07)' : 'none', color: form.mood_tags.includes(m) ? 'rgba(201,168,76,0.7)' : '#3a3a4a', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.2s' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* SOVEREIGN NOTE */}
            <div style={{ background: 'rgba(201,168,76,0.03)', border: '1px solid rgba(201,168,76,0.08)', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 4, color: '#8a6f33', textTransform: 'uppercase' }}>Sovereign Mark</label>
                <button onClick={() => setForm(f => ({ ...f, is_sovereign_marked: !f.is_sovereign_marked }))}
                  style={{ fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 2, padding: '3px 10px', border: `1px solid ${form.is_sovereign_marked ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.06)'}`, background: form.is_sovereign_marked ? 'rgba(201,168,76,0.1)' : 'none', color: form.is_sovereign_marked ? '#c9a84c' : '#3a3a4a', cursor: 'pointer', textTransform: 'uppercase' }}>
                  {form.is_sovereign_marked ? 'Marked' : 'Not marked'}
                </button>
              </div>
              {form.is_sovereign_marked && (
                <textarea value={form.sovereign_note} onChange={e => setForm(f => ({ ...f, sovereign_note: e.target.value }))}
                  placeholder="The Sovereign's private note on why this piece matters..."
                  rows={2}
                  style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(212,212,224,0.6)', fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', outline: 'none', resize: 'none', lineHeight: 1.7 }} />
              )}
            </div>
          </div>

          {/* RIGHT PANEL — SETTINGS + PUBLISH */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* PREVIEW */}
            {form.cloudinary_url && (
              <div style={{ position: 'relative', background: '#030305', aspectRatio: '3/4', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setPreview(!preview)}>
                <img src={form.thumbnail_url || form.cloudinary_url} alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} />
                <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                  <p style={{ fontFamily: "'Cinzel',serif", fontSize: 12, color: 'rgba(212,212,224,0.8)', letterSpacing: 1, marginBottom: 4 }}>{form.title || 'Untitled'}</p>
                  {form.origin_region && <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 8, letterSpacing: 3, color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase' }}>{form.origin_region}</p>}
                </div>
              </div>
            )}

            {/* SETTINGS */}
            <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* REGION */}
              <div>
                <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Region</label>
                <select value={form.origin_region} onChange={e => setForm(f => ({ ...f, origin_region: e.target.value }))}
                  style={{ width: '100%', background: '#050507', border: '1px solid rgba(255,255,255,0.06)', color: '#9a9aaa', padding: '8px 12px', fontSize: 12, fontFamily: "'DM Sans',sans-serif", outline: 'none' }}>
                  <option value="">Select region</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* ERA */}
              <div>
                <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Era</label>
                <select value={form.era} onChange={e => setForm(f => ({ ...f, era: e.target.value }))}
                  style={{ width: '100%', background: '#050507', border: '1px solid rgba(255,255,255,0.06)', color: '#9a9aaa', padding: '8px 12px', fontSize: 12, fontFamily: "'DM Sans',sans-serif", outline: 'none' }}>
                  {['1970s','1980s','1990s','2000s','2010s','2020s'].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* TYPE */}
              <div>
                <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Type</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['image', 'video'].map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, asset_type: t }))}
                      style={{ flex: 1, padding: '8px', fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', border: `1px solid ${form.asset_type === t ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.06)'}`, background: form.asset_type === t ? 'rgba(201,168,76,0.1)' : 'none', color: form.asset_type === t ? '#c9a84c' : '#5a5a6a', cursor: 'pointer' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* TIER */}
              <div>
                <label style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#8a6f33', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Access Tier</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { id: 'access', label: 'SHADOW', color: '90,90,106' },
                    { id: 'noir', label: 'NOIR', color: '201,168,76' },
                    { id: 'prestige', label: 'PRESTIGE', color: '139,92,246' },
                    { id: 'obsidian', label: 'OBSIDIAN', color: '13,148,136' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setForm(f => ({ ...f, tier_required: t.id }))}
                      style={{ padding: '8px 12px', fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', border: `1px solid ${form.tier_required === t.id ? `rgba(${t.color},0.5)` : 'rgba(255,255,255,0.04)'}`, background: form.tier_required === t.id ? `rgba(${t.color},0.08)` : 'none', color: form.tier_required === t.id ? `rgb(${t.color})` : '#3a3a4a', cursor: 'pointer', textAlign: 'left' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FEATURED */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: '#8a6f33', textTransform: 'uppercase' }}>Featured</span>
                <button onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
                  style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 2, padding: '4px 12px', border: `1px solid ${form.is_featured ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.06)'}`, background: form.is_featured ? 'rgba(201,168,76,0.1)' : 'none', color: form.is_featured ? '#c9a84c' : '#3a3a4a', cursor: 'pointer', textTransform: 'uppercase' }}>
                  {form.is_featured ? 'Yes' : 'No'}
                </button>
              </div>
            </div>

            {/* PUBLISH BUTTON */}
            <button
              onClick={publish}
              disabled={status === 'publishing' || !form.title || !form.cloudinary_url}
              style={{ padding: '20px 24px', background: status === 'publishing' ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.45)', color: '#c9a84c', fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s', opacity: (!form.title || !form.cloudinary_url) ? 0.4 : 1 }}
              onMouseEnter={e => { if (form.title && form.cloudinary_url) e.currentTarget.style.background = 'rgba(201,168,76,0.22)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.12)' }}
            >
              {status === 'publishing' ? 'Publishing...' : 'Publish to Vault'}
            </button>
          </div>
        </div>

        {/* RECENTLY PUBLISHED */}
        {published.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <p style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 5, color: '#8a6f33', textTransform: 'uppercase', marginBottom: 16 }}>Published This Session</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {published.map(p => (
                <div key={p.id} style={{ background: 'rgba(13,148,136,0.04)', border: '1px solid rgba(13,148,136,0.1)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#d4d4e0' }}>{p.title}</span>
                  <Link href={`/asset/${p.id}`} style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9, letterSpacing: 3, color: 'rgb(13,148,136)', textDecoration: 'none', textTransform: 'uppercase' }}>
                    View &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
