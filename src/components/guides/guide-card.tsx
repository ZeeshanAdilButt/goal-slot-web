import Link from 'next/link'
import { Guide } from '@/lib/guides'
import { ArrowRight, Calendar, Tag } from 'lucide-react'
import { format } from 'date-fns'

type Props = {
  guide: Guide
}

export function GuideCard({ guide }: Props) {
  return (
    <Link href={`/guides/${guide.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <span className="rounded bg-primary/10 px-2 py-1">
              {guide.category}
            </span>
          </div>
          
          <h3 className="mb-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-primary">
            {guide.title}
          </h3>
          
          <p className="mb-4 line-clamp-3 flex-1 text-gray-600">
            {guide.description}
          </p>
          
          <div className="mt-auto flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <time dateTime={guide.date}>
                {format(new Date(guide.date), 'MMM d, yyyy')}
              </time>
            </div>
            
            <span className="flex items-center bg-transparent text-sm font-medium text-primary transition-transform group-hover:translate-x-1">
              Read Guide <ArrowRight className="ml-1 h-4 w-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
