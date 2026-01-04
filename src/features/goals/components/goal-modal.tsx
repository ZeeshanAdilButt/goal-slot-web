import { useEffect, useRef, useState } from 'react'

import { useCategoriesQuery } from '@/features/categories'
import { useCreateGoalMutation, useUpdateGoalMutation } from '@/features/goals/hooks/use-goals-mutations'
import {
  CreateGoalForm,
  Goal,
  GOAL_STATUS_OPTIONS,
  GoalFormState,
  GoalStatus,
  LABEL_COLORS,
  LabelInput,
} from '@/features/goals/utils/types'
import { useDeleteLabelMutation, useLabelsQuery, useUpdateLabelMutation } from '@/features/labels'
import { Calendar, Check, Clock, Pencil, Trash2, X } from 'lucide-react'

import { COLOR_OPTIONS } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface GoalModalProps {
  isOpen: boolean
  onClose: () => void
  goal: Goal | null
}

const getInitialFormState = (): GoalFormState => ({
  title: '',
  description: '',
  category: '',
  targetHours: '',
  deadline: '',
  color: COLOR_OPTIONS[0],
  status: 'ACTIVE',
  labels: [],
})

const formStateToApiData = (form: GoalFormState): CreateGoalForm => ({
  title: form.title,
  description: form.description,
  category: form.category,
  targetHours: parseFloat(form.targetHours),
  deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
  color: form.color,
  labels: form.labels.length > 0 ? form.labels : undefined,
})

