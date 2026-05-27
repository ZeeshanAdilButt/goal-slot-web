import Link from 'next/link'

import { format } from 'date-fns'
import { Clock, Plus, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

export function DashboardHeader() {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  return (
    <PageHeader
      eyebrow="Today"
      title="Dashboard"
      description={today}
      actions={
        <>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/settings?tab=categories">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Categories</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard/time-tracker">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Log Time</span>
            </Link>
          </Button>
          <Button asChild variant="brand" size="sm">
            <Link href="/dashboard/goals">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Goal</span>
            </Link>
          </Button>
        </>
      }
    />
  )
}
