import { create } from 'zustand'

// State of the offline write queue. `pendingCount` stays 0 until the mutation
// queue lands; the Offline indicator already reads it.
interface OfflineQueueState {
  pendingCount: number
  lastSyncError: string | null
  setPendingCount: (count: number) => void
  setLastSyncError: (error: string | null) => void
}

export const useOfflineQueueStore = create<OfflineQueueState>((set) => ({
  pendingCount: 0,
  lastSyncError: null,
  setPendingCount: (count) => set({ pendingCount: count }),
  setLastSyncError: (error) => set({ lastSyncError: error }),
}))
