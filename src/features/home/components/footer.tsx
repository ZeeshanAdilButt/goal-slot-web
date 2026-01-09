import Link from 'next/link'

import { GoalSlotBrand } from '@/components/goalslot-logo'

export function Footer() {
  return (
    <footer className="border-t-3 border-secondary px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <GoalSlotBrand size="sm" tagline="Your growth, measured." />

          <div className="flex items-center gap-6">
            <Link href="/guides" className="font-mono text-sm transition-colors hover:text-primary">
              Guides
            </Link>
            <Link href="/privacy" className="font-mono text-sm transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="/faq" className="font-mono text-sm transition-colors hover:text-primary">
              FAQ
            </Link>
            <a href="#" className="font-mono text-sm transition-colors hover:text-primary">
              Support
            </a>
          </div>

          <p className="font-mono text-sm text-gray-600">© 2026 GoalSlot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
