import React from 'react'

import clsx from 'clsx'

import { Button, ButtonProps } from '@/components/ui/button'

// Minimal wrapper to adapt existing Button to feedback component's API
export interface Button1Props extends Omit<ButtonProps, 'variant' | 'size' | 'type'> {
  type?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'warning'
  size?: 'tiny' | 'small' | 'medium' | 'large'
  variant?: 'styled' | 'unstyled'
  svgOnly?: boolean
  shape?: 'square' | 'circle' | 'rounded'
  htmlType?: 'button' | 'submit' | 'reset'
}

export const Button1 = React.forwardRef<HTMLButtonElement, Button1Props>(
  (
    {
      type = 'primary',
      size = 'medium',
      variant,
      svgOnly = false,
      shape = 'square',
      htmlType,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    // Map feedback component's API to existing Button
    const buttonVariant =
      variant === 'unstyled' ? 'ghost' : type === 'secondary' ? 'secondary' : type === 'tertiary' ? 'ghost' : 'default'
    const sizeMap = {
      tiny: 'sm',
      small: 'sm',
      medium: 'default',
      large: 'lg',
    } as const

    return (
      <Button
        ref={ref}
        variant={buttonVariant}
        size={sizeMap[size]}
        type={htmlType}
        className={clsx(
          svgOnly && 'p-0',
          shape === 'rounded' && 'rounded-full',
          shape === 'circle' && 'rounded-full',
          variant === 'unstyled' && 'bg-transparent outline-none hover:bg-transparent',
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    )
  },
)

Button1.displayName = 'Button1'
