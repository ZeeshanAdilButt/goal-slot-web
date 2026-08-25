'use client'

import { useMemo, useState } from 'react'

import { useStartConversationMutation } from '@/features/messaging/hooks/use-messaging-mutations'
import { findConversationWith } from '@/features/messaging/hooks/use-messaging-queries'
import { displayName } from '@/features/messaging/utils/helpers'
import { Conversation, MessagingPerson } from '@/features/messaging/utils/types'
import { Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface NewConversationPickerProps {
  /** Everyone the sharing graph allows this user to message. */
  people: MessagingPerson[]
  conversations: Conversation[] | undefined
  currentUserId: string | undefined
  /** Selects (and if needed creates) the conversation — same effect as clicking it in the list. */
  onOpenConversation: (conversationId: string) => void
}

/**
 * Always-visible "message someone I share with" entry point.
 *
 * Without this, the only way to start a conversation was the people list
 * ConversationList showed while it had zero conversations — once a first
 * conversation existed, that list disappeared and starting a second one
 * meant leaving this page for the Sharing screen instead. This searches the
 * same messageable-people set from anywhere in the conversation list header.
 */
export function NewConversationPicker({
  people,
  conversations,
  currentUserId,
  onOpenConversation,
}: NewConversationPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const startConversation = useStartConversationMutation()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter(
      (person) => (person.name ?? '').toLowerCase().includes(q) || (person.email ?? '').toLowerCase().includes(q),
    )
  }, [people, query])

  if (people.length === 0) return null

  const handlePick = (person: MessagingPerson) => {
    // Opening an existing thread should never spawn a duplicate — the
    // backend also guards this, but checking here avoids a round trip for
    // the common case of re-opening someone you already talk to.
    const existing = findConversationWith(conversations, person.id, currentUserId)
    if (existing) {
      onOpenConversation(existing.id)
      setOpen(false)
      setQuery('')
      return
    }

    startConversation.mutate(person.id, {
      onSuccess: ({ conversationId }) => {
        onOpenConversation(conversationId)
        setOpen(false)
        setQuery('')
      },
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="secondary" size="sm" aria-label="New message" title="New message">
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" sideOffset={6} className="w-72 border-zinc-200 p-0">
        <div className="border-b border-zinc-100 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people you share with..."
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
        <ul className="max-h-72 overflow-y-auto p-1.5" role="listbox" aria-label="People you can message">
          {filtered.length === 0 ? (
            <li className="px-2.5 py-3 text-center text-xs text-zinc-500">No matches</li>
          ) : (
            filtered.map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => handlePick(person)}
                  disabled={startConversation.isPending}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-zinc-800">{displayName(person)}</span>
                    {person.email && <span className="block truncate text-xs text-zinc-500">{person.email}</span>}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
