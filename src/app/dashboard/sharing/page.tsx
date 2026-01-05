'use client'

import { useEffect, useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, Clock, Edit3, Eye, Mail, Share2, Trash2, UserPlus, Users, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { sharingApi } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { SharedReportsView } from './shared-reports-view'

interface DataShare {
  id: string
  email: string
  accessLevel: 'VIEW' | 'EDIT'
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED'
  createdAt: string
  expiresAt?: string
  sharedWith?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

interface PendingInvite {
  id: string
  owner: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  ownerEmail?: string
  ownerName?: string
  accessLevel: 'VIEW' | 'EDIT'
  createdAt: string
}

interface SharedWithMeUser {
  id: string
  ownerId: string
  owner: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  createdAt: string
}

type TabType = 'my' | 'shared-with-me'

export default function SharingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('my')
  const [shares, setShares] = useState<DataShare[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [sharedWithMe, setSharedWithMe] = useState<SharedWithMeUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [sharesRes, invitesRes, sharedWithMeRes] = await Promise.all([
        sharingApi.getMyShares(),
        sharingApi.getPendingInvites(),
        sharingApi.getSharedWithMe(),
      ])
      setShares(sharesRes.data)
      setPendingInvites(invitesRes.data)
      setSharedWithMe(sharedWithMeRes.data)
    } catch (error) {
      toast.error('Failed to load sharing data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this share? The user will lose access.')) return

    try {
      await sharingApi.revoke(id)
      toast.success('Access revoked')
      loadData()
    } catch (error) {
      toast.error('Failed to revoke access')
    }
  }

  const handleAcceptInvite = async (id: string) => {
    try {
      await sharingApi.acceptInvite(id)
      toast.success('Invite accepted!')
      loadData()
    } catch (error) {
      toast.error('Failed to accept invite')
    }
  }

  const handleDeclineInvite = async (id: string) => {
    try {
      await sharingApi.declineInvite(id)
      toast.success('Invite declined')
      loadData()
    } catch (error) {
      toast.error('Failed to decline invite')
    }
  }

  const activeShares = shares.filter((s) => s.status === 'ACCEPTED')
  const pendingShares = shares.filter((s) => s.status === 'PENDING')

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">Sharing</h1>
          <p className="font-mono uppercase text-gray-600">Manage shared access and view shared reports</p>
        </div>

        {activeTab === 'my' && (
          <button onClick={() => setShowInviteModal(true)} className="btn-brutal flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b-3 border-secondary">
        <button
          onClick={() => setActiveTab('my')}
          className={cn(
            'px-6 py-3 font-bold uppercase transition-colors border-b-4 -mb-[3px]',
            activeTab === 'my' ? 'border-primary bg-primary text-secondary' : 'border-transparent hover:bg-gray-100',
          )}
        >
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            My
            {activeShares.length > 0 && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-white">{activeShares.length}</span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('shared-with-me')}
          className={cn(
            'px-6 py-3 font-bold uppercase transition-colors border-b-4 -mb-[3px]',
            activeTab === 'shared-with-me'
              ? 'border-primary bg-primary text-secondary'
              : 'border-transparent hover:bg-gray-100',
          )}
        >
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shared with me
            {sharedWithMe.length > 0 && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-white">{sharedWithMe.length}</span>
            )}
          </div>
        </button>
      </div>

      {/* Pending Invites Received */}
      {pendingInvites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-brutal-colored bg-accent-orange text-white"
        >
          <h2 className="mb-2 flex items-center gap-2 text-xl font-bold uppercase">
            <Mail className="h-5 w-5" />
            Pending Invitations ({pendingInvites.length})
          </h2>
          <p className="mb-4 text-sm opacity-80">People who want to share their reports with you</p>

          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between border border-white/30 bg-white/10 p-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider opacity-70">Invitation from</div>
                  <div className="font-bold">{invite.owner?.name || invite.ownerName}</div>
                  <div className="font-mono text-sm opacity-75">{invite.owner?.email || invite.ownerEmail}</div>
                  <div className="mt-1 font-mono text-xs">
                    {invite.accessLevel === 'VIEW' ? '👁️ View their reports' : '📊 View their reports'} •{' '}
                    {formatDate(invite.createdAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvite(invite.id)}
                    className="flex h-10 w-10 items-center justify-center border-2 border-white bg-white text-accent-green"
                    title="Accept invitation"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(invite.id)}
                    className="flex h-10 w-10 items-center justify-center border-2 border-white bg-white/20 text-white"
                    title="Decline invitation"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin border-4 border-secondary border-t-primary" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'my' ? (
            <motion.div
              key="my-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Active Shares */}
              <div className="card-brutal">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-bold uppercase">
                  <Users className="h-5 w-5" />
                  People with Access ({activeShares.length})
                </h2>

                {activeShares.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <Share2 className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="font-mono uppercase">No active shares</p>
                    <p className="text-sm">Invite someone to view your data</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeShares.map((share) => (
                      <ShareCard key={share.id} share={share} onRevoke={() => handleRevoke(share.id)} />
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Shares */}
              {pendingShares.length > 0 && (
                <div className="card-brutal">
                  <h2 className="mb-6 flex items-center gap-2 text-xl font-bold uppercase">
                    <Clock className="h-5 w-5" />
                    Pending Invites Sent ({pendingShares.length})
                  </h2>

                  <div className="space-y-3">
                    {pendingShares.map((share) => (
                      <ShareCard key={share.id} share={share} onRevoke={() => handleRevoke(share.id)} isPending />
                    ))}
                  </div>
                </div>
              )}

              {/* Sharing Info */}
              <div className="grid grid-cols-1 gap-6">
                <div className="card-brutal">
                  <h3 className="mb-4 flex items-center gap-2 font-bold uppercase">
                    <Eye className="h-5 w-5" />
                    View Access
                  </h3>
                  <ul className="space-y-2 font-mono text-sm">
                    <li>• View your goals and progress</li>
                    <li>• See your time entries</li>
                    <li>• Access your schedule</li>
                    <li>• View reports and analytics</li>
                  </ul>
                </div>
              </div>
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

      {/* Invite Modal */}
      <InviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} onSuccess={loadData} />
    </div>
  )
}

// Share Card Component
function ShareCard({
  share,
  onRevoke,
  isPending = false,
}: {
  share: DataShare
  onRevoke: () => void
  isPending?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between border-2 border-secondary bg-white p-4"
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-10 h-10 border-2 border-secondary flex items-center justify-center font-bold text-lg',
            share.accessLevel === 'EDIT' ? 'bg-primary' : 'bg-gray-100',
          )}
        >
          {share.sharedWith?.name?.[0] || share.email[0].toUpperCase()}
        </div>
        <div>
          <div className="font-bold">{share.sharedWith?.name || share.email}</div>
          <div className="font-mono text-sm text-gray-600">{share.email}</div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-mono uppercase border border-secondary',
                share.accessLevel === 'EDIT' ? 'bg-primary' : 'bg-gray-100',
              )}
            >
              {share.accessLevel === 'EDIT' ? 'Can Edit' : 'View Only'}
            </span>
            {isPending && (
              <span className="bg-accent-orange px-2 py-0.5 font-mono text-xs uppercase text-white">Pending</span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onRevoke}
        className="group flex h-10 w-10 items-center justify-center border-2 border-secondary transition-colors hover:border-red-500 hover:bg-red-50"
      >
        <Trash2 className="h-5 w-5 text-gray-600 group-hover:text-red-500" />
      </button>
    </motion.div>
  )
}

