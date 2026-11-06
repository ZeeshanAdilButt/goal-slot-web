'use client'

import { Suspense } from 'react'

import { ProjectInviteAccept } from '@/features/projects/components/project-invite-accept'

// ProjectInviteAccept reads ?token= with useSearchParams, which must sit under
// a Suspense boundary or the production prerender of this route fails.
export default function ProjectInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
          <div className="h-12 w-12 animate-spin border-4 border-secondary border-t-primary" />
        </div>
      }
    >
      <ProjectInviteAccept />
    </Suspense>
  )
}
