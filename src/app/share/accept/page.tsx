'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Lock,
  Mail,
  Shield,
  Target,
  TrendingUp,
  User,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { authApi, sharingApi } from '@/lib/api'
import { cn, formatDate, formatDuration } from '@/lib/utils'

interface SharedOwner {
  id: string
  name: string
  email: string
  avatar?: string
}

interface PublicShareData {
  owner: SharedOwner
  shareId: string
  expiresAt?: string
  accessType: string
  isAccepted: boolean
  inviteEmail: string | null
}

interface SharedGoal {
  id: string
  title: string
  color: string
  category: string
  targetHours: number
  loggedHours: number
  status: string
}

interface SharedTimeEntry {
  id: string
  taskName: string
  duration: number
  date: string
  goal?: {
    id: string
    title: string
    color: string
    category?: string
  }
}

function getRollingWeekRange(offset: number = 0) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7)
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  return {
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0],
    label: `${formatDate(startOfWeek, 'MMM d')} - ${formatDate(endOfWeek, 'MMM d, yyyy')}`,
  }
}

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']

function PublicShareViewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [weekOffset, setWeekOffset] = useState(0)

  const range = useMemo(() => getRollingWeekRange(weekOffset), [weekOffset])

  // Check authentication status
  const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('accessToken')

  // Fetch user profile if authenticated
  const userQuery = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await authApi.getProfile()
      return res.data as { id: string; email: string; name: string }
    },
    enabled: isAuthenticated,
  })

  // Fetch share info
  const shareInfoQuery = useQuery({
    queryKey: ['public-share-info', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided')
      const res = await sharingApi.getPublicSharedData(token)
      return res.data as PublicShareData
    },
    enabled: !!token,
  })

  // Accept invite mutation
  const acceptInviteMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('No token provided')
      const res = await sharingApi.accept(token)
      return res.data
    },
    onSuccess: () => {
      toast.success('Invitation accepted successfully!')
      // Redirect to dashboard/sharing page
      setTimeout(() => {
        router.push('/dashboard/sharing')
      }, 1500)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to accept invitation'
      if (message.includes('already been accepted')) {
        toast.error('This invitation has already been accepted')
      } else if (message.includes('not for you')) {
        toast.error('This invitation is not for your email address')
      } else if (message.includes('expired')) {
        toast.error('This invitation has expired')
      } else {
        toast.error(message)
      }
    },
  })

  // Fetch time entries
  const entriesQuery = useQuery({
    queryKey: ['public-share-entries', token, range.startDate, range.endDate],
    queryFn: async () => {
      if (!token) return []
      const res = await sharingApi.getPublicSharedTimeEntries(token, range.startDate, range.endDate)
      return res.data as SharedTimeEntry[]
    },
    enabled: !!token && !!shareInfoQuery.data,
  })

  // Fetch goals
  const goalsQuery = useQuery({
    queryKey: ['public-share-goals', token],
    queryFn: async () => {
      if (!token) return []
      const res = await sharingApi.getPublicSharedGoals(token)
      return res.data as SharedGoal[]
    },
    enabled: !!token && !!shareInfoQuery.data,
  })

  const entries = useMemo(() => entriesQuery.data ?? [], [entriesQuery.data])
  const goals = goalsQuery.data ?? []
  const owner = shareInfoQuery.data?.owner

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0)
    const daysWithEntries = new Set(entries.map((e) => e.date)).size
    const avgPerDay = daysWithEntries > 0 ? Math.round(totalMinutes / daysWithEntries) : 0

    const dailyMinutes: Record<string, number> = {}
    entries.forEach((e) => {
      dailyMinutes[e.date] = (dailyMinutes[e.date] || 0) + e.duration
    })

    const goalMinutes: Record<string, { title: string; color: string; minutes: number }> = {}
    entries.forEach((e) => {
      const goalId = e.goal?.id || 'other'
      if (!goalMinutes[goalId]) {
        goalMinutes[goalId] = {
          title: e.goal?.title || 'Other',
          color: e.goal?.color || '#94A3B8',
          minutes: 0,
        }
      }
      goalMinutes[goalId].minutes += e.duration
    })

    return {
      totalMinutes,
      totalFormatted: formatDuration(totalMinutes),
      daysActive: daysWithEntries,
      avgPerDay,
      avgFormatted: formatDuration(avgPerDay),
      entriesCount: entries.length,
      dailyData: Object.entries(dailyMinutes)
        .map(([date, minutes]) => ({
          date,
          minutes,
          label: formatDate(date, 'EEE'),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      goalData: Object.values(goalMinutes).sort((a, b) => b.minutes - a.minutes),
    }
  }, [entries])

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-2 sm:p-6">
        <div className="card-brutal max-w-md text-center">
          <Lock className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold uppercase">Invalid Link</h1>
          <p className="font-mono text-gray-600">This share link is invalid or missing a token.</p>
        </div>
      </div>
    )
  }

  if (shareInfoQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin border-4 border-secondary border-t-primary" />
      </div>
    )
  }

  if (shareInfoQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-2 sm:p-6">
        <div className="card-brutal max-w-md text-center">
          <Lock className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold uppercase">Link Expired or Invalid</h1>
          <p className="font-mono text-gray-600">
            This share link has expired or is no longer valid. Please ask the owner to send you a new invitation.
          </p>
          <Link href="/" className="btn-brutal mt-6 inline-block">
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b-3 border-secondary bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="border-3 border-secondary bg-primary p-2 text-xl font-bold">⏱️</div>
            <span className="font-display text-xl font-bold uppercase">GoalSlot</span>
          </div>
          <div className="flex items-center gap-2 border-2 border-secondary bg-accent-green/20 px-3 py-1">
            <Shield className="h-4 w-4" />
            <span className="font-mono text-sm">View Only Access</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl space-y-6 p-2 sm:p-6">
        {/* Owner Info */}
        {owner && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-brutal">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center border-3 border-secondary bg-primary text-2xl font-bold">
                  {owner.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{owner.name}&apos;s Focus Reports</h1>
                  <p className="font-mono text-gray-600">{owner.email}</p>
                </div>
              </div>
              {!isAuthenticated && (
                <Link
                  href={`/signup?redirect=${encodeURIComponent(`/share/accept?token=${token}`)}`}
                  className="btn-brutal flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Sign Up to Track Your Own Time
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* Invite Acceptance UI for Logged-in Users */}
        {isAuthenticated && shareInfoQuery.data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Already Accepted */}
            {shareInfoQuery.data.isAccepted && (
              <div className="flex items-start gap-3 border-2 border-secondary bg-green-50 p-4">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <div className="font-mono text-sm">
                  <strong>Invitation Already Accepted:</strong> You&apos;ve already accepted this invitation. You can
                  view {owner?.name}&apos;s shared data from your{' '}
                  <Link href="/dashboard/sharing" className="text-green-600 underline">
                    dashboard
                  </Link>
                  .
                </div>
              </div>
            )}

            {/* Not Accepted - Check Email Match */}
            {!shareInfoQuery.data.isAccepted && userQuery.data && (
              <>
                {/* Email Matches */}
                {userQuery.data.email === shareInfoQuery.data.inviteEmail && (
                  <div className="card-brutal bg-blue-50">
                    <div className="mb-4">
                      <h3 className="mb-2 text-lg font-bold">Accept Invitation</h3>
                      <p className="font-mono text-sm text-gray-700">
                        {owner?.name} has invited you to view their focus time reports. Accept this invitation to get
                        started.
                      </p>
                    </div>
                    <button
                      onClick={() => acceptInviteMutation.mutate()}
                      disabled={acceptInviteMutation.isPending}
                      className="btn-brutal-dark w-full sm:w-auto"
                    >
                      {acceptInviteMutation.isPending ? 'Accepting...' : 'Accept Invitation'}
                    </button>
                  </div>
                )}

                {/* Email Doesn't Match */}
                {userQuery.data.email !== shareInfoQuery.data.inviteEmail && (
                  <div className="flex items-start gap-3 border-2 border-red-500 bg-red-50 p-4">
                    <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <div className="font-mono text-sm">
                      <strong className="text-red-800">Wrong Account:</strong>{' '}
                      <span className="text-red-700">
                        This invitation was sent to {shareInfoQuery.data.inviteEmail}, but you&apos;re logged in as{' '}
                        {userQuery.data.email}. Please log in with the correct account to accept this invitation.
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Invitation Acceptance Notice for Unauthenticated Users */}
        {!isAuthenticated && shareInfoQuery.data && !shareInfoQuery.data.isAccepted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-brutal-colored bg-accent-orange text-white"
          >
            <div className="mb-4">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-bold uppercase">
                <Mail className="h-5 w-5" />
                Accept Invitation
              </h3>
              <p className="font-mono text-sm opacity-90">
                {owner?.name} has invited you to view their focus time reports. To accept this invitation, please create
                an account or log in.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/signup?redirect=${encodeURIComponent(`/share/accept?token=${token}`)}`}
                className="btn-brutal-dark flex-1 sm:flex-none"
              >
                Create Account
              </Link>
              <Link
                href={`/login?redirect=${encodeURIComponent(`/share/accept?token=${token}`)}`}
                className="btn-brutal-secondary flex-1 sm:flex-none"
              >
                Log In
              </Link>
            </div>
          </motion.div>
        )}

        {/* Security Notice for Already Accepted or View-Only */}
        {!isAuthenticated && shareInfoQuery.data && shareInfoQuery.data.isAccepted && (
          <div className="flex items-start gap-3 border-2 border-secondary bg-blue-50 p-4">
            <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="font-mono text-sm">
              <strong>Secure View-Only Access:</strong> You&apos;re viewing shared focus time reports. This link is
              unique to you and provides read-only access.
              <Link
                href={`/signup?redirect=${encodeURIComponent(`/share/accept?token=${token}`)}`}
                className="ml-1 text-blue-600 underline"
              >
                Create an account
              </Link>{' '}
              to track your own productivity!
            </div>
          </div>
        )}

        {/* Date Range Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span className="font-mono text-sm">{range.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset((o) => o - 1)} className="btn-brutal-secondary px-3 py-2 text-xs">
              Prev Week
            </button>
            <button
              onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
              disabled={weekOffset >= 0}
              className={cn('btn-brutal-secondary px-3 py-2 text-xs', weekOffset >= 0 && 'opacity-50')}
            >
              Next Week
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="btn-brutal px-3 py-2 text-xs">
                Today
              </button>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        {!entriesQuery.isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            <div className="card-brutal p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-xs uppercase">Total Time</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{stats.totalFormatted}</div>
            </div>

            <div className="card-brutal p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="font-mono text-xs uppercase">Days Active</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{stats.daysActive}</div>
            </div>

            <div className="card-brutal p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span className="font-mono text-xs uppercase">Avg/Day</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{stats.avgFormatted}</div>
            </div>

            <div className="card-brutal p-4">
              <div className="flex items-center gap-2 text-gray-600">
                <BarChart3 className="h-4 w-4" />
                <span className="font-mono text-xs uppercase">Entries</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{stats.entriesCount}</div>
            </div>
          </motion.div>
        )}

        {/* Charts */}
        {!entriesQuery.isLoading && entries.length > 0 && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Daily Breakdown Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-brutal"
            >
              <h3 className="mb-4 flex items-center gap-2 font-bold uppercase">
                <BarChart3 className="h-5 w-5" />
                Daily Focus Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.floor(v / 60)}h`} />
                    <Tooltip
                      formatter={(value: number) => [formatDuration(value), 'Focus Time']}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="minutes" fill="#FFD700" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Goal Breakdown Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-brutal"
            >
              <h3 className="mb-4 flex items-center gap-2 font-bold uppercase">
                <Target className="h-5 w-5" />
                Focus by Goal
              </h3>
              <div className="flex h-64 items-center gap-4">
                <div className="h-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.goalData}
                        dataKey="minutes"
                        nameKey="title"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {stats.goalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatDuration(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {stats.goalData.slice(0, 5).map((goal, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 border border-secondary"
                        style={{ backgroundColor: goal.color || COLORS[index % COLORS.length] }}
                      />
                      <span className="font-mono text-xs">{goal.title}</span>
                      <span className="font-mono text-xs text-gray-500">({formatDuration(goal.minutes)})</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Goals Progress */}
        {!goalsQuery.isLoading && goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-brutal"
          >
            <h3 className="mb-4 flex items-center gap-2 font-bold uppercase">
              <Target className="h-5 w-5" />
              Goals Progress
            </h3>
            <div className="space-y-4">
              {goals
                .filter((g) => g.status === 'ACTIVE')
                .map((goal) => {
                  const progress = goal.targetHours > 0 ? (goal.loggedHours / goal.targetHours) * 100 : 0
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 border border-secondary" style={{ backgroundColor: goal.color }} />
                          <span className="font-bold">{goal.title}</span>
                        </div>
                        <span className="font-mono text-sm text-gray-600">
                          {goal.loggedHours.toFixed(1)}h / {goal.targetHours}h
                        </span>
                      </div>
                      <div className="h-4 w-full border-2 border-secondary bg-gray-100">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, progress)}%`,
                            backgroundColor: goal.color,
                          }}
                        />
                      </div>
                      <div className="text-right font-mono text-xs text-gray-500">{Math.round(progress)}% complete</div>
                    </div>
                  )
                })}
            </div>
          </motion.div>
        )}

        {/* No entries message */}
        {!entriesQuery.isLoading && entries.length === 0 && (
          <div className="card-brutal py-12 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 opacity-30" />
            <h3 className="mb-2 font-bold uppercase">No focus time logged</h3>
            <p className="font-mono text-sm text-gray-600">No focus time has been logged for this period.</p>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-brutal-colored bg-primary text-center"
        >
          <h2 className="mb-2 text-xl font-bold uppercase">Want to track your own focus time?</h2>
          <p className="mb-4 font-mono text-sm">Join GoalSlot and start building better productivity habits today!</p>
          <Link
            href={`/signup?redirect=${encodeURIComponent(`/share/accept?token=${token}`)}`}
            className="btn-brutal-dark inline-flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Create Free Account
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t-3 border-secondary bg-white py-6">
        <div className="container mx-auto px-4 text-center font-mono text-sm text-gray-600 sm:px-6">
          <p>© 2025 GoalSlot. Focus on what matters.</p>
        </div>
      </footer>
    </div>
  )
}

export default function PublicShareViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-12 w-12 animate-spin border-4 border-secondary border-t-primary" />
        </div>
      }
    >
      <PublicShareViewContent />
    </Suspense>
  )
}
