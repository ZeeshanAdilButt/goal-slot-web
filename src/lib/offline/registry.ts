import type { OfflineOperation } from './types'

const registry = new Map<string, OfflineOperation>()

export function registerOperation<TPayload, TResult>(
  kind: string,
  operation: OfflineOperation<TPayload, TResult>,
): void {
  registry.set(kind, operation as OfflineOperation)
}

export function getOperation(kind: string): OfflineOperation | undefined {
  return registry.get(kind)
}
