import type { Metadata } from 'next'
import './globals.css'
import Web3AuthWrapper from '@/components/Web3AuthWrapper'

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
      <body>
        <Web3AuthWrapper>
          {children}
        </Web3AuthWrapper>
      </body>
    </html>
  )
}

