export interface Category {
  id: string
  userId: string
  name: string
  value: string
  color: string
  isDefault: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryForm {
  name: string
  color: string
  order?: number
}

export interface UpdateCategoryForm {
  name?: string
  color?: string
  order?: number
  isDefault?: boolean
}