export function GoalModal({ isOpen, onClose, goal }: GoalModalProps) {
  const [form, setForm] = useState<GoalFormState>(getInitialFormState)
  const [labelInput, setLabelInput] = useState('')
  const [selectedLabelColor, setSelectedLabelColor] = useState(LABEL_COLORS[5].value) // Default blue
  const [showLabelSuggestions, setShowLabelSuggestions] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [editingLabelName, setEditingLabelName] = useState('')
  const [editingLabelColor, setEditingLabelColor] = useState('')
  const [deleteLabelId, setDeleteLabelId] = useState<string | null>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const createMutation = useCreateGoalMutation()
  const updateMutation = useUpdateGoalMutation()
  const updateLabelMutation = useUpdateLabelMutation()
  const deleteLabelMutation = useDeleteLabelMutation()
  const { data: categories = [] } = useCategoriesQuery()
  const { data: existingLabels = [] } = useLabelsQuery()

  // Filter suggestions based on input - show all when empty (focused)
  const labelSuggestions = existingLabels
    .filter((l) => labelInput === '' || l.name.toLowerCase().includes(labelInput.toLowerCase()))
    .filter((l) => !form.labels.some((fl) => fl.name === l.name))
    .slice(0, 8)

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        labelInputRef.current &&
        !labelInputRef.current.contains(event.target as Node)
      ) {
        setShowLabelSuggestions(false)
        setEditingLabelId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Set default category only once when categories load and no goal is being edited
  const defaultCategory = categories.length > 0 ? categories[0].value : ''

  useEffect(() => {
    if (goal) {
      setForm({
        title: goal.title,
        description: goal.description || '',
        category: goal.category,
        targetHours: goal.targetHours.toString(),
        deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
        color: goal.color,
        status: goal.status,
        labels: goal.labels?.map((gl) => ({ name: gl.label.name, color: gl.label.color })) || [],
      })
    } else {
      setForm({
        ...getInitialFormState(),
        category: defaultCategory,
      })
    }
  }, [goal, defaultCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const apiData = formStateToApiData(form)

    if (goal) {
      updateMutation.mutate({ id: goal.id, data: { ...apiData, status: form.status } }, { onSuccess: onClose })
    } else {
      createMutation.mutate(apiData, {
        onSuccess: () => {
          setForm(getInitialFormState())
          onClose()
        },
      })
    }
  }

  const updateField = <K extends keyof GoalFormState>(field: K, value: GoalFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Auto-save labels when editing an existing goal
  const addLabel = (labelName: string, color?: string) => {
    if (form.labels.some((l) => l.name === labelName)) return
    const newLabel: LabelInput = { name: labelName, color: color || selectedLabelColor }
    const newLabels = [...form.labels, newLabel]
    setForm((prev) => ({ ...prev, labels: newLabels }))

    // Auto-save if editing existing goal
    if (goal) {
      setIsAutoSaving(true)
      updateMutation.mutate({ id: goal.id, data: { labels: newLabels } }, { onSettled: () => setIsAutoSaving(false) })
    }
  }

  const removeLabel = (labelName: string) => {
    const newLabels = form.labels.filter((l) => l.name !== labelName)
    setForm((prev) => ({ ...prev, labels: newLabels }))

    // Auto-save if editing existing goal
    if (goal) {
      setIsAutoSaving(true)
      updateMutation.mutate({ id: goal.id, data: { labels: newLabels } }, { onSettled: () => setIsAutoSaving(false) })
    }
  }

  // Get text color for a label based on its background
  const getLabelTextColor = (bgColor: string) => {
    const labelColor = LABEL_COLORS.find((c) => c.value === bgColor)
    return labelColor?.textColor || '#374151'
  }

  // Start editing a label
  const startEditingLabel = (label: { id: string; name: string; color: string }) => {
    setEditingLabelId(label.id)
    setEditingLabelName(label.name)
    setEditingLabelColor(label.color)
  }

  // Save label edit
  const saveEditingLabel = () => {
    if (!editingLabelId || !editingLabelName.trim()) return
    updateLabelMutation.mutate(
      { id: editingLabelId, data: { name: editingLabelName.trim(), color: editingLabelColor } },
      {
        onSuccess: () => {
          setEditingLabelId(null)
          setEditingLabelName('')
          setEditingLabelColor('')
        },
      },
    )
  }

  // Delete a label globally
  const deleteLabel = (labelId: string) => {
    setDeleteLabelId(labelId)
    setEditingLabelId(null)
  }

  const confirmDeleteLabel = () => {
    if (!deleteLabelId) return
    deleteLabelMutation.mutate(deleteLabelId)
    setDeleteLabelId(null)
  }

  // Check if we're doing a real submit (not auto-save)
  const isSubmitting = (createMutation.isPending || updateMutation.isPending) && !isAutoSaving

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="modal-brutal max-w-2xl">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-xl font-bold uppercase">{goal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Two column layout */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Left column */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="input-brutal w-full py-2"
                  placeholder="e.g., Learn Rust"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase">Category</label>
                <Select value={form.category} onValueChange={(value) => updateField('category', value)}>
                  <SelectTrigger className="input-brutal w-full py-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Hours & Deadline row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase">Target Hours</label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={form.targetHours}
                      onChange={(e) => updateField('targetHours', e.target.value)}
                      className="input-brutal w-full py-2 pl-8"
                      placeholder="100"
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase">Deadline</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={form.deadline}
                      onChange={(e) => updateField('deadline', e.target.value)}
                      className="input-brutal w-full py-2 pl-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Status - Only show when editing */}
              {goal && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase">Status</label>
                  <Select value={form.status} onValueChange={(value) => updateField('status', value as GoalStatus)}>
                    <SelectTrigger className="input-brutal w-full py-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="input-brutal w-full py-2"
                  rows={2}
                  placeholder="What do you want to achieve?"
                />
              </div>

              {/* Labels */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase">Labels</label>

                {/* Label input with color picker */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={labelInputRef}
                      type="text"
                      value={labelInput}
                      onChange={(e) => {
                        setLabelInput(e.target.value)
                        setShowLabelSuggestions(true)
                      }}
                      onFocus={() => setShowLabelSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && labelInput.trim()) {
                          e.preventDefault()
                          addLabel(labelInput.trim())
                          setLabelInput('')
                          setShowLabelSuggestions(false)
                        }
                      }}
                      placeholder="Type or click to browse..."
                      className="input-brutal w-full py-2"
                    />

                    {/* Suggestions dropdown - show when focused */}
                    {showLabelSuggestions && (labelSuggestions.length > 0 || labelInput.trim()) && (
                      <div
                        ref={suggestionsRef}
                        className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto border-3 border-black bg-white shadow-brutal"
                      >
                        {/* Existing labels */}
                        {labelSuggestions.map((suggestion) => (
                          <div key={suggestion.id} className="group">
                            {editingLabelId === suggestion.id ? (
                              // Edit mode
                              <div className="border-b border-gray-200 p-2">
                                <input
                                  type="text"
                                  value={editingLabelName}
                                  onChange={(e) => setEditingLabelName(e.target.value)}
                                  className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      saveEditingLabel()
                                    } else if (e.key === 'Escape') {
                                      setEditingLabelId(null)
                                    }
                                  }}
                                />
                                <div className="mb-2 flex items-center gap-1">
                                  {LABEL_COLORS.map((c) => (
                                    <button
                                      key={c.value}
                                      type="button"
                                      onClick={() => setEditingLabelColor(c.value)}
                                      className={`h-5 w-5 rounded border transition-transform hover:scale-110 ${
                                        editingLabelColor === c.value
                                          ? 'ring-2 ring-black ring-offset-1'
                                          : 'border-gray-300'
                                      }`}
                                      style={{ backgroundColor: c.value }}
                                      title={c.name}
                                    />
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={saveEditingLabel}
                                    disabled={updateLabelMutation.isPending}
                                    className="flex-1 rounded bg-black px-2 py-1 text-xs text-white hover:bg-gray-800"
                                  >
                                    {updateLabelMutation.isPending ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingLabelId(null)}
                                    className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Normal display mode
                              <div className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50">
                                <button
                                  type="button"
                                  onClick={() => {
                                    addLabel(suggestion.name, suggestion.color)
                                    setLabelInput('')
                                    setShowLabelSuggestions(false)
                                  }}
                                  className="flex flex-1 items-center gap-2 text-left text-sm"
                                >
                                  <span
                                    className="rounded px-2 py-0.5 text-xs font-medium"
                                    style={{
                                      backgroundColor: suggestion.color,
                                      color: getLabelTextColor(suggestion.color),
                                    }}
                                  >
                                    {suggestion.name}
                                  </span>
                                </button>
                                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      startEditingLabel(suggestion)
                                    }}
                                    className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                                    title="Edit label"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteLabel(suggestion.id)
                                    }}
                                    className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600"
                                    title="Delete label"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Create new label option */}
                        {labelInput.trim() &&
                          !existingLabels.some((l) => l.name.toLowerCase() === labelInput.toLowerCase()) && (
                            <button
                              type="button"
                              onClick={() => {
                                addLabel(labelInput.trim())
                                setLabelInput('')
                                setShowLabelSuggestions(false)
                              }}
                              className="flex w-full items-center gap-2 border-t border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-100"
                            >
                              <span className="text-gray-500">Create</span>
                              <span
                                className="rounded px-2 py-0.5 text-xs font-medium"
                                style={{
                                  backgroundColor: selectedLabelColor,
                                  color: getLabelTextColor(selectedLabelColor),
                                }}
                              >
                                {labelInput.trim()}
                              </span>
                            </button>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Add button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (labelInput.trim()) {
                        addLabel(labelInput.trim())
                        setLabelInput('')
                      }
                    }}
                    disabled={!labelInput.trim()}
                    className="btn-brutal-secondary px-3 py-2 text-xs disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>

                {/* Color picker for new labels */}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">Color:</span>
                  {LABEL_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedLabelColor(c.value)}
                      className={`h-5 w-5 rounded border transition-transform hover:scale-110 ${
                        selectedLabelColor === c.value ? 'ring-2 ring-black ring-offset-1' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>

                {/* Current labels */}
                {form.labels.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.labels.map((label) => (
                      <span
                        key={label.name}
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: label.color || '#E5E7EB',
                          color: getLabelTextColor(label.color || '#E5E7EB'),
                          borderColor: label.color || '#E5E7EB',
                        }}
                      >
                        {label.name}
                        <button
                          type="button"
                          onClick={() => removeLabel(label.name)}
                          className="ml-0.5 opacity-60 hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Goal Color */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase">Goal Color</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateField('color', c)}
                      className={`h-7 w-7 rounded-full border-2 border-black transition-transform hover:scale-110 ${
                        form.color === c ? 'ring-2 ring-black ring-offset-1' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer buttons - full width */}
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1 py-2.5">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-brutal-dark flex-1 py-2.5">
              {isSubmitting ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </DialogContent>

      {/* Delete Label Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteLabelId}
        onOpenChange={(open) => !open && setDeleteLabelId(null)}
        title="Delete Label"
        description="Delete this label? It will be removed from all goals."
        onConfirm={confirmDeleteLabel}
        confirmButtonText="Delete"
        variant="destructive"
        isLoading={deleteLabelMutation.isPending}
      />
    </Dialog>
  )
}
