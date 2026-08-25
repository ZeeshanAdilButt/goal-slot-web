import { messagingBaseUrl } from '@/features/messaging/utils/config'

/**
 * jiffy-messaging is a separate service behind its own short-lived JWT, so it
 * cannot ride on the shared axios instance in `@/lib/api` (that one attaches
 * the GoalSlot access token to every call). This is a thin fetch wrapper that
 * carries the messaging token instead and turns the documented status codes
 * into an error a component can show.
 */
export class MessagingApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'MessagingApiError'
    this.status = status
  }
}

/** A 0 status means the request never reached the service. */
export const isMessagingNetworkError = (error: unknown): boolean =>
  error instanceof MessagingApiError && error.status === 0

export const isMessagingAuthError = (error: unknown): boolean =>
  error instanceof MessagingApiError && error.status === 401

export const messagingErrorMessage = (error: unknown): string => {
  if (error instanceof MessagingApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'Messaging is unavailable right now. Try again in a moment.'
}

const defaultMessageForStatus = (status: number): string => {
  switch (status) {
    case 400:
      return 'That request was rejected. Check the message and try again.'
    case 401:
      return 'Your messaging session expired. Reconnecting...'
    case 403:
      return 'You are not a participant in this conversation.'
    case 404:
      return 'This conversation no longer exists.'
    case 429:
      return 'You are sending messages too quickly. Wait a moment and try again.'
    default:
      return 'Messaging is unavailable right now. Try again in a moment.'
  }
}

const extractServerMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: unknown; error?: unknown }
    const raw = payload?.message ?? payload?.error
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
    if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0]
  } catch {
    // Non-JSON error bodies are expected from proxies; fall through.
  }
  return ''
}

interface MessagingRequestOptions {
  token: string
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | undefined>
  signal?: AbortSignal
}

export async function messagingRequest<T>(
  path: string,
  { token, method = 'GET', body, query, signal }: MessagingRequestOptions,
): Promise<T> {
  if (!messagingBaseUrl) {
    throw new MessagingApiError(0, 'Messaging is not configured for this environment.')
  }

  let url: URL
  try {
    url = new URL(`${messagingBaseUrl}${path}`)
  } catch {
    throw new MessagingApiError(0, 'The configured messaging URL is not a valid absolute URL.')
  }

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  })

  let response: Response
  try {
    response = await fetch(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    // AbortError is React Query cancelling the query, not a real failure.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new MessagingApiError(0, 'Could not reach the messaging service. Check your connection.')
  }

  if (!response.ok) {
    const serverMessage = await extractServerMessage(response)
    throw new MessagingApiError(response.status, serverMessage || defaultMessageForStatus(response.status))
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  if (!text) return undefined as T

  try {
    return JSON.parse(text) as T
  } catch {
    throw new MessagingApiError(response.status, 'The messaging service returned a response we could not read.')
  }
}
