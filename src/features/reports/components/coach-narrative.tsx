'use client'

import { useCoachNarrative } from '@/features/reports/hooks/use-coach-narrative'
import { toast } from 'react-hot-toast'

import { GlassCard } from '@/components/ui/glass-card'
import { RecommendationCard } from '@/components/ui/recommendation-card'
import { SectionHeader } from '@/components/ui/section-header'
import { SocraticQuote } from '@/components/ui/socratic-quote'

interface CoachNarrativeProps {
  reportPeriodKey: string
}

export function CoachNarrative({ reportPeriodKey }: CoachNarrativeProps) {
  const { narrative, status, recommendations, dismiss } = useCoachNarrative(reportPeriodKey)

  return (
    <GlassCard padded className="space-y-5">
      <SectionHeader title={`Coach narrative · ${reportPeriodKey}`} />

      <SocraticQuote>
        {narrative || ' '}
        {status === 'streaming' && (
          <span className="ml-0.5 inline-block w-2 h-4 align-middle bg-zinc-400 animate-pulse" aria-hidden="true" />
        )}
      </SocraticQuote>

      {status === 'done' && recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              kind={rec.kind}
              title={rec.title}
              body={rec.body}
              onAccept={() => {
                toast.success('Added to your plan')
                dismiss(rec.id)
              }}
              onDismiss={() => {
                dismiss(rec.id)
                toast('Dismissed')
              }}
            />
          ))}
        </div>
      )}
    </GlassCard>
  )
}
