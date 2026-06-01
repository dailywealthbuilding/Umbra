import type { Metadata } from 'next'
import { Cormorant_Garamond, Cinzel, Courier_Prime } from 'next/font/google'
import './globals.css'
const cormorant = Cormorant_Garamond({ subsets:['latin'], variable:'--font-display', weight:['300','400','600'], style:['normal','italic'] })
const cinzel    = Cinzel({ subsets:['latin'], variable:'--font-cinzel', weight:['400','600','700','900'] })
const courier   = Courier_Prime({ subsets:['latin'], variable:'--font-mono', weight:['400','700'], style:['normal','italic'] })
export const metadata: Metadata = {
  title:       'UMBRA — Enter the Shadow',
  description: 'The world’s most uncompromising aesthetic intelligence platform. Not a feed. Not a library. A world governed by a single aesthetic law.',
  metadataBase: new URL('https://umbra-wine.vercel.app'),
  openGraph: {
    title:       'UMBRA — Enter the Shadow',
    description: 'In nature: where light ends. In ours: where mediocrity ends.',
    url:         'https://umbra-wine.vercel.app',
    siteName:    'UMBRA',
    images: [{
      url:    '/umbra-og.png',
      width:  1200,
      height: 630,
      alt:    'UMBRA — The world’s most uncompromising aesthetic intelligence',
    }],
    type: 'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'UMBRA — Enter the Shadow',
    description: 'In nature: where light ends. In ours: where mediocrity ends.',
    images:      ['/umbra-og.png'],
  },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${cinzel.variable} ${courier.variable}`}>
      <body>{children}</body>
    </html>
  )
}
