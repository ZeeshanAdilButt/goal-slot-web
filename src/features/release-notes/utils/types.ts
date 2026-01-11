export interface ReleaseNote {
  id: string
  version: string
  title: string
  content: string
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface LatestReleaseNoteResponse {
  note: ReleaseNote | null
  seen: boolean
}
