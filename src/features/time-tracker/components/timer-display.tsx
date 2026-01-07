import { motion } from 'framer-motion'

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
      <motion.div
        className="font-mono text-5xl font-bold tracking-wider sm:text-6xl md:text-7xl lg:text-8xl"
        animate={timerState === 'RUNNING' ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 1, repeat: timerState === 'RUNNING' ? Infinity : 0 }}
      >
        {formatTimerDisplay(elapsedTime)}
      </motion.div>
      <div className="mt-2 font-mono text-sm opacity-75 sm:text-base md:text-lg">
        {timerState === 'STOPPED' && 'Ready to start'}
        {timerState === 'RUNNING' && '⏱ Timer running...'}
        {timerState === 'PAUSED' && '⏸ Paused'}
      </div>
    </div>
  )
}
