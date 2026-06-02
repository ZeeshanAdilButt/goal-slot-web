'use client'

import { useState } from 'react'

import { Ban, Check, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { usersApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loading } from '@/components/ui/loading'
import { GoalSlotSpinner } from '@/components/goalslot-logo'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { AdminModalType, AdminUser, CreateUserData } from '../utils/types'

interface AdminUserModalsProps {
  modalType: AdminModalType
  selectedUser: AdminUser | null
  selectedUsers: string[]
  onClose: () => void
  onReload: () => void
  onClearSelectedUsers: () => void
}

export function AdminUserModals({
  modalType,
  selectedUser,
  selectedUsers,
  onClose,
  onReload,
  onClearSelectedUsers,
}: AdminUserModalsProps) {
  const { user: currentUser } = useAuthStore()
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'

  const [newUser, setNewUser] = useState<CreateUserData>({ email: '', password: '', name: '', role: 'USER' })
  const [disableReason, setDisableReason] = useState('')
  const [assignPlan, setAssignPlan] = useState<'FREE' | 'BASIC' | 'PRO'>('FREE')
  const [assignPlanNote, setAssignPlanNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    onClose()
    setDisableReason('')
    setAssignPlan('FREE')
    setAssignPlanNote('')
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error('All fields are required')
      return
    }
    setIsSubmitting(true)
    try {
      await usersApi.createInternal(newUser)
      toast.success('User created successfully')
      setNewUser({ email: '', password: '', name: '', role: 'USER' })
      handleClose()
      onReload()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!selectedUser) return
    if (!disableReason) {
      toast.error('Please provide a reason for disabling the user')
      return
    }
    setIsSubmitting(true)
    try {
      await usersApi.toggleStatus(selectedUser.id, { isDisabled: true, reason: disableReason })
      toast.success('User disabled')
      handleClose()
      onReload()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user status')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignPlan = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)
    try {
      await usersApi.assignPlan(selectedUser.id, { plan: assignPlan, note: assignPlanNote || undefined })
      toast.success(`${assignPlan} plan assigned to ${selectedUser.name}`)
      handleClose()
      onReload()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkAssignPlan = async () => {
    if (selectedUsers.length === 0) return
    setIsSubmitting(true)
    try {
      await usersApi.bulkAssignPlan({ userIds: selectedUsers, plan: assignPlan, note: assignPlanNote || undefined })
      toast.success(`${assignPlan} plan assigned to ${selectedUsers.length} users`)
      onClearSelectedUsers()
      handleClose()
      onReload()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to bulk assign plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={modalType !== null} onOpenChange={(open) => !open && handleClose()}>
      {/* Create User */}
      {modalType === 'create' && (
        <DialogContent className="max-w-md border border-zinc-200 bg-white shadow-sm" showCloseButton>
          <DialogHeader className="border-b border-zinc-200 bg-primary p-4">
            <DialogTitle className="text-xl font-black uppercase">Create Internal User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 p-2 sm:p-6">
            {(['name', 'email', 'password'] as const).map((field) => (
              <div key={field}>
                <label className="mb-2 block text-sm font-bold uppercase">{field === 'name' ? 'Name' : field === 'email' ? 'Email' : 'Password'}</label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={newUser[field]}
                  onChange={(e) => setNewUser({ ...newUser, [field]: e.target.value })}
                  className="w-full border border-zinc-200 px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={field === 'password' ? 8 : undefined}
                />
              </div>
            ))}
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Role</label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as any })}>
                <SelectTrigger className="h-auto w-full rounded-none border border-zinc-200 px-4 py-2 font-medium shadow-none focus:ring-2 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  {isSuperAdmin && <SelectItem value="ADMIN">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="flex-row gap-3 pt-4">
              <button type="button" onClick={handleClose} className="flex-1 border border-zinc-200 px-4 py-2 font-bold transition-colors hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex flex-1 items-center justify-center gap-2 border border-zinc-200 bg-primary px-4 py-2 font-bold shadow-sm transition-all disabled:opacity-50">
                {isSubmitting ? <GoalSlotSpinner size="md" /> : <><Check className="h-5 w-5" /> Create</>}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}

      {/* Disable User */}
      {modalType === 'disable' && selectedUser && (
        <DialogContent className="max-w-md border border-zinc-200 bg-white shadow-sm" showCloseButton>
          <DialogHeader className="border-b border-zinc-200 bg-red-500 p-4 text-white">
            <DialogTitle className="text-xl font-black uppercase">Disable User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-2 sm:p-6">
            <p className="text-gray-600">
              You are about to disable <strong>{selectedUser.name}</strong> ({selectedUser.email}). They will not be able to log in until re-enabled.
            </p>
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Reason *</label>
              <textarea
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                className="w-full border border-zinc-200 px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                required
              />
            </div>
            <DialogFooter className="flex-row gap-3 pt-4">
              <button type="button" onClick={handleClose} className="flex-1 border border-zinc-200 px-4 py-2 font-bold transition-colors hover:bg-gray-100">Cancel</button>
              <button onClick={handleToggleStatus} disabled={isSubmitting || !disableReason} className="flex flex-1 items-center justify-center gap-2 border border-zinc-200 bg-red-500 px-4 py-2 font-bold text-white disabled:opacity-50">
                {isSubmitting ? <Loading size="sm" className="h-5 w-5" /> : <><Ban className="h-5 w-5" /> Disable</>}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      )}

      {/* Assign Plan (single or bulk) */}
      {(modalType === 'assignPlan' || modalType === 'bulkAssignPlan') && (
        <DialogContent className="max-w-md border border-zinc-200 bg-white shadow-sm" showCloseButton>
          <DialogHeader className="border-b border-zinc-200 bg-primary p-4">
            <DialogTitle className="text-xl font-black uppercase">
              {modalType === 'bulkAssignPlan' ? `Assign to ${selectedUsers.length} Users` : 'Assign Plan'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-2 sm:p-6">
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Plan</label>
              <Select value={assignPlan} onValueChange={(v) => setAssignPlan(v as any)}>
                <SelectTrigger className="h-auto w-full rounded-none border border-zinc-200 px-4 py-2 font-medium shadow-none focus:ring-2 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="BASIC">Pro ($7/mo - 10 Goals)</SelectItem>
                  <SelectItem value="PRO">Max ($12/mo - Unlimited)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold uppercase">Note (Optional)</label>
              <textarea
                value={assignPlanNote}
                onChange={(e) => setAssignPlanNote(e.target.value)}
                className="w-full border border-zinc-200 px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
              />
            </div>
            <DialogFooter className="flex-row gap-3 pt-4">
              <button type="button" onClick={handleClose} className="flex-1 border border-zinc-200 px-4 py-2 font-bold transition-colors hover:bg-gray-100">Cancel</button>
              <button
                onClick={modalType === 'bulkAssignPlan' ? handleBulkAssignPlan : handleAssignPlan}
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 border border-zinc-200 bg-primary px-4 py-2 font-bold disabled:opacity-50"
              >
                {isSubmitting ? <Loading size="sm" className="h-5 w-5" /> : <><Sparkles className="h-5 w-5" /> Assign</>}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      )}

      {/* User Details */}
      {modalType === 'details' && selectedUser && (
        <DialogContent className="max-w-md border border-zinc-200 bg-white shadow-sm" showCloseButton>
          <DialogHeader className="border-b border-zinc-200 bg-gray-100 p-4">
            <DialogTitle className="text-xl font-black uppercase">User Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-2 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center border border-zinc-200 bg-primary text-2xl font-black">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-black">{selectedUser.name}</h3>
                <p className="text-gray-600">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Role', value: selectedUser.role.replace('_', ' ') },
                { label: 'Type', value: selectedUser.userType },
                { label: 'Plan', value: selectedUser.plan },
                { label: 'Status', value: selectedUser.isDisabled ? 'Disabled' : 'Active', className: selectedUser.isDisabled ? 'text-red-600' : 'text-green-600' },
                { label: 'Email Verified', value: selectedUser.emailVerified ? 'Yes' : 'No', className: selectedUser.emailVerified ? 'text-green-600' : 'text-orange-600' },
                { label: 'Unlimited Access', value: selectedUser.unlimitedAccess ? 'Yes' : 'No' },
              ].map(({ label, value, className }) => (
                <div key={label}>
                  <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
                  <p className={cn('font-bold', className)}>{value}</p>
                </div>
              ))}
            </div>
            {selectedUser.isDisabled && selectedUser.disabledReason && (
              <div className="border border-rose-200 bg-red-50 p-3">
                <p className="text-xs font-bold uppercase text-red-600">Disabled Reason</p>
                <p className="text-red-800">{selectedUser.disabledReason}</p>
              </div>
            )}
            {selectedUser.adminAssignedPlan && (
              <div className="border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-bold uppercase text-emerald-600">Admin Assigned Plan</p>
                <p className="font-bold text-emerald-800">{selectedUser.adminAssignedPlan}</p>
                {selectedUser.adminAssignedPlanNote && (
                  <p className="mt-1 text-sm text-emerald-700">{selectedUser.adminAssignedPlanNote}</p>
                )}
              </div>
            )}
            <div className="border border-sky-200 bg-blue-50 p-3">
              <p className="mb-2 text-xs font-bold uppercase text-blue-600">Subscription & Billing</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-blue-600">Status</p>
                  <p className={cn('font-bold', selectedUser.subscriptionStatus === 'active' ? 'text-green-600' : selectedUser.subscriptionStatus === 'past_due' ? 'text-orange-600' : 'text-gray-600')}>
                    {selectedUser.subscriptionStatus || 'No subscription'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Subscription Ends</p>
                  <p className="font-medium text-blue-800">
                    {selectedUser.subscriptionEndDate ? new Date(selectedUser.subscriptionEndDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">First Payment</p>
                  <p className="font-medium text-blue-800">
                    {selectedUser.firstPaymentDate ? new Date(selectedUser.firstPaymentDate).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Last Payment</p>
                  <p className="font-medium text-blue-800">
                    {selectedUser.lastPaymentDate ? new Date(selectedUser.lastPaymentDate).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                {selectedUser.invoicePending && (
                  <div className="col-span-2">
                    <p className="font-bold text-orange-600">⚠ Invoice pending payment</p>
                  </div>
                )}
                {selectedUser.stripeCustomerId && (
                  <div className="col-span-2 border-t border-blue-200 pt-2">
                    <p className="text-xs text-blue-600">Stripe Customer ID</p>
                    <p className="font-mono text-xs text-blue-800">{selectedUser.stripeCustomerId}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-zinc-200 pt-4">
              <div>
                <p className="text-xs font-bold uppercase text-gray-500">Created</p>
                <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-500">Updated</p>
                <p className="text-sm">{new Date(selectedUser.updatedAt).toLocaleString()}</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-full border border-zinc-200 px-4 py-2 font-bold transition-colors hover:bg-gray-100">
              Close
            </button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
