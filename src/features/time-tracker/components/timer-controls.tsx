import { Pause, Play, RefreshCw, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'

interface TimerControlsProps {
  timerState: 'STOPPED' | 'RUNNING' | 'PAUSED'
  isStopLoading?: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
}

export function TimerControls({
  timerState,
  isStopLoading = false,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
}: TimerControlsProps) {
  return (
    <div className="flex justify-center gap-3 sm:gap-4">
      {timerState === 'STOPPED' && (
        <Button onClick={onStart} variant="brand" size="lg" className="h-14 px-8 text-base">
          <Play className="h-5 w-5" />
          Start
        </Button>
      )}

      {timerState === 'RUNNING' && (
        <>
          <Button onClick={onPause} disabled={isStopLoading} variant="secondary" size="lg" className="h-14 px-6">
            <Pause className="h-5 w-5" />
            Pause
          </Button>
          <Button onClick={onStop} disabled={isStopLoading} variant="destructive" size="lg" className="h-14 px-6">
            {isStopLoading ? <Loading size="sm" /> : <Square className="h-5 w-5" />}
            Stop
          </Button>
        </>
      )}

      {timerState === 'PAUSED' && (
        <>
          <Button onClick={onResume} disabled={isStopLoading} variant="brand" size="lg" className="h-14 px-6">
            <Play className="h-5 w-5" />
            Resume
          </Button>
          <Button onClick={onStop} disabled={isStopLoading} variant="destructive" size="lg" className="h-14 px-6">
            {isStopLoading ? <Loading size="sm" /> : <Square className="h-5 w-5" />}
            Stop
          </Button>
          <Button onClick={onReset} disabled={isStopLoading} variant="secondary" size="lg" className="h-14 px-6">
            <RefreshCw className="h-5 w-5" />
            Reset
          </Button>
        </>
      )}
    </div>
  )
}
