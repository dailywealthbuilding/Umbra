// Destination: components/auth/AuthForm.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'signup';

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const supabase = createClient();
  const isSignup = mode === 'signup';

  const [usePassword, setUsePassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Email required.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: isSignup,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMagicLinkSent(true);
  }

  async function handlePasswordAuth(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Email and password required.');
      return;
    }
    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (isSignup && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push('/browse');
        return;
      }
      // Email confirmation required before session exists
      setMagicLinkSent(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/browse');
  }

  if (magicLinkSent) {
    return (
      <div className="auth-card">
        <div className="auth-eye">UMBRA</div>
        <h1 className="auth-title">Check your inbox</h1>
        <p className="auth-sub">
          A link has been sent to <span className="auth-email">{email}</span>.
          <br />
          Click it to enter.
        </p>
        <button className="auth-ghost-btn" onClick={() => setMagicLinkSent(false)}>
          Use a different email
        </button>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-eye">UMBRA</div>
      <h1 className="auth-title">{isSignup ? 'Enter.' : 'Return.'}</h1>
      <p className="auth-sub">
        {isSignup ? 'You already know if this is for you.' : 'The door remembers you.'}
      </p>

      <form onSubmit={usePassword ? handlePasswordAuth : handleMagicLink} className="auth-form">
        <label className="auth-label">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          placeholder="you@domain.com"
          autoComplete="email"
        />

        {usePassword && (
          <>
            <label className="auth-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
            {isSignup && (
              <>
                <label className="auth-label">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </>
            )}
          </>
        )}

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading
            ? 'Working…'
            : usePassword
            ? isSignup
              ? 'Create Account'
              : 'Sign In'
            : 'Send Magic Link'}
        </button>
      </form>

      <button
        className="auth-toggle"
        onClick={() => {
          setUsePassword(!usePassword);
          setError(null);
        }}
      >
        {usePassword ? 'Use magic link instead' : 'Use a password instead'}
      </button>

      <div className="auth-switch">
        {isSignup ? (
          <>
            Already inside? <a href="/auth/login">Enter here.</a>
          </>
        ) : (
          <>
            New here? <a href="/auth/signup">Request access.</a>
          </>
        )}
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .auth-card {
    max-width: 420px;
    width: 100%;
    padding: 56px 44px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(201,168,76,0.12);
    text-align: center;
  }
  .auth-eye {
    font-family: 'Courier Prime', monospace;
    font-size: 10px;
    letter-spacing: 6px;
    color: #9a7a36;
    text-transform: uppercase;
    margin-bottom: 28px;
  }
  .auth-title {
    font-family: 'Cinzel', serif;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: transparent;
    background: linear-gradient(135deg, #9a7a36, #c9a84c, #f0d98a, #c9a84c);
    -webkit-background-clip: text;
    background-clip: text;
    margin-bottom: 14px;
  }
  .auth-sub {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 16px;
    color: #9898b4;
    line-height: 1.7;
    margin-bottom: 36px;
  }
  .auth-email { color: #c9a84c; font-style: normal; }
  .auth-form { display: flex; flex-direction: column; gap: 8px; text-align: left; }
  .auth-label {
    font-family: 'Courier Prime', monospace;
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #787890;
    margin-top: 14px;
  }
  .auth-input {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(201,168,76,0.15);
    color: #eeeef8;
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
    padding: 12px 14px;
    outline: none;
    transition: border-color 0.3s;
  }
  .auth-input:focus { border-color: rgba(201,168,76,0.5); }
  .auth-error {
    font-family: 'Courier Prime', monospace;
    font-size: 11px;
    color: #cc6666;
    margin-top: 14px;
    letter-spacing: 0.5px;
  }
  .auth-submit {
    margin-top: 26px;
    padding: 14px;
    background: transparent;
    border: 1px solid #c9a84c;
    color: #f0d98a;
    font-family: 'Courier Prime', monospace;
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s;
  }
  .auth-submit:hover:not(:disabled) { background: rgba(201,168,76,0.08); }
  .auth-submit:disabled { opacity: 0.5; cursor: default; }
  .auth-toggle {
    margin-top: 22px;
    background: none;
    border: none;
    font-family: 'Courier Prime', monospace;
    font-size: 10px;
    letter-spacing: 1.5px;
    color: #787890;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .auth-toggle:hover { color: #c9a84c; }
  .auth-ghost-btn {
    margin-top: 20px;
    background: none;
    border: 1px solid rgba(201,168,76,0.2);
    color: #9898b4;
    font-family: 'Courier Prime', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    padding: 10px 18px;
    cursor: pointer;
  }
  .auth-switch {
    margin-top: 32px;
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 13px;
    color: #787890;
  }
  .auth-switch a { color: #c9a84c; text-decoration: none; border-bottom: 1px solid rgba(201,168,76,0.3); }
`;
