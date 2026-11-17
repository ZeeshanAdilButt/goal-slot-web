import { WhiteboardsPage } from '@/features/whiteboards'

export default function WhiteboardsRoute() {
  return (
    // Fill the dashboard frame, not the whole window (see the Notes route).
    <div className="h-full min-h-[420px]">
      <WhiteboardsPage />
    </div>
  )
}
