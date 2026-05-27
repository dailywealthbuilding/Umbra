import type { Metadata } from 'next'
import { Cormorant_Garamond, Cinzel, Courier_Prime } from 'next/font/google'
import './globals.css'
const cormorant = Cormorant_Garamond({ subsets:['latin'], variable:'--font-display', weight:['300','400','600'], style:['normal','italic'] })
const cinzel    = Cinzel({ subsets:['latin'], variable:'--font-cinzel', weight:['400','600','700','900'] })
const courier   = Courier_Prime({ subsets:['latin'], variable:'--font-mono', weight:['400','700'], style:['normal','italic'] })
export const metadata: Metadata = {
  title: 'UMBRA — Enter the Shadow',
  description: 'The world\'s most complete aesthetic visual content ecosystem.',
  openGraph: { title:'UMBRA', description:'Aesthetic visual content ecosystem. Coming.', type:'website' },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${cinzel.variable} ${courier.variable}`}>
      <body>{children}</body>
    </html>
  )
}
