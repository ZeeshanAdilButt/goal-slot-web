'use client'

import { useState } from 'react'

import { useCliTokens } from '@/features/settings/hooks/use-cli-tokens'
import { Check, Pencil, Terminal, Trash2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import type { CliToken } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { SectionHeader } from '@/components/ui/section-header'
import { ConfirmDialog } from '@/components/confirm-dialog'

/** Human wording for the reason column, so REUSE_DETECTED is not shouted at the user. */
const REVOKED_REASON_LABEL: Record<string, string> = {
  USER: 'Revoked by you',
  PASSWORD_CHANGE: 'Revoked when you changed your password',
  REUSE_DETECTED: 'Revoked automatically: this token was used from two places',
  ADMIN: 'Revoked by an administrator',
}

function formatDate(iso: string | null): string {
  if (!iso) return 'never'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'never used'
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function SettingsCliTokensTab() {
  const { activeTokens, revokedTokens, isLoading, isError, rename, revoke, revokeAll } = useCliTokens()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [pendingRevoke, setPendingRevoke] = useState<CliToken | null>(null)
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false)

  const startRename = (token: CliToken) => {
    setEditingId(token.id)
    setDraftName(token.name)
  }

  const saveRename = async (token: CliToken) => {
    const trimmed = draftName.trim()
    if (!trimmed || trimmed === token.name) {
      setEditingId(null)
      return
    }
    try {
      await rename.mutateAsync({ id: token.id, name: trimmed })
      setEditingId(null)
    } catch {
      toast.error('Could not rename this token')
    }
  }

  const handleRevoke = async () => {
    if (!pendingRevoke) return
    try {
      await revoke.mutateAsync(pendingRevoke.id)
      toast.success(`${pendingRevoke.name} revoked`)
    } catch {
      toast.error('Could not revoke this token')
    } finally {
      setPendingRevoke(null)
    }
  }

  const handleRevokeAll = async () => {
    try {
      const { data } = await revokeAll.mutateAsync()
      toast.success(data.revoked === 1 ? '1 token revoked' : `${data.revoked} tokens revoked`)
    } catch {
      toast.error('Could not revoke tokens')
    } finally {
      setConfirmRevokeAll(false)
    }
  }

  if (isLoading) return <Loading />

  if (isError) {
    return (
      <GlassCard>
        <p className="text-sm text-zinc-500">Could not load your CLI tokens. Please refresh.</p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader
          title="CLI tokens"
          action={
            activeTokens.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setConfirmRevokeAll(true)}>
                Revoke all
              </Button>
            ) : undefined
          }
        />

        {activeTokens.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center">
            <Terminal className="mx-auto mb-3 h-6 w-6 text-zinc-300" />
            <p className="text-sm text-zinc-500">
              No CLI tokens yet. Run <code className="font-mono">goalslot login</code> to create one.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {activeTokens.map((token) => (
              <li key={token.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  {editingId === token.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        value={draftName}
                        maxLength={64}
                        onChange={(event) => setDraftName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') void saveRename(token)
                          if (event.key === 'Escape') setEditingId(null)
                        }}
                        className="h-8 w-56"
                        aria-label="Token name"
                      />
                      <Button size="sm" variant="ghost" onClick={() => void saveRename(token)} aria-label="Save name">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} aria-label="Cancel rename">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-zinc-900">{token.name}</span>
                      <button
                        type="button"
                        onClick={() => startRename(token)}
                        className="text-zinc-400 hover:text-zinc-700"
                        aria-label={`Rename ${token.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <p className="mt-1 text-xs text-zinc-500">
                    {token.clientName} v{token.clientVersion} · {token.deviceLabel} ({token.platform})
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Created {formatDate(token.createdAt)} · Last used {formatRelative(token.lastUsedAt)}
                    {token.lastUsedIp ? ` from ${token.lastUsedIp}` : ''} · Expires {formatDate(token.expiresAt)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">{token.scopes.join(', ')}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingRevoke(token)}
                    aria-label={`Revoke ${token.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {revokedTokens.length > 0 && (
        <GlassCard>
          <SectionHeader title="Recently revoked" />
          {/* Kept visible for 30 days so an automatic REUSE_DETECTED revocation
              is something the user can actually see and act on. */}
          <ul className="divide-y divide-zinc-100">
            {revokedTokens.map((token) => (
              <li key={token.id} className={cn('py-3 opacity-60')}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-700">{token.name}</span>
                  <Badge variant={token.revokedReason === 'REUSE_DETECTED' ? 'destructive' : 'secondary'}>
                    revoked
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {REVOKED_REASON_LABEL[token.revokedReason ?? ''] ?? 'Revoked'} · {formatDate(token.revokedAt)}
                </p>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <ConfirmDialog
        open={pendingRevoke !== null}
        onOpenChange={(open) => !open && setPendingRevoke(null)}
        title="Revoke this token?"
        description={`${pendingRevoke?.name ?? 'This token'} will stop working within a minute. Run \`goalslot login\` on that machine to sign in again.`}
        confirmButtonText="Revoke"
        variant="destructive"
        isLoading={revoke.isPending}
        onConfirm={handleRevoke}
      />

      <ConfirmDialog
        open={confirmRevokeAll}
        onOpenChange={setConfirmRevokeAll}
        title="Revoke every CLI token?"
        description="Every machine signed in with the GoalSlot CLI will be signed out. Your browser and mobile sessions are not affected."
        confirmButtonText="Revoke all"
        variant="destructive"
        isLoading={revokeAll.isPending}
        onConfirm={handleRevokeAll}
      />
    </div>
  )
}
