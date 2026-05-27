'use client'

import Link from 'next/link'

import { PROVIDER_META, useByokKey } from '@/features/settings/hooks/use-byok-key'
import { KeyRound, MessageCircle, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { GlassCard } from '@/components/ui/glass-card'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'
import { SectionHeader } from '@/components/ui/section-header'

export function CoachPage() {
  const { status, provider } = useByokKey()
  const hasKey = status === 'active'
  const providerLabel = PROVIDER_META[provider].label

  return (
    <PageShell>
      <PageHeader
        title="Coach"
        eyebrow="Insights"
        description="Your Socratic productivity coach — reads your goals, time, schedule, check-ins, journal, and Habits Profile to surface patterns and ask the questions that matter."
        actions={
          hasKey ? (
            <Badge variant="success">{providerLabel} · Connected</Badge>
          ) : (
            <Badge variant="default">Not configured</Badge>
          )
        }
      />

      {!hasKey && (
        <GlassCard padded>
          <EmptyState
            icon={<KeyRound />}
            title="Connect a key to unlock the Coach"
            description={
              <>
                The Coach runs on your own OpenAI or Anthropic API key — your data never leaves your browser
                without it. Add a key in Settings → Integrations to start.
              </>
            }
            action={
              <Link href="/dashboard/settings?tab=integrations">
                <Button variant="brand">Open Integrations →</Button>
              </Link>
            }
          />
        </GlassCard>
      )}

      {hasKey && (
        <>
          <GlassCard padded className="space-y-3">
            <SectionHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Your week, in narrative
                </span>
              }
              action={<Badge variant="brand">Coming soon</Badge>}
            />
            <p className="text-sm leading-relaxed text-zinc-600">
              Every week (and every month), the Coach will write a plain-English narrative of how you spent your
              time, what worked, what blocked you, and the smallest friction to remove next. Then it will ask one
              Socratic question to keep you honest.
            </p>
            <p className="text-xs text-zinc-500">
              We&apos;re wiring this to your {providerLabel} key right now. Once it ships, narratives will stream in
              here and on each report period.
            </p>
          </GlassCard>

          <GlassCard padded className="space-y-3">
            <SectionHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Ask the Coach
                </span>
              }
              action={<Badge variant="brand">Coming soon</Badge>}
            />
            <p className="text-sm leading-relaxed text-zinc-600">
              A persistent chat with the Coach scoped to a report period. Ask things like &ldquo;why was Wednesday
              bad?&rdquo;, &ldquo;suggest next week&apos;s schedule,&rdquo; or &ldquo;where am I leaking time?&rdquo; —
              and the Coach will probe back with the questions that actually move the needle (sleep, environment,
              friction).
            </p>
            <p className="text-xs text-zinc-500">
              We don&apos;t show fabricated chat replies. The conversation will go live the moment the backend
              streaming endpoint ships.
            </p>
          </GlassCard>
        </>
      )}
    </PageShell>
  )
}
