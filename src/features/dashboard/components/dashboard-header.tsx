'use client'

import { useState } from 'react'
import Link from 'next/link'

import { CategoriesButton } from '@/features/categories/components/categories-button'
import { GoalModal } from '@/features/goals/components/goal-modal'
import { format } from 'date-fns'
import { Clock, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

export function DashboardHeader() {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')
  const [showGoalModal, setShowGoalModal] = useState(false)

  return (
    <>
      <PageHeader
        eyebrow="Today"
        title="Dashboard"
        description={today}
        actions={
          <>
            <CategoriesButton />
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard/time-tracker">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Log Time</span>
              </Link>
            </Button>
            <Button variant="brand" size="sm" onClick={() => setShowGoalModal(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Goal</span>
            </Button>
          </>
        }
      />
      <GoalModal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} goal={null} />
    </>
  )
}
