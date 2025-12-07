import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Solana User Dashboard',
  description: 'User wallet dashboard with transaction monitoring using Tether WDK Solana SDK',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}

