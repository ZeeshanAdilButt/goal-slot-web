'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Share2, 
  Users, 
  Mail, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus,
  X,
  Clock,
  Check,
  AlertCircle,
  UserPlus
} from 'lucide-react'
import { sharingApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
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
      const [sharesRes, invitesRes] = await Promise.all([
        sharingApi.getMyShares(),
        sharingApi.getPendingInvites(),
      ])
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

  const activeShares = shares.filter(s => s.status === 'ACCEPTED')
  const pendingShares = shares.filter(s => s.status === 'PENDING')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase">Sharing</h1>
          <p className="font-mono text-gray-600 uppercase">Share your data with others</p>
        </div>

        <button 
          onClick={() => setShowInviteModal(true)}
          className="btn-brutal flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
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
          <h2 className="text-xl font-bold uppercase mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Pending Invitations ({pendingInvites.length})
          </h2>

          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-4 bg-white/10 border border-white/30">
                <div>
                  <div className="font-bold">{invite.ownerName}</div>
                  <div className="font-mono text-sm opacity-75">{invite.ownerEmail}</div>
                  <div className="font-mono text-xs mt-1">
                    {invite.accessLevel === 'VIEW' ? 'View Only' : 'Can Edit'} • {formatDate(invite.createdAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvite(invite.id)}
                    className="w-10 h-10 bg-white text-accent-green border-2 border-white flex items-center justify-center"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(invite.id)}
                    className="w-10 h-10 bg-white/20 text-white border-2 border-white flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-secondary border-t-primary" />
        </div>
      ) : (
        <>
          {/* Active Shares */}
          <div className="card-brutal">
            <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
              <Users className="w-5 h-5" />
              People with Access ({activeShares.length})
            </h2>

            {activeShares.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Share2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
              <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-brutal">
              <h3 className="font-bold uppercase mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
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
              <h3 className="font-bold uppercase mb-4 flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
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
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={loadData}
      />
    </div>
  )
}

// Share Card Component
function ShareCard({ 
  share, 
  onRevoke, 
  isPending = false 
}: { 
  share: DataShare
  onRevoke: () => void
  isPending?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 border-2 border-secondary bg-white"
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-10 h-10 border-2 border-secondary flex items-center justify-center font-bold text-lg',
          share.accessLevel === 'EDIT' ? 'bg-primary' : 'bg-gray-100'
        )}>
          {share.sharedWith?.name?.[0] || share.email[0].toUpperCase()}
        </div>
        <div>
          <div className="font-bold">
            {share.sharedWith?.name || share.email}
          </div>
          <div className="font-mono text-sm text-gray-600">
            {share.email}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'px-2 py-0.5 text-xs font-mono uppercase border border-secondary',
              share.accessLevel === 'EDIT' ? 'bg-primary' : 'bg-gray-100'
            )}>
              {share.accessLevel === 'EDIT' ? 'Can Edit' : 'View Only'}
            </span>
            {isPending && (
              <span className="px-2 py-0.5 text-xs font-mono uppercase bg-accent-orange text-white">
                Pending
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onRevoke}
        className="w-10 h-10 border-2 border-secondary flex items-center justify-center hover:bg-red-50 hover:border-red-500 transition-colors group"
      >
        <Trash2 className="w-5 h-5 text-gray-600 group-hover:text-red-500" />
      </button>
    </motion.div>
  )
}

// Invite Modal
function InviteModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
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
            className="modal-brutal w-full max-w-md relative z-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold uppercase">Invite User</h2>
              <button onClick={onClose} className="w-10 h-10 border-3 border-secondary flex items-center justify-center hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-bold uppercase text-sm mb-2">Email Address</label>
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
                <label className="block font-bold uppercase text-sm mb-2">Access Level</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAccessLevel('VIEW')}
                    className={cn(
                      'p-4 border-3 border-secondary text-left transition-all',
                      accessLevel === 'VIEW' ? 'bg-primary shadow-brutal-sm' : 'bg-white hover:bg-gray-100'
                    )}
                  >
                    <Eye className="w-6 h-6 mb-2" />
                    <div className="font-bold uppercase">View Only</div>
                    <div className="font-mono text-xs text-gray-600">Can view your data</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessLevel('EDIT')}
                    className={cn(
                      'p-4 border-3 border-secondary text-left transition-all',
                      accessLevel === 'EDIT' ? 'bg-primary shadow-brutal-sm' : 'bg-white hover:bg-gray-100'
                    )}
                  >
                    <Edit3 className="w-6 h-6 mb-2" />
                    <div className="font-bold uppercase">Can Edit</div>
                    <div className="font-mono text-xs text-gray-600">Can modify your data</div>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-2 border-secondary">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-accent-orange flex-shrink-0 mt-0.5" />
                  <p className="font-mono text-sm text-gray-600">
                    The invited user will receive an email notification. They must accept the invite to gain access.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="flex-1 btn-brutal-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="flex-1 btn-brutal-dark">
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
