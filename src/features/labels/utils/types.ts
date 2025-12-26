export interface Label {
  id: string
  name: string
  value: string
  color: string
  isDefault: boolean
  order: number
  _count?: {
    goals: number
  }
}

export interface CreateLabelForm {
  name: string
  color?: string
  order?: number
}

export interface UpdateLabelForm {
  name?: string
  color?: string
  order?: number
}
