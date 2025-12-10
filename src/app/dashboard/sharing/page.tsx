'use client'

import { useEffect, useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, Clock, Edit3, Eye, Mail, Plus, Share2, Trash2, UserPlus, Users, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { sharingApi } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'

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
  }
}

interface PendingInvite {
  id: string
  ownerEmail: string
  ownerName: string
  accessLevel: 'VIEW' | 'EDIT'
  createdAt: string
}

export default function SharingPage() {
  const [shares, setShares] = useState<DataShare[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [sharesRes, invitesRes] = await Promise.all([sharingApi.getMyShares(), sharingApi.getPendingInvites()])
      setShares(sharesRes.data)
      setPendingInvites(invitesRes.data)
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">Sharing</h1>
          <p className="font-mono uppercase text-gray-600">Share your data with others</p>
        </div>

        <button onClick={() => setShowInviteModal(true)} className="btn-brutal flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invite User
        </button>
      </div>

      {/* Pending Invites Received */}
      {pendingInvites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-brutal-colored bg-accent-orange text-white"
        >
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold uppercase">
            <Mail className="h-5 w-5" />
            Pending Invitations ({pendingInvites.length})
          </h2>

          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between border border-white/30 bg-white/10 p-4">
                <div>
                  <div className="font-bold">{invite.ownerName}</div>
                  <div className="font-mono text-sm opacity-75">{invite.ownerEmail}</div>
                  <div className="mt-1 font-mono text-xs">
                    {invite.accessLevel === 'VIEW' ? 'View Only' : 'Can Edit'} • {formatDate(invite.createdAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvite(invite.id)}
                    className="flex h-10 w-10 items-center justify-center border-2 border-white bg-white text-accent-green"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(invite.id)}
                    className="flex h-10 w-10 items-center justify-center border-2 border-white bg-white/20 text-white"
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
        <>
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

            <div className="card-brutal-colored bg-primary">
              <h3 className="mb-4 flex items-center gap-2 font-bold uppercase">
                <Edit3 className="h-5 w-5" />
                Edit Access
              </h3>
              <ul className="space-y-2 font-mono text-sm">
                <li>• Everything in View access</li>
                <li>• Add time entries on your behalf</li>
                <li>• Update schedule blocks</li>
                <li>• Modify goal progress</li>
              </ul>
            </div>
          </div>
        </>
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="modal-brutal relative z-10 w-full max-w-md"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold uppercase">Invite User</h2>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center border-3 border-secondary hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="btn-brutal-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="btn-brutal-dark flex-1">
                  {isLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
