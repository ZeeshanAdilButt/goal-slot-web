import { motion } from 'framer-motion'
import { Pause, Play, RefreshCw, Square } from 'lucide-react'

interface TimerControlsProps {
  timerState: 'STOPPED' | 'RUNNING' | 'PAUSED'
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
}

export function TimerControls({
  timerState,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
}: TimerControlsProps) {
  return (
    <div className="flex justify-center gap-4">
      {timerState === 'STOPPED' && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="flex h-20 w-20 items-center justify-center border-4 border-white bg-primary text-secondary shadow-brutal"
        >
          <Play className="h-10 w-10" />
        </motion.button>
      )}

      {timerState === 'RUNNING' && (
        <>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPause}
            className="flex h-16 w-16 items-center justify-center border-4 border-white bg-accent-orange text-white shadow-brutal"
          >
            <Pause className="h-8 w-8" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStop}
            className="flex h-16 w-16 items-center justify-center border-4 border-white bg-red-500 text-white shadow-brutal"
          >
            <Square className="h-8 w-8" />
          </motion.button>
        </>
      )}

      {timerState === 'PAUSED' && (
        <>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onResume}
            className="flex h-16 w-16 items-center justify-center border-4 border-white bg-primary text-secondary shadow-brutal"
          >
            <Play className="h-8 w-8" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStop}
            className="flex h-16 w-16 items-center justify-center border-4 border-white bg-accent-green text-white shadow-brutal"
          >
            <Square className="h-8 w-8" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="flex h-16 w-16 items-center justify-center border-4 border-white bg-gray-500 text-white shadow-brutal"
          >
            <RefreshCw className="h-8 w-8" />
          </motion.button>
        </>
      )}
    </div>
  )
}
