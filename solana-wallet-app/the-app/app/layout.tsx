import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Solana Wallet Demo App',
  description: 'Transaction monitoring dashboard with Tether WDK Solana SDK',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

