import type { Metadata } from "next"
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google"
import "./globals.css"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500"],
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400"],
})

export const metadata: Metadata = {
  title: "UMBRA — Enter the Shadow",
  description:
    "The world's most complete aesthetic visual content ecosystem. Dark. Luminous. Global.",
  keywords: ["aesthetic", "visual art", "dark photography", "cinema", "UMBRA"],
  openGraph: {
    title: "UMBRA — Enter the Shadow",
    description:
      "The world's most complete aesthetic visual content ecosystem.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
