import type { Metadata } from 'next'

import './globals.css'

import { Feedback } from '@/features/feedback'
import { Toaster } from 'react-hot-toast'

import { ReactQueryProvider } from '@/lib/react-query-provider'

export const metadata: Metadata = {
  title: 'GoalSlot | Productivity Tracking',
  description: 'Track your goals, log time, plan schedules, and analyze your productivity patterns.',
  keywords: ['productivity', 'time tracking', 'goals', 'mentorship'],
  authors: [{ name: 'GoalSlot' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'GoalSlot',
    description: 'Master your time, achieve your goals',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          {children}
          <div className="fixed bottom-6 right-6 z-50">
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
