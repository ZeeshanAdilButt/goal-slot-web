'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

const PALETTE = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-pink-500',
]

function hashColor(email: string): string {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]
}

async function md5(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const SIZE_CLASSES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
}

interface UserAvatarProps {
  user: { name?: string | null; email: string; avatarUrl?: string | null }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const initial = user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()
  const color = hashColor(user.email)
  const sizeClass = SIZE_CLASSES[size]

  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null)
  const [gravatarFailed, setGravatarFailed] = useState(false)

  useEffect(() => {
    if (user.avatarUrl) return
    md5(user.email.trim().toLowerCase()).then((hash) => {
      setGravatarUrl(`https://www.gravatar.com/avatar/${hash}?d=404`)
    })
  }, [user.email, user.avatarUrl])

  // Priority 1: uploaded avatar
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name || user.email}
        className={cn('shrink-0 rounded-full object-cover', sizeClass, className)}
      />
    )
  }

  // Priority 2: Gravatar
  if (gravatarUrl && !gravatarFailed) {
    return (
      <img
        src={gravatarUrl}
        alt={user.name || user.email}
        onError={() => setGravatarFailed(true)}
        className={cn('shrink-0 rounded-full object-cover', sizeClass, className)}
      />
    )
  }

  // Priority 3: colored initial (also shown while gravatar URL is loading)
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        sizeClass,
        color,
        className,
      )}
    >
      {initial}
    </span>
  )
}
