'use client'

import { useState } from 'react'

import { Check } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { GoalSlotSpinner } from '@/components/goalslot-logo'
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { CreateUserData } from '../utils/types'

interface CreateUserModalProps {
  isSuperAdmin: boolean
  isSubmitting: boolean
  onCancel: () => void
  onSubmit: (data: CreateUserData) => void
}

export function CreateUserModal({ isSuperAdmin, isSubmitting, onCancel, onSubmit }: CreateUserModalProps) {
  const [newUser, setNewUser] = useState<CreateUserData>({ email: '', password: '', name: '', role: 'USER' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error('All fields are required')
      return
    }
    onSubmit(newUser)
  }

  return (
    <DialogContent className="max-w-md border border-zinc-200 bg-white shadow-sm" showCloseButton={true}>
      <DialogHeader className="border-b border-zinc-200 bg-primary p-4">
        <DialogTitle className="text-xl font-black uppercase">Create Internal User</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 p-2 sm:p-6">
        <div>
          <label className="mb-2 block text-sm font-bold uppercase">Name</label>
          <input
            type="text"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className="w-full border border-zinc-200 px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="John Doe"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold uppercase">Email</label>
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="w-full border border-zinc-200 px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="john@example.com"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold uppercase">Password</label>
          <input
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            className="w-full border border-zinc-200 px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold uppercase">Role</label>
          <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value as any })}>
            <SelectTrigger className="h-auto w-full rounded-none border border-zinc-200 px-4 py-2 font-medium shadow-none focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">User</SelectItem>
              {isSuperAdmin && <SelectItem value="ADMIN">Admin</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-zinc-200 px-4 py-2 font-bold transition-colors hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 border border-zinc-200 bg-primary px-4 py-2 font-bold shadow-sm transition-all hover:shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <GoalSlotSpinner size="md" />
            ) : (
              <>
                <Check className="h-5 w-5" />
                Create
              </>
            )}
          </button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
