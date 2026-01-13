import { DashboardStats as DashboardStatsType } from '@/features/dashboard/utils/types'
import { motion } from 'framer-motion'
import { CheckSquare, Clock, Target, TrendingUp } from 'lucide-react'

interface DashboardStatsProps {
  stats?: DashboardStatsType
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      label: "Today's Focus",
      value: stats?.todayFormatted || '0m',
      icon: Clock,
      color: 'bg-accent-pink',
    },
    {
      label: 'Weekly Total',
      value: stats?.weeklyFormatted || '0m',
      icon: TrendingUp,
      color: 'bg-accent-blue',
    },
    {
      label: 'Active Goals',
      value: stats?.activeGoals || 0,
      icon: Target,
      color: 'bg-accent-green',
    },
    {
      label: 'Tasks Logged',
      value: stats?.tasksLogged || 0,
      icon: CheckSquare,
      color: 'bg-primary',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {statCards.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`${stat.color} border-3 border-secondary p-4 shadow-brutal sm:p-6`}
        >
          <stat.icon className="mb-2 h-6 w-6 sm:mb-4 sm:h-8 sm:w-8" />
          <div className="font-mono text-2xl font-bold sm:text-3xl">{stat.value}</div>
          <div className="text-xs font-bold uppercase sm:text-sm">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  )
}
