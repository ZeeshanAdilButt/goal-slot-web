'use client'

import { ReactNode } from 'react'

import { motion, type Transition } from 'framer-motion'

type TransitionWithInfinity = {
  repeat?: number | 'Infinity'
  duration?: number
  delay?: number
  [key: string]: any
}

interface AnimatedSectionProps {
  children: ReactNode
  initial?: { opacity?: number; x?: number; y?: number; scale?: number }
  animate?: { opacity?: number; x?: number; y?: number; scale?: number } | { [key: string]: any }
  whileInView?: { opacity?: number; x?: number; y?: number; scale?: number }
  viewport?: { once?: boolean }
  transition?: TransitionWithInfinity
  className?: string
}

// Helper to convert 'Infinity' string to Infinity number for framer-motion
function normalizeTransition(transition?: AnimatedSectionProps['transition']): Transition | undefined {
  if (!transition) return transition
  const { repeat, ...rest } = transition
  if (repeat === 'Infinity') {
    return { ...rest, repeat: Infinity } as Transition
  }
  return { ...rest, repeat } as Transition
}

export function AnimatedSection({
  children,
  initial,
  animate,
  whileInView,
  viewport,
  transition,
  className,
}: AnimatedSectionProps) {
  const normalizedTransition = normalizeTransition(transition)

  return (
    <motion.div
      initial={initial}
      animate={animate}
      whileInView={whileInView}
      viewport={viewport}
      transition={normalizedTransition}
      className={className}
    >
      {children}
    </motion.div>
  )
}
