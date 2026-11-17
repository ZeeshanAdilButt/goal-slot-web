import { NotesPage } from '@/features/notes'

export default function NotesRoute() {
  return (
    // Fill the dashboard frame, not the whole window. This used to be
    // h-dvh, but the frame sits under the top bar and the tracker banners and
    // reserves space at the bottom for the floating buttons, so a full-window
    // page was always taller than its frame: the frame grew a second scrollbar
    // and the bottom of the sidebar and the editor (the last pages, the last
    // lines of a note) sat below the fold. min-h keeps a usable size in a very
    // short window; there the frame scrolls instead of crushing the page.
    <div className="h-full min-h-[420px]">
      <NotesPage />
    </div>
  )
}
