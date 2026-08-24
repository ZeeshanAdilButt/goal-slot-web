'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

import { ByokProvider, PROVIDER_META, useByokKey } from '@/features/settings/hooks/use-byok-key'
import { useQueryClient } from '@tanstack/react-query'
import { useNotionConnection } from '@/features/settings/hooks/use-notion-connection'
import { integrationsApi } from '@/lib/api'
import { NotionTargetPicker } from '@/features/settings/components/notion-target-picker'
import { GoogleCalendarCard } from '@/features/calendar'
import { calendarQueries } from '@/features/calendar/utils/queries'
import { KeyRound, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '@/components/ui/section-header'
import { Loading } from '@/components/ui/loading'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Free-tier providers first so they're the obvious default for users
// who don't want to attach a credit card. Order mirrors the picker chips.
const PROVIDERS: ByokProvider[] = ['gemini', 'openrouter', 'openai', 'anthropic']

export function SettingsIntegrationsTab() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { status: notionStatus, isLoading: notionLoading, isPending: notionDisconnecting, disconnect: disconnectNotion } = useNotionConnection()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    const notionResult = searchParams.get('notion')
    if (!notionResult) return
    handled.current = true
    if (notionResult === 'connected' || notionResult === 'updated') {
      const successMessage =
        notionResult === 'connected'
          ? 'Notion workspace connected successfully!'
          : 'Notion permitted pages updated successfully!'
      toast.success(successMessage)
      queryClient.invalidateQueries({ queryKey: ['integrations', 'notion'] })
      queryClient.invalidateQueries({ queryKey: ['integrations', 'notion', 'index'] })
      router.replace('/dashboard/settings?tab=integrations', { scroll: false })
    } else if (notionResult === 'error') {
      const msg = searchParams.get('message') || 'Connection failed'
      toast.error(`Notion connection failed: ${msg}`)
      router.replace('/dashboard/settings?tab=integrations', { scroll: false })
    }
  }, [searchParams, router, queryClient])

  // Kept separate from the Notion effect above rather than folded into it: the
  // two callbacks use different query params and different cache keys, and
  // sharing the one `handled` ref would let whichever ran first swallow the
  // other's result.
  const googleCalendarHandled = useRef(false)

  useEffect(() => {
    if (googleCalendarHandled.current) return
    const result = searchParams.get('google_calendar')
    if (!result) return
    googleCalendarHandled.current = true

    if (result === 'connected') {
      toast.success('Google Calendar connected. You can import events now.')
      queryClient.invalidateQueries({ queryKey: calendarQueries.root() })
    } else {
      // The API only ever sends a short stable reason code, never raw text from
      // Google, so these are the full set.
      const reason = searchParams.get('reason')
      toast.error(
        reason === 'denied'
          ? 'Google Calendar access was not granted'
          : 'Could not connect Google Calendar. Please try again.',
      )
    }
    router.replace('/dashboard/settings?tab=integrations', { scroll: false })
  }, [searchParams, router, queryClient])

  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false)

  const handleConnectNotion = async () => {
    try {
      const res = await integrationsApi.getNotionConnectUrl()
      window.location.href = res.data.url
    } catch (err: any) {
      toast.error('Failed to initiate Notion connection')
    }
  }

  const handleDisconnectNotion = () => {
    setIsDisconnectDialogOpen(true)
  }

  const handleConfirmDisconnect = async () => {
    try {
      await disconnectNotion()
      toast.success('Notion disconnected')
      setIsDisconnectDialogOpen(false)
    } catch {
      toast.error('Failed to disconnect Notion. Please try again.')
    }
  }

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
      <GoogleCalendarCard />

      {/* Notion Connection Card */}
      <GlassCard padded>
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-900 text-[10px] font-bold text-white">N</span>
              Notion Integration
            </span>
          }
          action={
            notionLoading ? (
              <Badge variant="default">Checking connection...</Badge>
            ) : notionStatus.connected ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="default">Not Connected</Badge>
            )
          }
        />

        <p className="mb-4 text-sm text-zinc-600">
          Connect your Notion workspace. Once connected, you will be able to push your notes to Notion and pull reference pages into the Coach. Coming soon.
        </p>

        {notionLoading ? (
          <div className="flex items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 p-6">
            <Loading className="h-5 w-5" />
          </div>
        ) : notionStatus.connected ? (
          <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-3">
              {notionStatus.workspaceIcon ? (
                <img src={notionStatus.workspaceIcon} alt="Workspace Icon" className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-800 font-bold text-white">
                  {notionStatus.workspaceName?.charAt(0) || 'N'}
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold text-zinc-900">{notionStatus.workspaceName}</h4>
                <p className="text-xs text-zinc-500">
                  Connected on {notionStatus.connectedAt ? new Date(notionStatus.connectedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <NotionTargetPicker />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnectNotion}
              disabled={notionDisconnecting}
              className="mt-2 w-full border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100/50 hover:text-rose-700"
            >
              Disconnect Notion
            </Button>
          </div>
        ) : (
          <div className="pt-2">
            <Button variant="brand" className="w-full" onClick={handleConnectNotion}>
              Connect Notion Workspace
            </Button>
          </div>
        )}

        {/* Disconnect Confirmation Dialog */}
        <AlertDialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Notion?</AlertDialogTitle>
              <AlertDialogDescription>
                Pushed notes will remain in Notion, but you won&apos;t be able to sync or push new notes until you reconnect.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={notionDisconnecting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDisconnect}
                className="bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50"
                disabled={notionDisconnecting}
              >
                {notionDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </GlassCard>

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

        <p className="mb-4 text-sm text-zinc-600">
          Use your own API key to power the Coach. We send it to our server only to encrypt it (AES-GCM) and store it
          for your future requests. It is never logged, never shared, and you can rotate or remove it at any time.
          Charges go directly to your provider account.
        </p>

        {/* Provider switcher */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">Provider</label>
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
            {PROVIDERS.map((p) => {
              const isActive = status === 'active' ? savedProvider === p : pendingProvider === p
              const m = PROVIDER_META[p]
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    if (status === 'active' && savedProvider !== p) {
                      toast(`Remove the current ${PROVIDER_META[savedProvider].label} key first to switch providers.`)
                      return
                    }
                    setPendingProvider(p)
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors',
                    isActive ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900',
                  )}
                >
                  {m.label}
                  {m.isFree && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0 text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Free
                    </span>
                  )}
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
          <p className="text-[11px] leading-relaxed text-zinc-500">
            <span className="font-semibold text-zinc-700">How to get a key.</span> {meta.howTo}{' '}
            <a
              href={meta.consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-700 underline hover:text-zinc-900"
            >
              Open {meta.consoleUrl.replace(/^https?:\/\//, '')}
            </a>
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
              Lower-tier models (e.g. gpt-4o-mini, claude-3-5-haiku) cost less per request. Pick what matches your
              comfort with your provider bill. Whitelist enforced server-side.
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
                {PROVIDER_META[savedProvider].label} account. When the budget is hit, Coach requests pause until next
                month.
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
                Soft cap enforced server-side. Pick something that matches your comfort with your provider bill. Minimum
                1,000. Maximum 100M.
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
