'use client'

import { useEffect, useRef, useState } from 'react'

import { FeedbackForm } from '@/features/feedback/components/feedback-form'
import { Button1 } from '@/features/feedback/components/ui/button-1'
import { Material } from '@/features/feedback/components/ui/material-1'
import clsx from 'clsx'
import { MessageSquare } from 'lucide-react'

import { useClickOutside } from '@/hooks/use-click-outside'

interface FeedbackButtonDefaultProps {
  label: string
}

export const FeedbackButtonDefault = ({ label }: FeedbackButtonDefaultProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [position, setPosition] = useState<React.CSSProperties>({})
  const inputRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const getPosition = () => {
      if (isOpen && inputRef && inputRef.current && menuRef.current) {
        const buttonRect = inputRef.current.getBoundingClientRect()
        const menuHeight = menuRef.current.offsetHeight

        // Always position above the button for bottom-right placement
        // Align to the right edge of the button
        const _position: React.CSSProperties = {
          bottom: buttonRect.height + 8,
          right: 0,
        }

        // If not enough space above, limit the height
        if (buttonRect.top - menuHeight < 8) {
          _position.maxHeight = `${buttonRect.top - 8}px`
          _position.overflowY = 'auto'
        }

        setPosition(_position)
      }
    }

    getPosition()

    window.addEventListener('resize', getPosition)
    window.addEventListener('scroll', getPosition)

    return () => {
      window.removeEventListener('resize', getPosition)
      window.removeEventListener('scroll', getPosition)
    }
  }, [isOpen])

  useClickOutside(menuRef, () => setIsOpen(false))

  const handleSuccess = () => {
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button1
        type="secondary"
        size="small"
        ref={inputRef}
        onClick={() => setIsOpen(true)}
        className="!h-10 !w-10 !p-0 font-medium md:!h-auto md:!w-auto md:!px-4 md:!py-2"
        title={label}
      >
        <MessageSquare className="h-5 w-5 md:hidden" />
        <span className="hidden md:inline">{label}</span>
      </Button1>
      <Material
        type="menu"
        className={clsx(
          'absolute w-[340px] font-sans duration-200',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        style={{ ...position }}
        ref={menuRef}
      >
        <FeedbackForm onSuccess={handleSuccess} variant="default" />
      </Material>
    </div>
  )
}
