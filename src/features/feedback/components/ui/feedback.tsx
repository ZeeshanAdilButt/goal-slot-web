'use client'

import React, { useEffect, useRef, useState } from 'react'

import { Button1 } from '@/features/feedback/components/ui/button-1'
import { Material } from '@/features/feedback/components/ui/material-1'
import clsx from 'clsx'
import { MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

import { feedbackApi } from '@/lib/api'
import { useClickOutside } from '@/hooks/use-click-outside'
import { Textarea } from '@/components/ui/textarea'

interface FeedbackProps {
  label: string
  type?: 'default' | 'inline'
}

const MSupportedIcon = () => (
  <svg fill="none" height="14" viewBox="0 0 22 14" width="22" xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M19.5 1.25H2.5C1.80964 1.25 1.25 1.80964 1.25 2.5V11.5C1.25 12.1904 1.80964 12.75 2.5 12.75H19.5C20.1904 12.75 20.75 12.1904 20.75 11.5V2.5C20.75 1.80964 20.1904 1.25 19.5 1.25ZM2.5 0C1.11929 0 0 1.11929 0 2.5V11.5C0 12.8807 1.11929 14 2.5 14H19.5C20.8807 14 22 12.8807 22 11.5V2.5C22 1.11929 20.8807 0 19.5 0H2.5ZM3 3.5H4H4.25H4.6899L4.98715 3.82428L7 6.02011L9.01285 3.82428L9.3101 3.5H9.75H10H11V4.5V10.5H9V6.79807L7.73715 8.17572L7 8.97989L6.26285 8.17572L5 6.79807V10.5H3V4.5V3.5ZM15 7V3.5H17V7H19.5L17 9.5L16 10.5L15 9.5L12.5 7H15Z"
      fill="var(--ds-gray-700)"
      fillRule="evenodd"
    />
  </svg>
)

const LoveItIcon = ({ pathClassName }: { pathClassName: string }) => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM4.5 8.97498H3.875V9.59998C3.875 11.4747 5.81046 12.8637 7.99817 12.8637C10.1879 12.8637 12.125 11.4832 12.125 9.59998V8.97498H11.5H4.5ZM7.99817 11.6137C6.59406 11.6137 5.63842 10.9482 5.28118 10.225H10.7202C10.3641 10.9504 9.40797 11.6137 7.99817 11.6137Z"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.15295 4.92093L5.375 3.5L4.59705 4.92093L3 5.21885L4.11625 6.39495L3.90717 8L5.375 7.30593L6.84283 8L6.63375 6.39495L7.75 5.21885L6.15295 4.92093ZM11.403 4.92093L10.625 3.5L9.84705 4.92093L8.25 5.21885L9.36625 6.39495L9.15717 8L10.625 7.30593L12.0928 8L11.8837 6.39495L13 5.21885L11.403 4.92093Z"
      className={pathClassName}
    />
  </svg>
)

const ItsOkayIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM11.5249 10.8478L11.8727 10.3286L10.8342 9.6329L10.4863 10.1522C9.94904 10.9543 9.0363 11.4802 8.00098 11.4802C6.96759 11.4802 6.05634 10.9563 5.51863 10.1567L5.16986 9.63804L4.13259 10.3356L4.48137 10.8542C5.2414 11.9844 6.53398 12.7302 8.00098 12.7302C9.47073 12.7302 10.7654 11.9816 11.5249 10.8478ZM6.75 6.75C6.75 7.30228 6.30228 7.75 5.75 7.75C5.19772 7.75 4.75 7.30228 4.75 6.75C4.75 6.19772 5.19772 5.75 5.75 5.75C6.30228 5.75 6.75 6.19772 6.75 6.75ZM10.25 7.75C10.8023 7.75 11.25 7.30228 11.25 6.75C11.25 6.19772 10.8023 5.75 10.25 5.75C9.69771 5.75 9.25 6.19772 9.25 6.75C9.25 7.30228 9.69771 7.75 10.25 7.75Z"
    />
  </svg>
)

const NotGreaterIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM5.75 7.75C6.30228 7.75 6.75 7.30228 6.75 6.75C6.75 6.19772 6.30228 5.75 5.75 5.75C5.19772 5.75 4.75 6.19772 4.75 6.75C4.75 7.30228 5.19772 7.75 5.75 7.75ZM11.25 6.75C11.25 7.30228 10.8023 7.75 10.25 7.75C9.69771 7.75 9.25 7.30228 9.25 6.75C9.25 6.19772 9.69771 5.75 10.25 5.75C10.8023 5.75 11.25 6.19772 11.25 6.75ZM11.5249 11.2622L11.8727 11.7814L10.8342 12.4771L10.4863 11.9578C9.94904 11.1557 9.0363 10.6298 8.00098 10.6298C6.96759 10.6298 6.05634 11.1537 5.51863 11.9533L5.16986 12.4719L4.13259 11.7744L4.48137 11.2558C5.2414 10.1256 6.53398 9.37982 8.00098 9.37982C9.47073 9.37982 10.7654 10.1284 11.5249 11.2622Z"
    />
  </svg>
)

const HateIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path fillRule="evenodd" clipRule="evenodd" d="M4 9V16H5.5V9H4ZM12 9V16H10.5V9H12Z" fill="var(--ds-blue-700)" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8C14.5 9.57941 13.9367 11.0273 13 12.1536V14.2454C14.8289 12.7793 16 10.5264 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 10.5264 1.17107 12.7793 3 14.2454V12.1536C2.06332 11.0273 1.5 9.57941 1.5 8ZM8 14.5C8.51627 14.5 9.01848 14.4398 9.5 14.3261V15.8596C9.01412 15.9518 8.51269 16 8 16C7.48731 16 6.98588 15.9518 6.5 15.8596V14.3261C6.98152 14.4398 7.48373 14.5 8 14.5ZM3.78568 8.36533C4.15863 7.98474 4.67623 7.75 5.25 7.75C5.82377 7.75 6.34137 7.98474 6.71432 8.36533L7.78568 7.31548C7.14222 6.65884 6.24318 6.25 5.25 6.25C4.25682 6.25 3.35778 6.65884 2.71432 7.31548L3.78568 8.36533ZM10.75 7.75C10.1762 7.75 9.65863 7.98474 9.28568 8.36533L8.21432 7.31548C8.85778 6.65884 9.75682 6.25 10.75 6.25C11.7432 6.25 12.6422 6.65884 13.2857 7.31548L12.2143 8.36533C11.8414 7.98474 11.3238 7.75 10.75 7.75ZM6.25 12H9.75C9.75 11.0335 8.9665 10.25 8 10.25C7.0335 10.25 6.25 11.0335 6.25 12Z"
    />
  </svg>
)

