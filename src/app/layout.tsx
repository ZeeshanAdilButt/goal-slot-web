import type { Metadata, Viewport } from 'next'

import './globals.css'

import { Feedback } from '@/features/feedback'
import { NotificationsButton } from '@/features/notifications/components/notifications-button'
import { Toaster } from 'react-hot-toast'

import { ReactQueryProvider } from '@/lib/react-query-provider'
import PostHogAuth from '@/components/posthog-auth'

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: 'GoalSlot.io | Your Growth, Measured',
  description: 'Track your hours, see real progress, and level up. The productivity stack for developers and learners.',
  keywords: ['productivity', 'time tracking', 'goals', 'developer', 'learning', 'progress tracking'],
  authors: [{ name: 'GoalSlot' }],
  icons: {
    icon: '/icons/goalslot-logo-boxed.svg',
    shortcut: '/icons/goalslot-logo-boxed.svg',
    apple: '/icons/goalslot-logo-boxed.svg',
  },
  openGraph: {
    title: 'GoalSlot.io',
    description: 'Your growth, measured. Track hours, see progress, level up.',
    type: 'website',
    images: ['/brand/goalslot-og-image.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoalSlot.io',
    description: 'Your growth, measured.',
    images: ['/brand/goalslot-og-image.svg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <PostHogAuth />
          {children}
          <div className="fixed bottom-6 right-6 z-50 flex flex-row items-end gap-2">
            <NotificationsButton />
            <Feedback label="Feedback" />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#000',
                color: '#fff',
                border: '3px solid #000',
                borderRadius: '0',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#FFD700',
                  secondary: '#000',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </ReactQueryProvider>
      </body>
    </html>
  )
}
