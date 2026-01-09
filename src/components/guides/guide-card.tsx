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
      <article className="flex flex-col h-full bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50">
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
            <span className="bg-primary/10 px-2 py-1 rounded">
              {guide.category}
            </span>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
            {guide.title}
          </h3>
          
          <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
            {guide.description}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t mt-auto">
            <div className="flex items-center text-sm text-gray-500 gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime={guide.date}>
                {format(new Date(guide.date), 'MMM d, yyyy')}
              </time>
            </div>
            
            <span className="flex items-center text-sm font-medium text-primary bg-transparent group-hover:translate-x-1 transition-transform">
              Read Guide <ArrowRight className="ml-1 h-4 w-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
