/// <reference types="@serwist/next/typings" />
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, RouteMatchCallbackOptions, SerwistGlobalConfig } from 'serwist'
import { NetworkOnly, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: WorkerGlobalScope & SerwistGlobalConfig

// Never cache API/analytics: React Query owns app data, the SW only the shell.
const networkOnly = {
  matcher: ({ url, sameOrigin }: RouteMatchCallbackOptions) =>
    sameOrigin && (url.pathname.startsWith('/api') || url.pathname.startsWith('/ingest')),
  handler: new NetworkOnly(),
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [networkOnly, ...defaultCache],
})

serwist.addEventListeners()
