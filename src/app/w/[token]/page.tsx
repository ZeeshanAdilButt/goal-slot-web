'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye } from 'lucide-react'

import type { ExcalidrawScene } from '@/features/whiteboards/types'
import { publicWhiteboardsApi } from '@/lib/api/whiteboards'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'

const PublicWhiteboardViewer = dynamic(
  () =>
    import('@/features/whiteboards/public-whiteboard-viewer').then((mod) => mod.PublicWhiteboardViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loading size="md" />
      </div>
    ),
  },
)

function parsePublicContent(content: unknown): ExcalidrawScene | null {
  if (content == null) return null
  let parsed: unknown = content
  if (typeof content === 'string') {
    try {
      parsed = JSON.parse(content)
    } catch {
      return null
    }
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const scene = parsed as ExcalidrawScene
  if (!Array.isArray(scene.elements)) return null
  return scene
}

interface PublicWhiteboard {
  id: string
  title: string
  content: ExcalidrawScene | null
  icon: string | null
  color: string | null
  updatedAt: string
  user: { name: string }
}

export default function PublicWhiteboardPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string | null>(null)
  const [whiteboard, setWhiteboard] = useState<PublicWhiteboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then((p) => setToken(p.token))
  }, [params])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true)
    setError(null)
    publicWhiteboardsApi
      .getByToken(token)
      .then((res) => {
        if (cancelled) return
        const data = res.data as PublicWhiteboard
        setWhiteboard({
          ...data,
          content: parsePublicContent(data.content),
        })
      })
      .catch((err) => {
        if (cancelled) return
        const status = err?.response?.status
        if (status === 404) {
          setError('This shared whiteboard is no longer available, or the link has been turned off.')
        } else {
          setError('Could not load this whiteboard. Try again in a moment.')
        }
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            title="Go to Goal Slot"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Goal Slot
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600">
            <Eye className="h-3 w-3" />
            Public whiteboard (view only)
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <Loading size="md" />
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center">
            <h1 className="text-lg font-semibold text-zinc-900">Whiteboard unavailable</h1>
            <p className="mt-2 text-sm text-zinc-600">{error}</p>
            <Button asChild variant="brand" size="sm" className="mt-4">
              <Link href="/">Go to Goal Slot</Link>
            </Button>
          </div>
        )}

        {!loading && whiteboard && (
          <article className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              {whiteboard.icon && (
                <span aria-hidden className="text-3xl leading-none">
                  {whiteboard.icon}
                </span>
              )}
              <h1 className="min-w-0 flex-1 text-2xl font-bold text-zinc-900 sm:text-3xl">
                {whiteboard.title || 'Untitled'}
              </h1>
            </div>
            <div className="mb-6 text-[11px] text-zinc-500">
              Shared by {whiteboard.user.name} · Updated {new Date(whiteboard.updatedAt).toLocaleString()}
            </div>
            {!whiteboard.content?.elements?.length ? (
              <p className="min-h-[40vh] text-sm text-zinc-500">This whiteboard has no saved drawings yet.</p>
            ) : (
              <PublicWhiteboardViewer scene={whiteboard.content} />
            )}
          </article>
        )}
      </main>
    </div>
  )
}
