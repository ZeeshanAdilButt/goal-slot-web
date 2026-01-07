import {
  EmojiButton,
  HateIcon,
  ItsOkayIcon,
  LoveItIcon,
  NotGreaterIcon,
} from '@/features/feedback/components/feedback-icons'
import clsx from 'clsx'

interface FeedbackEmojiSelectorProps {
  selectedEmoji: number | null
  onEmojiSelect: (emoji: number | null) => void
  variant?: 'default' | 'inline'
}

export const FeedbackEmojiSelector = ({
  selectedEmoji,
  onEmojiSelect,
  variant = 'default',
}: FeedbackEmojiSelectorProps) => {
  return (
    <span
      className={clsx('flex cursor-pointer items-center', variant === 'inline' ? 'gap-[1px]' : 'justify-start gap-0')}
    >
      <EmojiButton
        emoji={0}
        selectedEmoji={selectedEmoji}
        onSelect={onEmojiSelect}
        icon={
          <LoveItIcon
            pathClassName={clsx(
              'duration-200 group-hover:fill-blue-900',
              selectedEmoji === 0 ? 'fill-blue-900' : 'fill-amber-800',
            )}
          />
        }
      />
      <EmojiButton emoji={1} selectedEmoji={selectedEmoji} onSelect={onEmojiSelect} icon={<ItsOkayIcon />} />
      <EmojiButton emoji={2} selectedEmoji={selectedEmoji} onSelect={onEmojiSelect} icon={<NotGreaterIcon />} />
      <EmojiButton emoji={3} selectedEmoji={selectedEmoji} onSelect={onEmojiSelect} icon={<HateIcon />} />
    </span>
  )
}
