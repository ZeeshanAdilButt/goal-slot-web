import { cn } from '@/lib/utils'

export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const SIZES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-7 w-7 text-[11px]',
} as const

interface MemberAvatarProps {
  name: string | null | undefined
  avatar?: string | null
  size?: keyof typeof SIZES
  className?: string
  /** Decorative when the name is printed next to it. */
  decorative?: boolean
}

export function MemberAvatar({ name, avatar, size = 'sm', className, decorative = false }: MemberAvatarProps) {
  const label = decorative ? undefined : name || 'Unknown member'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-900 font-bold text-white',
        SIZES[size],
        className,
      )}
      title={decorative ? undefined : (name ?? undefined)}
      role={decorative ? undefined : 'img'}
      aria-label={label}
      aria-hidden={decorative ? true : undefined}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  )
}

interface AvatarStackProps {
  members: Array<{ userId: string; name: string; avatar?: string | null }>
  max?: number
  className?: string
}

export function AvatarStack({ members, max = 4, className }: AvatarStackProps) {
  const shown = members.slice(0, max)
  const extra = members.length - shown.length
  return (
    <div
      className={cn('flex items-center pl-1.5', className)}
      role="group"
      aria-label={`${members.length} ${members.length === 1 ? 'member' : 'members'}`}
    >
      {shown.map((m) => (
        <MemberAvatar key={m.userId} name={m.name} avatar={m.avatar} size="md" className="-ml-1.5 border-2 border-white" />
      ))}
      {extra > 0 ? (
        <span
          className="-ml-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-100 text-[11px] font-bold text-zinc-700"
          aria-hidden
        >
          +{extra}
        </span>
      ) : null}
    </div>
  )
}

export function ProjectSwatch({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn('inline-block shrink-0 rounded', className)} style={{ background: color }} />
}

export function ProjectChip({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700',
        className,
      )}
      title={`Project: ${name}`}
    >
      <ProjectSwatch color={color} className="h-2 w-2 rounded-sm" />
      <span className="truncate">{name}</span>
    </span>
  )
}
