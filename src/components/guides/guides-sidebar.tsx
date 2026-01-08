'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BookOpen, ChevronRight, Hash, Home } from 'lucide-react'

type Category = {
  name: string
  count: number
}

type Props = {
  categories: Category[]
}

export function GuidesSidebar({ categories }: Props) {
  const pathname = usePathname()

  return (
    <nav className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r bg-gray-50/50 p-6 md:block">
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Resources
        </h2>
        <div className="space-y-1">
          <Link
            href="/guides"
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === '/guides' 
                ? "bg-primary/10 text-primary" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Home className="h-4 w-4" />
            All Guides
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </h2>
        <div className="space-y-1">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/guides?category=${encodeURIComponent(category.name)}`}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('category') === category.name
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{category.name}</span>
              </div>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                {category.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
