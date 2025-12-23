import { useIsMobile } from '@/hooks/use-mobile'

import { GoalsSidebarDesktop } from './goals-sidebar-desktop'
import { GoalsSidebarMobile } from './goals-sidebar-mobile'
import { GoalsSidebarProps } from './types'

export function GoalsSidebar(props: GoalsSidebarProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <GoalsSidebarMobile {...props} />
  }

  return <GoalsSidebarDesktop {...props} />
}

export type { GoalsSidebarProps } from './types'