const Default = ({ label }: { label: string }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [position, setPosition] = useState<React.CSSProperties>({})
  const inputRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const getPosition = () => {
      if (isOpen && inputRef && inputRef.current && menuRef.current) {
        const buttonRect = inputRef.current.getBoundingClientRect()
        const menuHeight = menuRef.current.offsetHeight
        const menuWidth = menuRef.current.offsetWidth
        const viewportHeight = window.innerHeight

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Don't submit if neither emoji nor text is provided
    if (selectedEmoji === null && !feedbackText.trim()) {
      toast.error('Please provide feedback or select an emoji')
      return
    }

    setIsSubmitting(true)

    try {
      await feedbackApi.create({
        emoji: selectedEmoji ?? undefined,
        text: feedbackText.trim() || undefined,
      })

      toast.success('Thank you for your feedback!')
      setIsOpen(false)
      setSelectedEmoji(null)
      setFeedbackText('')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
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
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2 p-2">
            <Textarea
              placeholder="Your feedback..."
              className="h-[100px]"
              value={feedbackText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedbackText(e.target.value)}
            />
            <div className="ml-auto flex items-center gap-1 text-sm text-gray-900">
              <MSupportedIcon /> supported.
            </div>
          </div>
          <div
            className="flex justify-between border-t p-3"
            style={{ backgroundColor: 'var(--accents-1)', borderColor: 'var(--accents-2)' }}
          >
            <span className="flex cursor-pointer items-center justify-start">
              <Button1
                variant="unstyled"
                svgOnly
                shape="rounded"
                className={clsx(
                  'group !h-8 !w-8 p-0 duration-200 hover:!bg-blue-300 hover:fill-blue-900',
                  selectedEmoji === 0 ? '!bg-blue-300 fill-blue-900' : 'bg-transparent fill-gray-900',
                )}
                onClick={(event) => {
                  event.preventDefault()
                  setSelectedEmoji(selectedEmoji === 0 ? null : 0)
                }}
              >
                <LoveItIcon
                  pathClassName={clsx(
                    'duration-200 group-hover:fill-blue-900',
                    selectedEmoji === 0 ? 'fill-blue-900' : 'fill-amber-800',
                  )}
                />
              </Button1>
              <Button1
                variant="unstyled"
                svgOnly
                shape="rounded"
                className={clsx(
                  '!h-8 !w-8 p-0 duration-200 hover:!bg-blue-300 hover:fill-blue-900',
                  selectedEmoji === 1 ? '!bg-blue-300 fill-blue-900' : 'bg-transparent fill-gray-900',
                )}
                onClick={(event) => {
                  event.preventDefault()
                  setSelectedEmoji(selectedEmoji === 1 ? null : 1)
                }}
              >
                <ItsOkayIcon />
              </Button1>
              <Button1
                variant="unstyled"
                svgOnly
                shape="rounded"
                className={clsx(
                  '!h-8 !w-8 p-0 duration-200 hover:!bg-blue-300 hover:fill-blue-900',
                  selectedEmoji === 2 ? '!bg-blue-300 fill-blue-900' : 'bg-transparent fill-gray-900',
                )}
                onClick={(event) => {
                  event.preventDefault()
                  setSelectedEmoji(selectedEmoji === 2 ? null : 2)
                }}
              >
                <NotGreaterIcon />
              </Button1>
              <Button1
                variant="unstyled"
                svgOnly
                shape="rounded"
                className={clsx(
                  '!h-8 !w-8 p-0 duration-200 hover:!bg-blue-300 hover:fill-blue-900',
                  selectedEmoji === 3 ? '!bg-blue-300 fill-blue-900' : 'bg-transparent fill-gray-900',
                )}
                onClick={(event) => {
                  event.preventDefault()
                  setSelectedEmoji(selectedEmoji === 3 ? null : 3)
                }}
              >
                <HateIcon />
              </Button1>
            </span>
            <Button1 size="small" htmlType="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button1>
          </div>
        </form>
      </Material>
    </div>
  )
}

const Inline = ({ label }: { label: string }) => {
  const [expanded, setExpanded] = useState<boolean>(false)
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null)
  const [feedbackText, setFeedbackText] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (expanded) {
      setShowContent(true)
      textAreaRef.current?.focus()
    } else {
      const timeout = setTimeout(() => setShowContent(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [expanded])

  useClickOutside(ref, () => {
    setExpanded(false)
    setSelectedEmoji(null)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Don't submit if neither emoji nor text is provided
    if (selectedEmoji === null && !feedbackText.trim()) {
      toast.error('Please provide feedback or select an emoji')
      return
    }

    setIsSubmitting(true)

    try {
      await feedbackApi.create({
        emoji: selectedEmoji ?? undefined,
        text: feedbackText.trim() || undefined,
      })

      toast.success('Thank you for your feedback!')
      setExpanded(false)
      setSelectedEmoji(null)
      setFeedbackText('')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={clsx(
        'bg-background-100 flex w-fit flex-col justify-start overflow-hidden shadow-border-small duration-200',
        expanded ? 'max-h-[243px] rounded-xl' : 'max-h-12 rounded-[30px]',
      )}
      ref={ref}
    >
      <div
        className={clsx('flex items-center justify-center gap-2 py-2 pl-4 pr-2 duration-200', expanded && '!px-[60px]')}
      >
        <p className="text-sm text-gray-900">{label}</p>
        <div className="flex justify-between">
          <span className="flex cursor-pointer items-center gap-[1px]">
            <Button1
              variant="unstyled"
              svgOnly
              shape="rounded"
              className={clsx(
                'group !h-8 !w-8 p-0 duration-200 hover:!bg-blue-300 hover:fill-blue-900',
                selectedEmoji === 0 ? '!bg-blue-300 fill-blue-900' : 'bg-transparent fill-gray-900',
              )}
              onClick={(event) => {
                event.preventDefault()
                setSelectedEmoji(selectedEmoji === 0 ? null : 0)
                setExpanded(selectedEmoji !== 0)
              }}
            >
              <LoveItIcon
                pathClassName={clsx(
                  'duration-200 group-hover:fill-blue-900',
                  selectedEmoji === 0 ? 'fill-blue-900' : 'fill-amber-800',
                )}
              />
            </Button1>
            <Button1
              variant="unstyled"
              svgOnly
              shape="rounded"
              className={clsx(
                '!h-8 !w-8 p-0 duration-200 hover:!bg-blue-300 hover:fill-blue-900',
                selectedEmoji === 1 ? '!bg-blue-300 fill-blue-900' : 'bg-transparent fill-gray-900',
              )}
              onClick={(event) => {
                event.preventDefault()
                setSelectedEmoji(selectedEmoji === 1 ? null : 1)
                setExpanded(selectedEmoji !== 1)
              }}
            >
              <ItsOkayIcon />
            </Button1>
            <Button1
              variant="unstyled"
              svgOnly
              shape="rounded"
              className={clsx(
                '!h-8 !w-8 p-0 duration-200 hover:!bg-blue-300 hover:fill-blue-900',
                selectedEmoji === 2 ? '!bg-blue-300 fill-blue-900' : 'bg-transparent fill-gray-900',
              )}
              onClick={(event) => {
                event.preventDefault()
                setSelectedEmoji(selectedEmoji === 2 ? null : 2)
                setExpanded(selectedEmoji !== 2)
              }}
            >
              <NotGreaterIcon />
            </Button1>
            <Button1
              variant="unstyled"
              svgOnly
              shape="rounded"
              className={clsx(
                '!h-8 !w-8 p-0 duration-200 hover:!bg-blue-300 hover:fill-blue-900',
                selectedEmoji === 3 ? '!bg-blue-300 fill-blue-900' : 'bg-transparent fill-gray-900',
              )}
              onClick={(event) => {
                event.preventDefault()
                setSelectedEmoji(selectedEmoji === 3 ? null : 3)
                setExpanded(selectedEmoji !== 3)
              }}
            >
              <HateIcon />
            </Button1>
          </span>
        </div>
      </div>
      {showContent && (
        <form onSubmit={handleSubmit} className="w-full opacity-100 transition-opacity duration-300">
          <div className="flex w-full flex-col gap-2 p-2">
            <Textarea
              placeholder="Your feedback..."
              className="h-[100px]"
              ref={textAreaRef}
              value={feedbackText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedbackText(e.target.value)}
            />
            <div className="ml-auto flex items-center gap-1 text-xs text-gray-900">
              <MSupportedIcon /> supported.
            </div>
          </div>
          <div
            className="flex justify-end border-t p-3"
            style={{ backgroundColor: 'var(--accents-1)', borderColor: 'var(--accents-2)' }}
          >
            <Button1 size="small" htmlType="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button1>
          </div>
        </form>
      )}
    </div>
  )
}

export const Feedback = ({ type = 'default', label }: FeedbackProps) => {
  return type === 'default' || type === undefined ? <Default label={label} /> : <Inline label={label} />
}
