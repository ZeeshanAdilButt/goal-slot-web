import { motion } from 'framer-motion'
import { Pause, Play, RefreshCw, Square } from 'lucide-react'

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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="flex h-16 w-16 items-center justify-center border-4 border-white bg-primary text-secondary shadow-brutal sm:h-20 sm:w-20"
        >
          <Play className="h-8 w-8 sm:h-10 sm:w-10" />
        </motion.button>
      )}

      {timerState === 'RUNNING' && (
        <>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPause}
            disabled={isStopLoading}
            className="flex h-14 w-14 items-center justify-center border-4 border-white bg-accent-orange text-white shadow-brutal disabled:opacity-50 sm:h-16 sm:w-16"
          >
            <Pause className="h-6 w-6 sm:h-8 sm:w-8" />
          </motion.button>
          <motion.button
            whileHover={isStopLoading ? {} : { scale: 1.05 }}
            whileTap={isStopLoading ? {} : { scale: 0.95 }}
            onClick={onStop}
            disabled={isStopLoading}
            className="flex h-14 w-14 items-center justify-center border-4 border-white bg-red-500 text-white shadow-brutal disabled:opacity-70 sm:h-16 sm:w-16"
          >
            {isStopLoading ? <Loading size="sm" className="h-6 w-6 sm:h-8 sm:w-8" /> : <Square className="h-6 w-6 sm:h-8 sm:w-8" />}
          </motion.button>
        </>
      )}

      {timerState === 'PAUSED' && (
        <>
          <motion.button
            whileHover={isStopLoading ? {} : { scale: 1.05 }}
            whileTap={isStopLoading ? {} : { scale: 0.95 }}
            onClick={onResume}
            disabled={isStopLoading}
            className="flex h-14 w-14 items-center justify-center border-4 border-white bg-primary text-secondary shadow-brutal disabled:opacity-50 sm:h-16 sm:w-16"
          >
            <Play className="h-6 w-6 sm:h-8 sm:w-8" />
          </motion.button>
          <motion.button
            whileHover={isStopLoading ? {} : { scale: 1.05 }}
            whileTap={isStopLoading ? {} : { scale: 0.95 }}
            onClick={onStop}
            disabled={isStopLoading}
            className="flex h-14 w-14 items-center justify-center border-4 border-white bg-accent-green text-white shadow-brutal disabled:opacity-70 sm:h-16 sm:w-16"
          >
            {isStopLoading ? <Loading size="sm" className="h-6 w-6 sm:h-8 sm:w-8" /> : <Square className="h-6 w-6 sm:h-8 sm:w-8" />}
          </motion.button>
          <motion.button
            whileHover={isStopLoading ? {} : { scale: 1.05 }}
            whileTap={isStopLoading ? {} : { scale: 0.95 }}
            onClick={onReset}
            disabled={isStopLoading}
            className="flex h-14 w-14 items-center justify-center border-4 border-white bg-gray-500 text-white shadow-brutal disabled:opacity-50 sm:h-16 sm:w-16"
          >
            <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8" />
          </motion.button>
        </>
      )}
    </div>
  )
}
