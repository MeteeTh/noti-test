import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PushManager from '@/components/PushManager'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Push Notification Demo',
  description: 'Web Push Notification Demo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PushManager />
        {children}
      </body>
    </html>
  )
}
