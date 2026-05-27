'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Kbd } from '@/components/ui/kbd'

export type RecommendationKind = 'INTERVENTION' | 'FRICTION_BLOCK' | 'INSIGHT' | 'CHALLENGE'

export interface RecommendationCardProps {
  kind: RecommendationKind
  title: React.ReactNode
  body: React.ReactNode
  onAccept?: () => void
  onDismiss?: () => void
  className?: string
}

const kindAccent: Record<RecommendationKind, string> = {
  INTERVENTION: 'border-l-4 border-l-[#f2cc0d]',
  FRICTION_BLOCK: 'border-l-4 border-l-rose-400',
  INSIGHT: 'border-l-4 border-l-emerald-400',
  CHALLENGE: 'border-l-4 border-l-violet-400',
}

function RecommendationCard({
  kind,
  title,
  body,
  onAccept,
  onDismiss,
  className,
}: RecommendationCardProps) {
  return (
    <GlassCard padded={false} hover={false} className={cn('p-5 flex flex-col gap-3', kindAccent[kind], className)}>
      <div className="flex items-center gap-2">
        <Kbd>{kind}</Kbd>
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
        <p className="text-sm text-zinc-600 leading-relaxed">{body}</p>
      </div>
      {(onAccept || onDismiss) && (
        <div className="flex items-center gap-2 pt-1">
          {onAccept && (
            <Button size="sm" variant="brand" onClick={onAccept}>
              Accept
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      )}
    </GlassCard>
  )
}

export { RecommendationCard }
