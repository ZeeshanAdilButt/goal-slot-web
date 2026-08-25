import type { MessagingPerson } from '@/features/messaging/utils/types'

/** Everyone we have managed to put a name to, keyed by user id. */
export type KnownPeople = Record<string, MessagingPerson>

const trimmed = (value: string | undefined): string | undefined => {
  const text = value?.trim()
  return text ? text : undefined
}

/**
 * Folds one person into the record, preferring whatever is populated. A
 * later sighting that has lost a field - a share row carrying an id and an
 * email but no name, say - must not erase the field we already had.
 *
 * Returns the same object reference when nothing changed, so callers can
 * skip a cache write and a re-render on the common no-op path.
 */
function withPerson(people: KnownPeople, person: MessagingPerson | undefined): KnownPeople {
  if (!person?.id) return people

  const existing = people[person.id]
  const next: MessagingPerson = {
    id: person.id,
    name: trimmed(person.name) ?? trimmed(existing?.name),
    email: trimmed(person.email) ?? trimmed(existing?.email),
    avatar: trimmed(person.avatar) ?? trimmed(existing?.avatar),
  }

  if (existing && existing.name === next.name && existing.email === next.email && existing.avatar === next.avatar) {
    return people
  }

  return { ...people, [person.id]: next }
}

/** `withPerson` over a list, still returning the same reference on a no-op. */
export function withPeople(people: KnownPeople, incoming: Array<MessagingPerson | undefined>): KnownPeople {
  return incoming.reduce<KnownPeople>(withPerson, people)
}

/** Sorted by whatever the UI will actually show, for a people picker. */
export function sortPeople(people: MessagingPerson[]): MessagingPerson[] {
  return [...people].sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || ''))
}
