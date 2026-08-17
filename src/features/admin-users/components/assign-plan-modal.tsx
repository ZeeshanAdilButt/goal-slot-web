'use client'

import { useState } from 'react'

import { Sparkles } from 'lucide-react'

import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loading } from '@/components/ui/loading'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { PlanValue, User } from '../utils/types'

type AssignPlanModalProps =
  | {
      mode: 'single'
      user: User
      isSubmitting: boolean
      onCancel: () => void
      onConfirm: (plan: PlanValue, note: string) => void
    }
  | {
      mode: 'bulk'
      userCount: number
      isSubmitting: boolean
      onCancel: () => void
      onConfirm: (plan: PlanValue, note: string) => void
    }

export function AssignPlanModal(props: AssignPlanModalProps) {
  const { mode, isSubmitting, onCancel, onConfirm } = props
  const [plan, setPlan] = useState<PlanValue>(mode === 'single' ? props.user.plan : 'FREE')
  const [note, setNote] = useState('')

  return (
    <DialogContent className="max-w-md border border-zinc-200 bg-white shadow-sm" showCloseButton={true}>
      <DialogHeader className="border-b border-zinc-200 bg-primary p-4">
        <DialogTitle className="text-xl font-black uppercase">
          {mode === 'bulk' ? `Assign to ${props.userCount} Users` : 'Assign Plan'}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 p-2 sm:p-6">
        <p className="text-gray-600">
          {mode === 'bulk' ? (
            'Assign a subscription plan to the selected users.'
          ) : (
            <>
              Assign a subscription plan to <strong>{props.user.name}</strong>.
            </>
          )}
        </p>
        <div>
          <label className="mb-2 block text-sm font-bold uppercase">Plan</label>
          <Select value={plan} onValueChange={(value) => setPlan(value as PlanValue)}>
            <SelectTrigger className="h-auto w-full rounded-none border border-zinc-200 px-4 py-2 font-medium shadow-none focus:ring-2 focus:ring-primary">
              <SelectValue placeholder="Select plan" />
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
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-zinc-200 px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., Early adopter reward, Contest winner"
            rows={2}
          />
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
            onClick={() => onConfirm(plan, note)}
            disabled={isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 border border-zinc-200 bg-primary px-4 py-2 font-bold shadow-sm transition-all hover:shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loading size="sm" className="h-5 w-5" />
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Assign
              </>
            )}
          </button>
        </DialogFooter>
      </div>
    </DialogContent>
  )
}
