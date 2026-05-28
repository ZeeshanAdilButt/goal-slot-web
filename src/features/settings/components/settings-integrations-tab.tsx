'use client'

import { useState } from 'react'

import { ByokProvider, PROVIDER_META, useByokKey } from '@/features/settings/hooks/use-byok-key'
import { KeyRound, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '@/components/ui/section-header'

const PROVIDERS: ByokProvider[] = ['openai', 'anthropic']

export function SettingsIntegrationsTab() {
  const {
    provider: savedProvider,
    maskedKey,
    status,
    tokensUsed,
    tokensLimit,
    selectedModel,
    allowedModels,
    effectiveModel,
    saveKey,
    deleteKey,
    updateBudget,
    isUpdatingBudget,
    updateModel,
    isUpdatingModel,
  } = useByokKey()
  const [pendingProvider, setPendingProvider] = useState<ByokProvider>(savedProvider)
  const [rawKey, setRawKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [budgetInput, setBudgetInput] = useState<string>('')

  const activeProvider = status === 'active' ? savedProvider : pendingProvider
  const meta = PROVIDER_META[activeProvider]
  const tokenPct = tokensLimit > 0 ? Math.min(100, Math.round((tokensUsed / tokensLimit) * 100)) : 0

  const handleSaveBudget = async () => {
    const parsed = Number(budgetInput.replace(/[, _]/g, ''))
    if (!Number.isFinite(parsed) || parsed < 1_000) {
      toast.error('Set a budget of at least 1,000 tokens')
      return
    }
    if (parsed > 100_000_000) {
      toast.error('Maximum monthly budget is 100,000,000 tokens')
      return
    }
    const res = await updateBudget(parsed)
    if (res.success) {
      toast.success(`Monthly budget set to ${parsed.toLocaleString()} tokens`)
      setBudgetInput('')
    } else {
      toast.error('Could not update budget')
    }
  }

  const handleSave = () => {
    const trimmed = rawKey.trim()
    if (trimmed.length < 8) {
      toast.error('Please enter a valid API key')
      return
    }
    if (!trimmed.startsWith(meta.prefix)) {
      toast.error(`${meta.label} keys start with "${meta.prefix}"`)
      return
    }
    setIsSaving(true)
    try {
      saveKey(trimmed, pendingProvider)
      setRawKey('')
      toast.success(`${meta.label} key saved`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    const ok =
      typeof window !== 'undefined'
        ? window.confirm(
            `Remove your ${PROVIDER_META[savedProvider].label} key? The Coach will stop working until you add a new one.`,
          )
        : true
    if (!ok) return
    deleteKey()
    setPendingProvider('openai')
    toast.success('API key removed')
  }

  return (
    <div className="space-y-6">
      <GlassCard padded>
        <SectionHeader
          title={
            <span className="inline-flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              BYOK - Bring your own key
            </span>
          }
          action={
            status === 'active' ? (
              <Badge variant="success">{PROVIDER_META[savedProvider].label} - Active</Badge>
            ) : (
              <Badge variant="default">Not Configured</Badge>
            )
          }
        />

        <p className="text-sm text-zinc-600 mb-4">
          Use your own API key to power the Coach. We send it to our server only to encrypt it (AES-GCM)
          and store it for your future requests. It is never logged, never shared, and you can rotate
          or remove it at any time. Charges go directly to your provider account.
        </p>

        {/* Provider switcher */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">Provider</label>
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
            {PROVIDERS.map((p) => {
              const isActive = status === 'active' ? savedProvider === p : pendingProvider === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    if (status === 'active' && savedProvider !== p) {
                      toast(
                        `Remove the current ${PROVIDER_META[savedProvider].label} key first to switch providers.`,
                      )
                      return
                    }
                    setPendingProvider(p)
                  }}
                  className={cn(
                    'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                    isActive ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900',
                  )}
                >
                  {PROVIDER_META[p].label}
                </button>
              )
            })}
          </div>
        </div>

        {status === 'active' && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
            <span className="font-mono text-sm text-zinc-700">{maskedKey}</span>
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-rose-600 hover:text-rose-700">
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {status === 'active' ? 'Replace key' : `${meta.label} API key`}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="password"
              autoComplete="off"
              placeholder={meta.placeholder}
              value={rawKey}
              onChange={(e) => setRawKey(e.target.value)}
              className="flex-1 font-mono"
            />
            <Button variant="brand" onClick={handleSave} disabled={isSaving || !rawKey.trim()}>
              {isSaving ? 'Saving...' : 'Save key'}
            </Button>
          </div>
          <p className="text-[11px] text-zinc-500">
            Get a key at{' '}
            <a
              href={meta.consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-700"
            >
              {meta.consoleUrl.replace(/^https?:\/\//, '')}
            </a>
            .
          </p>
        </div>
      </GlassCard>

      {status === 'active' && allowedModels.length > 0 && (
        <GlassCard padded>
          <SectionHeader title="Model" />
          <div className="space-y-2">
            <label
              htmlFor="byok-model"
              className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
            >
              {PROVIDER_META[savedProvider].label} model used by Coach
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                id="byok-model"
                value={selectedModel ?? effectiveModel ?? ''}
                onChange={async (e) => {
                  const next = e.target.value
                  if (!next) return
                  const res = await updateModel(next)
                  if (res.success) toast.success(`Model set to ${next}`)
                  else toast.error('Could not update model')
                }}
                disabled={isUpdatingModel}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d] sm:max-w-sm"
              >
                {allowedModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                    {effectiveModel === m && selectedModel == null ? ' (default)' : ''}
                  </option>
                ))}
              </select>
              {effectiveModel && (
                <span className="text-[11px] text-zinc-500">
                  Currently using <span className="font-mono text-zinc-700">{effectiveModel}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              Lower-tier models (e.g. gpt-4o-mini, claude-3-5-haiku) cost less per request. Pick what
              matches your comfort with your provider bill. Whitelist enforced server-side.
            </p>
          </div>
        </GlassCard>
      )}

      {status === 'active' && (
        <GlassCard padded>
          <SectionHeader title="Token usage and monthly budget" />
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold text-zinc-900">{tokensUsed.toLocaleString()}</span>
                <span className="text-xs text-zinc-500">
                  of {tokensLimit.toLocaleString()} this month ({tokenPct}%)
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full bg-[#f2cc0d] transition-all" style={{ width: `${tokenPct}%` }} />
              </div>
              <p className="text-[11px] text-zinc-500">
                Usage resets on the first day of each month. With BYOK active, charges go directly to your{' '}
                {PROVIDER_META[savedProvider].label} account. When the budget is hit, Coach requests pause until next month.
              </p>
            </div>

            <div className="space-y-2 border-t border-zinc-200 pt-3">
              <label
                htmlFor="byok-monthly-budget"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
              >
                Update monthly budget
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="byok-monthly-budget"
                  type="number"
                  min={1000}
                  max={100_000_000}
                  step={1000}
                  inputMode="numeric"
                  placeholder={tokensLimit.toLocaleString()}
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  disabled={isUpdatingBudget}
                  className="sm:max-w-xs"
                />
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  onClick={handleSaveBudget}
                  disabled={isUpdatingBudget || !budgetInput.trim()}
                >
                  {isUpdatingBudget ? 'Saving...' : 'Save budget'}
                </Button>
                <div className="flex flex-wrap gap-1.5 sm:ml-auto">
                  {[100_000, 250_000, 500_000, 1_000_000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBudgetInput(String(preset))}
                      disabled={isUpdatingBudget}
                      className={cn(
                        'rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                      )}
                    >
                      {preset >= 1_000_000 ? `${preset / 1_000_000}M` : `${preset / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-zinc-500">
                Soft cap enforced server-side. Pick something that matches your comfort with your provider bill.
                Minimum 1,000. Maximum 100M.
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
