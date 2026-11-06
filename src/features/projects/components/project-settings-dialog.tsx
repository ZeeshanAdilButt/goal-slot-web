'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GoalSlotSpinner } from '@/components/goalslot-logo'

import {
  useDeleteProjectMutation,
  useProjectMembersQuery,
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
  useUpdateProjectMutation,
} from '../hooks/use-projects'
import { ROLE_LABELS, type ProjectMember, type ProjectRole, type ProjectSummary } from '../utils/types'
import { ColorSwatches } from './color-swatches'
import { MemberAvatar } from './member-avatar'
import { PROJECT_NAME_MAX } from './new-project-dialog'

interface ProjectSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: ProjectSummary
  meId: string | null | undefined
  /** Called after leaving or deleting, so the page can go back to My tasks. */
  onGone: () => void
}

const ROLES: ProjectRole[] = ['ADMIN', 'MEMBER', 'GUEST']

export function ProjectSettingsDialog({ open, onOpenChange, project, meId, onGone }: ProjectSettingsDialogProps) {
  const isAdmin = project.role === 'ADMIN'
  const membersQuery = useProjectMembersQuery(open ? project.id : null)
  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data])
  const adminCount = members.filter((m) => m.role === 'ADMIN').length
  const iAmLastAdmin = isAdmin && adminCount <= 1

  const updateProject = useUpdateProjectMutation(project.id)
  const deleteProject = useDeleteProjectMutation(project.id)
  const updateRole = useUpdateMemberRoleMutation(project.id)
  const removeMember = useRemoveMemberMutation(project.id)

  const [name, setName] = useState(project.name)
  const [color, setColor] = useState(project.color)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [removing, setRemoving] = useState<ProjectMember | null>(null)
  const [deleteText, setDeleteText] = useState('')

  useEffect(() => {
    if (open) {
      setName(project.name)
      setColor(project.color)
      setDeleteText('')
    }
  }, [open, project.name, project.color])

  const detailsChanged = name.trim() !== project.name || color.toUpperCase() !== project.color.toUpperCase()

  const saveDetails = async (event: FormEvent) => {
    event.preventDefault()
    if (!isAdmin || !name.trim() || !detailsChanged) return
    try {
      await updateProject.mutateAsync({ name: name.trim(), color })
    } catch {
      // toast shown by the mutation
    }
  }

  const leave = async () => {
    if (!meId) return
    try {
      await removeMember.mutateAsync({ userId: meId, leaving: true })
      setConfirmLeave(false)
      onOpenChange(false)
      onGone()
    } catch {
      setConfirmLeave(false)
    }
  }

  const remove = async () => {
    if (!removing) return
    try {
      await removeMember.mutateAsync({ userId: removing.userId })
    } catch {
      // toast shown by the mutation
    } finally {
      setRemoving(null)
    }
  }

  const archive = async () => {
    try {
      await updateProject.mutateAsync({ archived: true })
      setConfirmArchive(false)
      onOpenChange(false)
      onGone()
    } catch {
      setConfirmArchive(false)
    }
  }

  const deleteMatches = deleteText.trim() === project.name
  const doDelete = async () => {
    if (!deleteMatches) return
    try {
      await deleteProject.mutateAsync()
      onOpenChange(false)
      onGone()
    } catch {
      // toast shown by the mutation
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-zinc-900">Project settings and members</DialogTitle>
            <DialogDescription className="text-sm text-zinc-600">
              {isAdmin
                ? 'Rename the project, change its color and manage who is in it.'
                : `You are a ${ROLE_LABELS[project.role].toLowerCase()} of this project.`}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-6">
            <section aria-labelledby="project-details-heading">
              <h2 id="project-details-heading" className="mb-2 text-sm font-semibold text-zinc-900">
                Details
              </h2>
              <form onSubmit={saveDetails} className="space-y-3">
                <div>
                  <Label htmlFor="project-settings-name" className="mb-1.5 block text-[10px] tracking-wider">
                    Name
                  </Label>
                  <Input
                    id="project-settings-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={PROJECT_NAME_MAX}
                    disabled={!isAdmin}
                  />
                </div>
                <ColorSwatches name="project-settings-color" value={color} onChange={setColor} disabled={!isAdmin} />
                {isAdmin ? (
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!detailsChanged || !name.trim() || updateProject.isPending}
                  >
                    {updateProject.isPending ? 'Saving...' : 'Save changes'}
                  </Button>
                ) : null}
              </form>
            </section>

            <section aria-labelledby="project-members-heading">
              <h2 id="project-members-heading" className="mb-2 text-sm font-semibold text-zinc-900">
                Members <span className="font-normal text-zinc-500">{members.length || project.memberCount}</span>
              </h2>
              {membersQuery.isLoading ? (
                <div className="flex justify-center py-4">
                  <GoalSlotSpinner size="sm" />
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
                  {members.map((m) => {
                    const isMe = m.userId === meId
                    const isLastAdmin = m.role === 'ADMIN' && adminCount <= 1
                    return (
                      <li key={m.userId} className="flex flex-wrap items-center gap-3 px-3 py-2">
                        <MemberAvatar name={m.name} avatar={m.avatar} size="md" decorative />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-zinc-900">
                            {m.name}
                            {isMe ? <span className="ml-1.5 text-xs font-normal text-zinc-500">(you)</span> : null}
                          </div>
                          {m.email ? <div className="truncate text-xs text-zinc-500">{m.email}</div> : null}
                        </div>
                        {isAdmin ? (
                          <Select
                            value={m.role}
                            onValueChange={(role) => updateRole.mutate({ userId: m.userId, role: role as ProjectRole })}
                            disabled={isLastAdmin || updateRole.isPending}
                          >
                            <SelectTrigger
                              className="h-8 w-28 text-xs"
                              aria-label={`Role for ${m.name}`}
                              title={isLastAdmin ? 'A project needs at least one admin' : undefined}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs font-medium text-zinc-600">{ROLE_LABELS[m.role]}</span>
                        )}
                        {isAdmin && !isMe ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-rose-700 hover:bg-rose-50"
                            onClick={() => setRemoving(m)}
                            disabled={isLastAdmin}
                            aria-label={`Remove ${m.name}`}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section aria-labelledby="project-leave-heading" className="rounded-lg border border-zinc-200 p-3">
              <h2 id="project-leave-heading" className="text-sm font-semibold text-zinc-900">
                Leave project
              </h2>
              <p className="mt-1 text-xs text-zinc-600">
                {iAmLastAdmin
                  ? 'You are the only admin. Make someone else an admin first, or delete the project.'
                  : 'You stop seeing its tasks. Tasks assigned to you become unassigned.'}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => setConfirmLeave(true)}
                disabled={iAmLastAdmin || !meId}
              >
                Leave project
              </Button>
            </section>

            {isAdmin ? (
              <section aria-labelledby="project-archive-heading" className="rounded-lg border border-zinc-200 p-3">
                <h2 id="project-archive-heading" className="text-sm font-semibold text-zinc-900">
                  Archive project
                </h2>
                <p className="mt-1 text-xs text-zinc-600">
                  Hides it from the switcher and from everyone&apos;s My tasks. Nothing is deleted.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => setConfirmArchive(true)}
                  disabled={updateProject.isPending}
                >
                  Archive project
                </Button>
              </section>
            ) : null}

            {isAdmin ? (
              <section aria-labelledby="project-delete-heading" className="rounded-lg border border-rose-200 p-3">
                <h2 id="project-delete-heading" className="text-sm font-semibold text-rose-800">
                  Delete project
                </h2>
                <p className="mt-1 text-xs text-zinc-600">
                  Deletes the project and every task in it for all members. Time already logged stays in everyone&apos;s
                  time log. This cannot be undone.
                </p>
                <Label htmlFor="project-delete-confirm" className="mb-1 mt-3 block text-xs text-zinc-700">
                  Type <strong className="font-semibold">{project.name}</strong> to confirm
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    id="project-delete-confirm"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    autoComplete="off"
                    className="min-w-[12rem] flex-1"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="default"
                    onClick={doDelete}
                    disabled={!deleteMatches || deleteProject.isPending}
                  >
                    {deleteProject.isPending ? 'Deleting...' : 'Delete project'}
                  </Button>
                </div>
              </section>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title={`Leave ${project.name}?`}
        description="You will stop seeing this project's tasks. Tasks assigned to you become unassigned. An admin can invite you again."
        onConfirm={leave}
        confirmButtonText="Leave"
        variant="destructive"
        isLoading={removeMember.isPending}
      />

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={`Archive ${project.name}?`}
        description="It drops out of the switcher and out of everyone's My tasks. Its tasks and logged time are kept."
        onConfirm={archive}
        confirmButtonText="Archive"
        isLoading={updateProject.isPending}
      />

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removing?.name ?? 'member'}?`}
        description="They stop seeing this project. Tasks assigned to them become unassigned."
        onConfirm={remove}
        confirmButtonText="Remove"
        variant="destructive"
        isLoading={removeMember.isPending}
      />
    </>
  )
}
