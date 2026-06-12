'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// /access is referenced in browse + asset pages.
// The actual subscription page lives at /subscribe.
// This page silently redirects — no flash, no 404.
export default function AccessPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/subscribe')
  }, [router])

  // Render void while redirect fires — consistent with UMBRA aesthetic
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#030305',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontFamily: "'Courier Prime', monospace",
          fontSize: 10,
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: 'rgba(201,168,76,0.4)',
        }}
      >
        entering
      </span>
    </div>
  )
}
