'use client'

import { useState } from 'react'

import { SharedReportsView } from '@/features/sharing/components/shared-reports-view'
import { SharingActiveShares } from '@/features/sharing/components/sharing-active-shares'
import { SharingHeader } from '@/features/sharing/components/sharing-header'
import { SharingInviteModal } from '@/features/sharing/components/sharing-invite-modal'
import { SharingPendingInvites } from '@/features/sharing/components/sharing-pending-invites'
import { SharingTabs } from '@/features/sharing/components/sharing-tabs'
import {
  useAcceptInviteMutation,
  useDeclineInviteMutation,
  useRevokeShareMutation,
} from '@/features/sharing/hooks/use-sharing-mutations'
import {
  useMySharesQuery,
  usePendingInvitesQuery,
  useSharedWithMeQuery,
} from '@/features/sharing/hooks/use-sharing-queries'
import { DataShare, TabType } from '@/features/sharing/utils/types'
import { AnimatePresence, motion } from 'framer-motion'

import { Loading } from '@/components/ui/loading'

export function SharingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('my')
  const [showInviteModal, setShowInviteModal] = useState(false)

  const mySharesQuery = useMySharesQuery()
  const pendingInvitesQuery = usePendingInvitesQuery()
  const sharedWithMeQuery = useSharedWithMeQuery()

  const revokeMutation = useRevokeShareMutation()
  const acceptInviteMutation = useAcceptInviteMutation()
  const declineInviteMutation = useDeclineInviteMutation()

  const shares = (mySharesQuery.data ?? []) as DataShare[]
  const pendingInvites = pendingInvitesQuery.data ?? []
  const sharedWithMe = sharedWithMeQuery.data ?? []

  const activeShares = shares.filter((s) => s.status === 'ACCEPTED')
  const pendingShares = shares.filter((s) => s.status === 'PENDING')

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this share? The user will lose access.')) return
    revokeMutation.mutate(id)
  }

  const handleAcceptInvite = (id: string) => {
    acceptInviteMutation.mutate(id)
  }

  const handleDeclineInvite = (id: string) => {
    declineInviteMutation.mutate(id)
  }

  const isLoading = mySharesQuery.isLoading || pendingInvitesQuery.isLoading || sharedWithMeQuery.isLoading

  return (
    <div className="space-y-8 p-6">
      <SharingHeader onCreateClick={() => setShowInviteModal(true)} showInviteButton={activeTab === 'my'} />

      <SharingTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeSharesCount={activeShares.length}
        sharedWithMeCount={sharedWithMe.length}
      />

      <SharingPendingInvites invites={pendingInvites} onAccept={handleAcceptInvite} onDecline={handleDeclineInvite} />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loading />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'my' ? (
            <motion.div
              key="my-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <SharingActiveShares activeShares={activeShares} pendingShares={pendingShares} onRevoke={handleRevoke} />
            </motion.div>
          ) : (
            <motion.div
              key="shared-with-me-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SharedReportsView sharedWithMe={sharedWithMe} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <SharingInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          mySharesQuery.refetch()
          pendingInvitesQuery.refetch()
        }}
      />
    </div>
  )
}
