'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false) }
    else { router.push('/browse'); router.refresh() }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'transparent', border: 'none',
    borderBottom: '1px solid rgba(201,168,76,.2)',
    color: 'rgba(220,215,200,.9)', fontSize: '13px', letterSpacing: '2px',
    padding: '12px 0', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Courier Prime', monospace",
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier Prime', monospace" }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '48px 40px', border: '1px solid rgba(201,168,76,.1)', background: 'rgba(201,168,76,.015)' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '22px', letterSpacing: '8px', color: 'rgba(201,168,76,.9)', fontWeight: 400, margin: '0 0 10px' }}>UMBRA</h1>
          <p style={{ fontSize: '10px', letterSpacing: '5px', color: 'rgba(180,180,205,.3)', margin: 0 }}>ENTER THE SHADOW</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <input type="email" placeholder="email" value={email}
              onChange={e => setEmail(e.target.value)} required style={inp} />
          </div>
          <div style={{ marginBottom: '36px' }}>
            <input type="password" placeholder="password" value={password}
              onChange={e => setPassword(e.target.value)} required style={inp} />
          </div>
          {error && <p style={{ color: 'rgba(220,80,80,.8)', fontSize: '11px', letterSpacing: '1px', marginBottom: '20px' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{
            width: '100%', background: 'transparent', border: '1px solid rgba(201,168,76,.35)',
            color: 'rgba(201,168,76,.8)', fontSize: '10px', letterSpacing: '5px', padding: '14px',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
            fontFamily: "'Courier Prime', monospace", transition: 'all .3s',
          }}>{loading ? '...' : 'ENTER'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '10px', letterSpacing: '2px', color: 'rgba(180,180,205,.3)' }}>
          No account.{' '}
          <Link href="/auth/signup" style={{ color: 'rgba(201,168,76,.5)', textDecoration: 'none' }}>REQUEST ACCESS</Link>
        </p>
      </div>
    </div>
  )
}
