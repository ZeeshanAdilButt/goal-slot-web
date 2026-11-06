'use client'

import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useCreateProjectMutation } from '../hooks/use-projects'
import { DEFAULT_PROJECT_COLOR, type ProjectSummary } from '../utils/types'
import { ColorSwatches } from './color-swatches'

export const PROJECT_NAME_MAX = 80

interface NewProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (project: ProjectSummary) => void
}

export function NewProjectDialog({ open, onOpenChange, onCreated }: NewProjectDialogProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(DEFAULT_PROJECT_COLOR)
  const createProject = useCreateProjectMutation()

  useEffect(() => {
    if (open) {
      setName('')
      setColor(DEFAULT_PROJECT_COLOR)
    }
  }, [open])

  const trimmed = name.trim()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!trimmed || createProject.isPending) return
    try {
      const project = await createProject.mutateAsync({ name: trimmed, color })
      onOpenChange(false)
      if (project?.id) onCreated(project)
    } catch {
      // toast already shown by the mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-900">New project</DialogTitle>
          <DialogDescription className="text-sm text-zinc-600">
            A shared space of tasks. Invite people after it is created; they never see your personal tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div>
            <Label htmlFor="new-project-name" className="mb-1.5 block text-[10px] tracking-wider">
              Name <span className="text-[#f2cc0d]">*</span>
            </Label>
            <Input
              id="new-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GoalSlot Mobile"
              maxLength={PROJECT_NAME_MAX}
              autoFocus
              required
            />
          </div>
          <ColorSwatches name="new-project-color" value={color} onChange={setColor} />
          <div className="flex gap-3 border-t border-zinc-200 pt-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" className="flex-1" disabled={!trimmed || createProject.isPending}>
              {createProject.isPending ? 'Creating...' : 'Create project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
