'use client'

import { useState } from 'react'

import { useByokKey } from '@/features/settings/hooks/use-byok-key'
import { KeyRound, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '@/components/ui/section-header'

export function SettingsIntegrationsTab() {
  const { maskedKey, status, tokensUsed, tokensLimit, saveKey, deleteKey } = useByokKey()
  const [rawKey, setRawKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const tokenPct = tokensLimit > 0 ? Math.min(100, Math.round((tokensUsed / tokensLimit) * 100)) : 0

  const handleSave = () => {
    if (!rawKey.trim() || rawKey.trim().length < 8) {
      toast.error('Please enter a valid API key')
      return
    }
    setIsSaving(true)
    try {
      saveKey(rawKey)
      setRawKey('')
      toast.success('API key saved')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    deleteKey()
    toast.success('API key removed')
  }

  return (
    <div className="space-y-6">
      <GlassCard padded>
        <SectionHeader
          title={
            <span className="inline-flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              BYOK — Bring your own key
            </span>
          }
          action={
            status === 'active' ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="default">Not Configured</Badge>
            )
          }
        />

        <p className="text-sm text-zinc-600 mb-4">
          Use your own Anthropic API key to power the coach. Your key stays in this browser and is never sent to our
          servers. You can rotate or remove it at any time.
        </p>

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
            {status === 'active' ? 'Replace key' : 'API key'}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="password"
              autoComplete="off"
              placeholder="sk-ant-..."
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
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-700"
            >
              console.anthropic.com
            </a>
            .
          </p>
        </div>
      </GlassCard>

      <GlassCard padded>
        <SectionHeader title="Token usage" />
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold text-zinc-900">{tokensUsed.toLocaleString()}</span>
            <span className="text-xs text-zinc-500">
              of {tokensLimit.toLocaleString()} this month ({tokenPct}%)
            </span>
          </div>
          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#f2cc0d] transition-all" style={{ width: `${tokenPct}%` }} />
          </div>
          <p className="text-[11px] text-zinc-500">
            Usage resets on the first day of each month. With BYOK active, charges go directly to your Anthropic
            account.
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
