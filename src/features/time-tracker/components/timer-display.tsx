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
    <div className="mb-8 text-center">
      <motion.div
        className="font-mono text-7xl font-bold tracking-wider md:text-8xl"
        animate={timerState === 'RUNNING' ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 1, repeat: timerState === 'RUNNING' ? Infinity : 0 }}
      >
        {formatTimerDisplay(elapsedTime)}
      </motion.div>
      <div className="mt-2 font-mono text-lg opacity-75">
        {timerState === 'STOPPED' && 'Ready to start'}
        {timerState === 'RUNNING' && '⏱ Timer running...'}
        {timerState === 'PAUSED' && '⏸ Paused'}
      </div>
    </div>
  )
}
