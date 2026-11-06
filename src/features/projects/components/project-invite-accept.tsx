'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { authApi, projectsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { GoalSlotBrand, GoalSlotSpinner } from '@/components/goalslot-logo'

import { projectQueries } from '../hooks/use-projects'
import { inviteProblemFromError, projectIdFromAcceptResponse, type InviteAcceptProblem } from '../utils/invite-accept'
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type ProjectInvitePreview } from '../utils/types'
import { ProjectSwatch } from './member-avatar'

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] px-4 py-10">
      <Link href="/" className="mb-8" aria-label="GoalSlot home">
        <GoalSlotBrand size="sm" showTagline={false} />
      </Link>
      <main className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">{children}</main>
    </div>
  )
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
      <div className="mt-2 space-y-4 text-sm text-zinc-600">{children}</div>
    </div>
  )
}

export function ProjectInviteAccept() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const logout = useAuthStore((s) => s.logout)
  const token = searchParams.get('token')?.trim() || null
  const returnTo = token ? `/projects/invite?token=${encodeURIComponent(token)}` : '/projects/invite'

  // Read the session after mount so the prerendered HTML and the first client
  // render agree (localStorage does not exist on the server).
  const [session, setSession] = useState<'unknown' | 'in' | 'out'>('unknown')
  useEffect(() => {
    setSession(localStorage.getItem('accessToken') ? 'in' : 'out')
  }, [])

  const [problem, setProblem] = useState<InviteAcceptProblem | null>(null)

  const profileQuery = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => (await authApi.getProfile()).data as { id: string; email: string; name: string },
    enabled: session === 'in',
  })

  const previewQuery = useQuery({
    queryKey: projectQueries.invitePreview(token ?? ''),
    queryFn: async () => (await projectsApi.previewInvite(token as string)).data as ProjectInvitePreview,
    enabled: session === 'in' && !!token,
  })

  const accept = useMutation({
    mutationFn: async () => (await projectsApi.acceptInvite(token as string)).data as unknown,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectQueries.all })
      const projectId = projectIdFromAcceptResponse(data)
      router.push(projectId ? `/dashboard/tasks?project=${encodeURIComponent(projectId)}` : '/dashboard/tasks')
    },
    onError: (error) => setProblem(inviteProblemFromError(error)),
  })

  const switchAccount = () => {
    logout()
    router.push(`/login?redirect=${encodeURIComponent(returnTo)}`)
  }

  if (!token) {
    return (
      <Shell>
        <Notice title="This invite link is incomplete">
          <p>Open the link from your invite email again, or ask the person who invited you to send a new one.</p>
          <Button asChild variant="secondary">
            <Link href="/dashboard/tasks">Go to GoalSlot</Link>
          </Button>
        </Notice>
      </Shell>
    )
  }

  if (session === 'unknown') {
    return (
      <Shell>
        <div className="flex justify-center py-6">
          <GoalSlotSpinner size="md" />
        </div>
      </Shell>
    )
  }

  if (session === 'out') {
    return (
      <Shell>
        <Notice title="You have been invited to a project">
          <p>
            Sign in or create a free account to see the invite. You come straight back here afterwards. If you already
            use GoalSlot or the DW Platform, sign in with the email the invite was sent to.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/login?redirect=${encodeURIComponent(returnTo)}`}>Sign in</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/signup?redirect=${encodeURIComponent(returnTo)}`}>Create an account</Link>
            </Button>
          </div>
        </Notice>
      </Shell>
    )
  }

  if (previewQuery.isLoading) {
    return (
      <Shell>
        <div className="flex justify-center py-6">
          <GoalSlotSpinner size="md" />
        </div>
      </Shell>
    )
  }

  const shown = problem ?? (previewQuery.error ? inviteProblemFromError(previewQuery.error) : null)
  const preview = previewQuery.data
  const signedInAs = profileQuery.data?.email

  if (shown?.kind === 'wrong-email') {
    return (
      <Shell>
        <Notice title="This invite is for a different email">
          <p>{shown.message}</p>
          {signedInAs ? (
            <p>
              You are signed in as <strong className="font-semibold text-zinc-900">{signedInAs}</strong>.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={switchAccount}>
              Sign in with another account
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/tasks">Not now</Link>
            </Button>
          </div>
        </Notice>
      </Shell>
    )
  }

  if (shown?.kind === 'expired' || preview?.expired) {
    return (
      <Shell>
        <Notice title="This invite has expired">
          <p>
            Invites last 7 days.{' '}
            {preview?.inviterName ? `Ask ${preview.inviterName} to send you a new one.` : 'Ask for a new one.'}
          </p>
          <Button asChild variant="secondary">
            <Link href="/dashboard/tasks">Go to my tasks</Link>
          </Button>
        </Notice>
      </Shell>
    )
  }

  if (shown || !preview) {
    return (
      <Shell>
        <Notice title={shown?.kind === 'not-found' ? 'Invite not found' : 'Something went wrong'}>
          <p>{shown?.message ?? 'We could not load this invite. Please try again.'}</p>
          <div className="flex flex-wrap gap-2">
            {shown?.kind === 'other' ? (
              <Button
                type="button"
                onClick={() => {
                  setProblem(null)
                  previewQuery.refetch()
                }}
              >
                Try again
              </Button>
            ) : null}
            <Button asChild variant="secondary">
              <Link href="/dashboard/tasks">Go to my tasks</Link>
            </Button>
          </div>
        </Notice>
      </Shell>
    )
  }

  if (preview.alreadyMember) {
    return (
      <Shell>
        <Notice title={`You are already in ${preview.projectName}`}>
          <p>Pick it from the switcher at the top of Tasks.</p>
          <Button asChild>
            <Link href="/dashboard/tasks">Open Tasks</Link>
          </Button>
        </Notice>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <ProjectSwatch color={preview.color} className="h-10 w-10 rounded-lg" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Project invite</p>
          <h1 className="truncate text-xl font-bold text-zinc-900">{preview.projectName}</h1>
        </div>
      </div>
      <p className="mt-4 text-sm text-zinc-700">
        <strong className="font-semibold text-zinc-900">{preview.inviterName}</strong> invited you to join as{' '}
        <strong className="font-semibold text-zinc-900">{ROLE_LABELS[preview.role]}</strong>.
      </p>
      <p className="mt-1 text-sm text-zinc-600">{ROLE_DESCRIPTIONS[preview.role]}</p>
      <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
        You will see this project&apos;s tasks in Tasks. Nobody in it sees your personal tasks, goals, schedule or time
        log.
      </p>
      {signedInAs ? <p className="mt-3 text-xs text-zinc-500">Signed in as {signedInAs}</p> : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="brand" onClick={() => accept.mutate()} disabled={accept.isPending}>
          {accept.isPending ? 'Joining...' : 'Accept invite'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push('/dashboard/tasks')} disabled={accept.isPending}>
          Decline
        </Button>
      </div>
    </Shell>
  )
}