// Invite Modal
function InviteModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [accessLevel, setAccessLevel] = useState<'VIEW' | 'EDIT'>('VIEW')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }

    setIsLoading(true)
    try {
      await sharingApi.share({
        email,
        accessLevel,
      })
      toast.success(`Invite sent to ${email}!`)
      onSuccess()
      onClose()
      setEmail('')
      setAccessLevel('VIEW')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invite')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="modal-brutal max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase">Invite User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="input-brutal"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold uppercase">Access Level</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAccessLevel('VIEW')}
                className={cn(
                  'p-4 border-3 border-secondary text-left transition-all',
                  accessLevel === 'VIEW' ? 'bg-primary shadow-brutal-sm' : 'bg-white hover:bg-gray-100',
                )}
              >
                <Eye className="mb-2 h-6 w-6" />
                <div className="font-bold uppercase">View Only</div>
                <div className="font-mono text-xs text-gray-600">Can view your data</div>
              </button>
              <button
                type="button"
                onClick={() => setAccessLevel('EDIT')}
                className={cn(
                  'p-4 border-3 border-secondary text-left transition-all',
                  accessLevel === 'EDIT' ? 'bg-primary shadow-brutal-sm' : 'bg-white hover:bg-gray-100',
                )}
              >
                <Edit3 className="mb-2 h-6 w-6" />
                <div className="font-bold uppercase">Can Edit</div>
                <div className="font-mono text-xs text-gray-600">Can modify your data</div>
              </button>
            </div>
          </div>

          <div className="border-2 border-secondary bg-gray-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-orange" />
              <p className="font-mono text-sm text-gray-600">
                The invited user will receive an email notification. They must accept the invite to gain access.
              </p>
            </div>
          </div>
        </form>
        <DialogFooter className="flex-row gap-4 pt-4">
          <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-brutal-dark flex-1">
            {isLoading ? 'Sending...' : 'Send Invite'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
