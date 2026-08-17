'use client'

import { cn } from '@/lib/utils'
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { User } from '../utils/types'

interface UserDetailsModalProps {
  user: User
  onClose: () => void
}

export function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  return (
    <DialogContent className="max-w-md border border-zinc-200 bg-white shadow-sm" showCloseButton={true}>
      <DialogHeader className="border-b border-zinc-200 bg-gray-100 p-4">
        <DialogTitle className="text-xl font-black uppercase">User Details</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 p-2 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center border border-zinc-200 bg-primary text-2xl font-black">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-black">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Role</p>
            <p className="font-bold">{user.role.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Type</p>
            <p className="font-bold">{user.userType}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Plan</p>
            <p className="font-bold">{user.plan}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Status</p>
            <p className={cn('font-bold', user.isDisabled ? 'text-red-600' : 'text-green-600')}>
              {user.isDisabled ? 'Disabled' : 'Active'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Email Verified</p>
            <p className={cn('font-bold', user.emailVerified ? 'text-green-600' : 'text-orange-600')}>
              {user.emailVerified ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Unlimited Access</p>
            <p className="font-bold">{user.unlimitedAccess ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {user.isDisabled && user.disabledReason && (
          <div className="border border-rose-200 bg-red-50 p-3">
            <p className="text-xs font-bold uppercase text-red-600">Disabled Reason</p>
            <p className="text-red-800">{user.disabledReason}</p>
            {user.disabledAt && (
              <p className="mt-1 text-xs text-red-600">Disabled on {new Date(user.disabledAt).toLocaleDateString()}</p>
            )}
          </div>
        )}

        {user.adminAssignedPlan && (
          <div className="border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-bold uppercase text-emerald-600">Admin Assigned Plan</p>
            <p className="font-bold text-emerald-800">{user.adminAssignedPlan}</p>
            {user.adminAssignedPlanNote && <p className="mt-1 text-sm text-emerald-700">{user.adminAssignedPlanNote}</p>}
            {user.adminAssignedPlanAt && (
              <p className="mt-1 text-xs text-emerald-600">
                Assigned on {new Date(user.adminAssignedPlanAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Subscription & Billing Section */}
        <div className="border border-sky-200 bg-blue-50 p-3">
          <p className="mb-2 text-xs font-bold uppercase text-blue-600">Subscription & Billing</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-blue-600">Status</p>
              <p
                className={cn(
                  'font-bold',
                  user.subscriptionStatus === 'active'
                    ? 'text-green-600'
                    : user.subscriptionStatus === 'past_due'
                      ? 'text-orange-600'
                      : user.subscriptionStatus === 'canceled'
                        ? 'text-red-600'
                        : 'text-gray-600',
                )}
              >
                {user.subscriptionStatus || 'No subscription'}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Subscription Ends</p>
              <p className="font-medium text-blue-800">
                {user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">First Payment</p>
              <p className="font-medium text-blue-800">
                {user.firstPaymentDate ? new Date(user.firstPaymentDate).toLocaleDateString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Last Payment</p>
              <p className="font-medium text-blue-800">
                {user.lastPaymentDate ? new Date(user.lastPaymentDate).toLocaleDateString() : 'Never'}
              </p>
            </div>
            {user.invoicePending && (
              <div className="col-span-2">
                <p className="font-bold text-orange-600">⚠ Invoice pending payment</p>
              </div>
            )}
            {user.stripeCustomerId && (
              <div className="col-span-2 border-t border-blue-200 pt-2">
                <p className="text-xs text-blue-600">Stripe Customer ID</p>
                <p className="font-mono text-xs text-blue-800">{user.stripeCustomerId}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-zinc-200 pt-4">
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Created</p>
            <p className="text-sm">{new Date(user.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Updated</p>
            <p className="text-sm">{new Date(user.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full border border-zinc-200 px-4 py-2 font-bold transition-colors hover:bg-gray-100"
        >
          Close
        </button>
      </div>
    </DialogContent>
  )
}
