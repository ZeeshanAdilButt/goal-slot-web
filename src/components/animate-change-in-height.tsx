'use client'

import React, { useState } from 'react'

import clsx from 'clsx'
import { motion } from 'framer-motion'

/**
 * Animates the height of a component when its content changes.
 *
 * @remarks
 *
 * This component uses a `ResizeObserver` to detect changes in the height of its children.
 * When the height changes, the component will animate from the old height to the new height.
 * Ensure no padding is applied to the div that is being animated.
 *
 * */
export default function AnimateChangeInHeight(
  props: React.ComponentPropsWithRef<typeof motion.div> & {
    children: React.ReactNode
  },
) {
  const { children, className, ...restProps } = props
  const [height, setHeight] = useState<number | 'auto'>('auto')

  return (
    <motion.div
      animate={{ height }}
      className={clsx(className, 'overflow-hidden')}
      style={{ height }}
      transition={{ duration: 0.2 }}
      {...restProps}
    >
      <div
        ref={(ref) => {
          const resizeObserver = new ResizeObserver(([entry]) => {
            const observedHeight = entry.contentRect.height
            setHeight(observedHeight)
          })

          if (ref) {
            resizeObserver.observe(ref)
          }

          return () => {
            resizeObserver.disconnect()
          }
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}
