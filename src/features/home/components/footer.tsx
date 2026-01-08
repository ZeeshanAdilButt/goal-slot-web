import Link from 'next/link'

import { Target } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t-3 border-secondary px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-3 border-secondary bg-primary shadow-brutal-sm">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-bold uppercase">GoalSlot</span>
              <span className="block font-mono text-xs text-gray-500">Achieve Your Goals</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
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

          <p className="font-mono text-sm text-gray-600">© 2025 GoalSlot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
