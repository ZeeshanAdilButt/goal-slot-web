import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-12 text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/icons/goalslot-logo-boxed.svg" alt="GoalSlot" width={24} height={24} className="h-6 w-6" />
            <span className="font-display font-bold text-gray-900">GoalSlot</span>
          </div>
          <div className="text-gray-500">© {new Date().getFullYear()} GoalSlot Inc. Built for builders.</div>
          <div className="flex gap-6 text-gray-600">
            <Link href="#" className="transition hover:text-[#8a7307]">
              Twitter
            </Link>
            <Link href="#" className="transition hover:text-[#8a7307]">
              GitHub
            </Link>
            <Link href="/privacy" className="transition hover:text-[#8a7307]">
              Legal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
