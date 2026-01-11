import { useEffect, useState, useCallback, useRef } from 'react'
import { useTimerStore } from '@/lib/use-timer-store'
import { toast } from 'react-hot-toast'

export function useTimerNotifications() {
  const { timerState, currentTask, reminderInterval } = useTimerStore((state) => ({
    timerState: state.timerState,
    currentTask: state.currentTask,
    reminderInterval: state.reminderInterval || 15,
  }))

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const hasShownToast = useRef(false)

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
  }, [])

  // Update permission state on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Show "Enable Reminders" toast when timer starts
  useEffect(() => {
    if (timerState === 'RUNNING' && permission === 'default' && !hasShownToast.current) {
      hasShownToast.current = true
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span className="text-sm text-black dark:text-white">Stay strictly focused? Enable background reminders.</span>
            <button
              onClick={() => {
                requestPermission()
                toast.dismiss(t.id)
              }}
              className="rounded bg-black px-2 py-1 text-xs font-bold text-white hover:bg-black/80 dark:bg-white dark:text-black"
            >
              Enable
            </button>
          </div>
        ),
        {
          duration: 6000,
          position: 'bottom-right',
        }
      )
    }
    // Reset toast flag when stopped
    if (timerState === 'STOPPED') {
        hasShownToast.current = false
    }
  }, [timerState, permission, requestPermission])

  // Reminder Logic
  useEffect(() => {
    if (timerState !== 'RUNNING') return

    // Convert minutes to ms, default to 15m if invalid
    const intervalMs = (reminderInterval > 0 ? reminderInterval : 15) * 60 * 1000

    const intervalId = setInterval(async () => {
      if (Notification.permission === 'granted') {
        const title = 'Time Check'
        const options: NotificationOptions = {
          body: `You are working on: ${currentTask || 'Untitled Task'}. Still strictly focused?`,
          icon: '/icons/goalslot-logo-boxed.svg', // Ensure this path exists and is 192x192 or larger ideally
          tag: 'timer-reminder',
          requireInteraction: true,
          silent: false,
          
          // PWA specific options
          badge: '/icons/goalslot-logo-64.svg',
        }

        try {
          // Try to use Service Worker registration for "System" notification (PWA standard)
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration && 'showNotification' in registration) {
            await registration.showNotification(title, options)
          } else {
            // Fallback to standard web notification
            const notification = new Notification(title, options)
            notification.onclick = () => {
                window.focus()
                notification.close()
            }
          }
        } catch (e) {
            // Fallback if SW fails
            const notification = new Notification(title, options)
            notification.onclick = () => {
                window.focus()
                notification.close()
            }
        }
      }
    }, intervalMs)

    return () => clearInterval(intervalId)
  }, [timerState, currentTask, reminderInterval])

  // Before Unload Logic
  useEffect(() => {
    if (timerState !== 'RUNNING') return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message = 'You have a timer running. Are you sure you want to leave?'
      e.preventDefault()
      e.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [timerState])

  return { permission, requestPermission }
}
