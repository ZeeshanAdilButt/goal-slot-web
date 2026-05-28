'use client'

import { cn } from '@/lib/utils'
import type {
  CoachInsightDto,
  CoachInsightKindEnum,
  CoachInsightStatusEnum,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

const KIND_LABEL: Record<CoachInsightKindEnum, string> = {
  OBSERVATION: 'Observation',
  SUGGESTION: 'Suggestion',
  EXPERIMENT: 'Experiment',
  MEDIA_PROMPT: 'Media',
}

// Kind pills all share the brand vocabulary: the high-signal ones
// (SUGGESTION, EXPERIMENT, MEDIA_PROMPT) use the dark brand pill so the
// Coach surface reads as one product instead of a rainbow of accents;
// OBSERVATION is the quieter neutral pill since it isn't actionable.
const KIND_CLASSES: Record<CoachInsightKindEnum, string> = {
  OBSERVATION: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  SUGGESTION: 'border-zinc-900 bg-zinc-900 text-[#f2cc0d]',
  EXPERIMENT: 'border-zinc-900 bg-zinc-900 text-[#f2cc0d]',
  MEDIA_PROMPT: 'border-zinc-900 bg-zinc-900 text-[#f2cc0d]',
}

interface InsightCardProps {
  insight: CoachInsightDto
  onUpdate: (status: CoachInsightStatusEnum) => void
  onDelete?: () => void
}

function ActionRow({ insight, onUpdate, onDelete }: InsightCardProps) {
  switch (insight.status) {
    case 'PROPOSED':
      return (
        <>
          <Button variant="brand" size="sm" onClick={() => onUpdate('ACCEPTED')}>
            Accept
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onUpdate('SAVED')}>
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onUpdate('DISMISSED')}>
            Dismiss
          </Button>
        </>
      )
    case 'ACCEPTED':
      return (
        <>
          <Button variant="brand" size="sm" onClick={() => onUpdate('DOING')}>
            Start doing
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onUpdate('DONE')}>
            Mark done
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onUpdate('DISMISSED')}>
            Dismiss
          </Button>
        </>
      )
    case 'DOING':
      return (
        <>
          <Button variant="brand" size="sm" onClick={() => onUpdate('DONE')}>
            Mark done
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onUpdate('ACCEPTED')}>
            Pause
          </Button>
        </>
      )
    case 'DONE':
      return (
        <Button variant="secondary" size="sm" onClick={() => onUpdate('DOING')}>
          Reopen
        </Button>
      )
    case 'SAVED':
      return (
        <>
          <Button variant="brand" size="sm" onClick={() => onUpdate('ACCEPTED')}>
            Accept
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onUpdate('DISMISSED')}>
            Dismiss
          </Button>
        </>
      )
    case 'DISMISSED':
      return (
        <>
          <Button variant="secondary" size="sm" onClick={() => onUpdate('PROPOSED')}>
            Restore
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              Delete
            </Button>
          )}
        </>
      )
    default:
      return null
  }
}

export function InsightCard({ insight, onUpdate, onDelete }: InsightCardProps) {
  const kindClass = KIND_CLASSES[insight.kind]

  return (
    <GlassCard padded={false} className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              kindClass,
            )}
          >
            {KIND_LABEL[insight.kind]}
          </span>
          {insight.kind === 'MEDIA_PROMPT' && (insight.mediaSlot || insight.mediaTopic) && (
            <span className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
              {[insight.mediaSlot, insight.mediaTopic].filter(Boolean).join(' · ')}
            </span>
          )}
          <h4 className="text-sm font-bold text-zinc-900">{insight.title}</h4>
        </div>
      </div>

      {insight.body && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{insight.body}</p>
      )}

      {insight.suggestedAction && (
        <p className="mt-2 text-sm text-zinc-800">
          <span className="font-semibold">Try: </span>
          {insight.suggestedAction}
        </p>
      )}

      {insight.evidence && (
        <blockquote className="mt-3 border-l-2 border-zinc-200 pl-3 text-xs italic text-zinc-500">
          {insight.evidence}
        </blockquote>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ActionRow insight={insight} onUpdate={onUpdate} onDelete={onDelete} />
      </div>
    </GlassCard>
  )
}
