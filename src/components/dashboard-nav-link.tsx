import Link from 'next/link'

import { LayoutDashboard } from 'lucide-react'

/**
 * The one-click way back into the app from the marketing pages. Points at /app,
 * which resolves to the last dashboard page the user was on. Icon only on
 * narrow screens so the nav keeps its room.
 */
export function DashboardNavLink() {
  return (
    <Link
      href="/app"
      title="Open dashboard"
      aria-label="Open dashboard"
      className="flex h-9 items-center gap-2 rounded-md bg-[#f2cc0d] px-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#e0bd0a]"
    >
      <LayoutDashboard className="h-4 w-4" />
      <span className="hidden sm:inline">Dashboard</span>
    </Link>
  )
}
