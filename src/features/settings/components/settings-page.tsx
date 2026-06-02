'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { CategoryManagement } from '@/features/categories/components/category-management'
import { Brain, CreditCard, Download, KeyRound, LogOut, Palette, Shield, Tag, User } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/page-header'
import { PageShell } from '@/components/ui/page-shell'

import { SettingsAppearanceTab } from './settings-appearance-tab'
import { SettingsBillingTab } from './settings-billing-tab'
import { SettingsCoachProfileTab } from './settings-coach-profile-tab'
import { SettingsDataTab } from './settings-data-tab'
import { SettingsIntegrationsTab } from './settings-integrations-tab'
import { SettingsProfileTab } from './settings-profile-tab'
import { SettingsSecurityTab } from './settings-security-tab'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  // Appearance tab intentionally hidden per user request — dark mode
  // wiring is disabled. The AppearanceSettings component and theme
  // store stay in place so we can revive later without refactor.
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data & Privacy', icon: Download },
  { id: 'integrations', label: 'Integrations', icon: KeyRound },
  { id: 'coach-profile', label: 'Coach Profile', icon: Brain },
]

export function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { logout } = useAuthStore()

  const tabFromUrl = searchParams.get('tab')
  const activeTab = tabFromUrl && TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'profile'

  const handleTabChange = (tabId: string) => {
    router.replace(`/dashboard/settings?tab=${tabId}`, { scroll: false })
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    window.location.href = '/'
  }

  return (
    <PageShell>
      <PageHeader eyebrow="Account" title="Settings" description="Manage your account" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-3 text-left text-sm font-semibold transition-colors last:border-b-0',
                  activeTab === tab.id
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 border-t border-zinc-200 px-4 py-3 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-x-auto lg:col-span-3">
          {activeTab === 'profile' && <SettingsProfileTab />}
          {activeTab === 'appearance' && <SettingsAppearanceTab />}
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'billing' && <SettingsBillingTab />}
          {activeTab === 'security' && <SettingsSecurityTab />}
          {activeTab === 'data' && <SettingsDataTab />}
          {activeTab === 'integrations' && <SettingsIntegrationsTab />}
          {activeTab === 'coach-profile' && <SettingsCoachProfileTab />}
        </div>
      </div>
    </PageShell>
  )
}
