interface TimerDisplayProps {
  elapsedTime: number
  timerState: 'STOPPED' | 'RUNNING' | 'PAUSED'
}

export function TimerDisplay({ elapsedTime, timerState }: TimerDisplayProps) {
  const formatTimerDisplay = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="mb-6 text-center sm:mb-8">
      <div className="text-6xl font-mono font-light tracking-tight text-zinc-900 tabular-nums">
        {formatTimerDisplay(elapsedTime)}
      </div>
      <div className="mt-2 text-xs uppercase tracking-wider text-zinc-500">
        {timerState === 'STOPPED' && 'Ready to start'}
        {timerState === 'RUNNING' && 'Timer running'}
        {timerState === 'PAUSED' && 'Paused'}
      </div>
    </div>
  )
}
