'use client'

import { Bell, BellOff, BellRing } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { usePushSubscription } from '@/features/push-notifications/hooks/use-push-subscription'

/**
 * Opt-in control for mentee engagement push notifications (stale-report
 * nudges, assigned instructions) while the tab is closed. Renders nothing
 * for browsers that can't do web push and for users who already denied the
 * permission prompt — there's no useful action to offer either way.
 */
export function EnablePushNotificationsButton() {
  const { state, subscribe, unsubscribe } = usePushSubscription()

  if (state === 'unsupported' || state === 'denied') {
    return null
  }

  if (state === 'subscribed') {
    const handleDisable = async () => {
      try {
        await unsubscribe()
      } catch {
        toast.error('Could not disable push notifications. Please try again.')
      }
    }

    return (
      <Button variant="secondary" size="sm" onClick={handleDisable} title="Turn off push notifications">
        <BellRing className="h-4 w-4" />
        Notifications enabled
      </Button>
    )
  }

  const handleClick = async () => {
    try {
      await subscribe()
    } catch {
      toast.error('Could not enable push notifications. Please try again.')
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleClick}
      disabled={state === 'subscribing'}
      title="Get notified when a mentor or mentee update needs your attention"
    >
      {state === 'subscribing' ? <BellOff className="h-4 w-4 animate-pulse" /> : <Bell className="h-4 w-4" />}
      {state === 'subscribing' ? 'Enabling…' : 'Enable notifications'}
    </Button>
  )
}
