'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function SignupPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus]     = useState<Status>('idle')
  const [error, setError]       = useState('')

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
    })
    if (authError) { setError(authError.message); setStatus('error') }
    else { setStatus('done') }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'transparent', border: 'none',
    borderBottom: '1px solid rgba(201,168,76,.2)',
    color: 'rgba(220,215,200,.9)', fontSize: '13px', letterSpacing: '2px',
    padding: '12px 0', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Courier Prime', monospace",
  }

  if (status === 'done') return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier Prime', monospace" }}>
      <div style={{ textAlign: 'center', padding: '48px 40px' }}>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '16px', letterSpacing: '6px', color: 'rgba(201,168,76,.9)', fontWeight: 400, marginBottom: '24px' }}>ACCESS REQUESTED</h1>
        <p style={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(180,180,205,.4)', lineHeight: 2.4, margin: 0 }}>
          Check {email}.<br />
          Confirm your email to enter the shadow.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier Prime', monospace" }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '48px 40px', border: '1px solid rgba(201,168,76,.1)', background: 'rgba(201,168,76,.015)' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '22px', letterSpacing: '8px', color: 'rgba(201,168,76,.9)', fontWeight: 400, margin: '0 0 10px' }}>UMBRA</h1>
          <p style={{ fontSize: '10px', letterSpacing: '5px', color: 'rgba(180,180,205,.3)', margin: 0 }}>REQUEST ACCESS</p>
        </div>
        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '20px' }}>
            <input type="email" placeholder="email" value={email}
              onChange={e => setEmail(e.target.value)} required style={inp} />
          </div>
          <div style={{ marginBottom: '36px' }}>
            <input type="password" placeholder="password" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={6} style={inp} />
          </div>
          {error && <p style={{ color: 'rgba(220,80,80,.8)', fontSize: '11px', letterSpacing: '1px', marginBottom: '20px' }}>{error}</p>}
          <button type="submit" disabled={status === 'loading'} style={{
            width: '100%', background: 'transparent', border: '1px solid rgba(201,168,76,.35)',
            color: 'rgba(201,168,76,.8)', fontSize: '10px', letterSpacing: '5px', padding: '14px',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.5 : 1,
            fontFamily: "'Courier Prime', monospace", transition: 'all .3s',
          }}>{status === 'loading' ? '...' : 'REQUEST ACCESS'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '10px', letterSpacing: '2px', color: 'rgba(180,180,205,.3)' }}>
          Already inside.{' '}
          <Link href="/auth/login" style={{ color: 'rgba(201,168,76,.5)', textDecoration: 'none' }}>ENTER</Link>
        </p>
      </div>
    </div>
  )
}
