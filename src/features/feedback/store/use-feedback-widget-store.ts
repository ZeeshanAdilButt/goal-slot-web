import { create } from 'zustand'

type FeedbackWidgetView = { mode: 'new' } | { mode: 'thread'; feedbackId: string }

interface FeedbackWidgetState {
  isOpen: boolean
  view: FeedbackWidgetView
  openNew: () => void
  openThread: (feedbackId: string) => void
  close: () => void
}

export const useFeedbackWidgetStore = create<FeedbackWidgetState>((set) => ({
  isOpen: false,
  view: { mode: 'new' },
  openNew: () => set({ isOpen: true, view: { mode: 'new' } }),
  openThread: (feedbackId: string) => set({ isOpen: true, view: { mode: 'thread', feedbackId } }),
  close: () => set({ isOpen: false }),
}))
