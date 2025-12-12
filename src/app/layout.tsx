import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ReactQueryProvider } from '@/lib/react-query-provider'

export const metadata: Metadata = {
  title: 'DevWeekends Time Master | Productivity Tracking',
  description: 'Track your goals, log time, plan schedules, and analyze your productivity patterns. Built for DevWeekends mentees and mentors.',
  keywords: ['productivity', 'time tracking', 'goals', 'devweekends', 'mentorship'],
  authors: [{ name: 'DevWeekends' }],
  openGraph: {
    title: 'DevWeekends Time Master',
    description: 'Master your time, achieve your goals',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          {children}
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
