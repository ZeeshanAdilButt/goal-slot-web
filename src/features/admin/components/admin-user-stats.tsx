import { Ban, Crown, MailCheck, Sparkles, UserCheck, Users } from 'lucide-react'

import { StatCard } from '@/components/ui/stat-card'

import type { AdminUserStats } from '../utils/types'

interface AdminUserStatsProps {
  stats: AdminUserStats
}

export function AdminUserStatsBar({ stats }: AdminUserStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
      <StatCard label="Total" value={stats.totalUsers} icon={<Users />} accent="neutral" />
      <StatCard label="Active" value={stats.activeUsers} icon={<UserCheck />} accent="success" />
      <StatCard label="Disabled" value={stats.disabledUsers} icon={<Ban />} accent="danger" />
      <StatCard label="Verified" value={stats.verifiedUsers} icon={<MailCheck />} accent="neutral" />
      <StatCard label="Max" value={stats.byPlan.pro} icon={<Crown />} accent="brand" />
      <StatCard label="Pro" value={stats.byPlan.basic} icon={<Sparkles />} accent="neutral" />
      <StatCard label="Free" value={stats.byPlan.free} icon={<Users />} accent="neutral" />
    </div>
  )
}
