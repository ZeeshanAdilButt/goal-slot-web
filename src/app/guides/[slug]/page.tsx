import { notFound } from 'next/navigation'
import { getAllGuides, getGuideBySlug } from '@/lib/guides'
import { MarkdownRenderer } from '@/components/guides/markdown-renderer'
import { ChevronLeft, Calendar, Tag } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const guides = getAllGuides()
  return guides.map((guide) => ({
    slug: guide.slug,
  }))
}

export async function generateMetadata(props: Props) {
  const params = await props.params
  const guide = getGuideBySlug(params.slug)

  if (!guide) {
    return {
      title: 'Guide Not Found',
    }
  }

  return {
    title: `${guide.title} - GoalSlot Guides`,
    description: guide.description,
  }
}

export default async function GuidePage(props: Props) {
  const params = await props.params
  const guide = getGuideBySlug(params.slug)

  if (!guide) {
    notFound()
  }

  return (
    <div className="container relative max-w-3xl py-6 lg:py-10">
      <Link
        href="/guides"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to all guides
      </Link>

      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-2">
           <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium uppercase text-primary">
              {guide.category}
           </span>
           <div className="flex items-center gap-1 text-sm text-muted-foreground">
             <Calendar className="h-3 w-3" />
             <time dateTime={guide.date}>
               {format(new Date(guide.date), 'MMMM d, yyyy')}
             </time>
           </div>
        </div>

        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          {guide.title}
        </h1>
        
        {guide.tags && guide.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
             {guide.tags.map(tag => (
                <div key={tag} className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs">
                   <Tag className="h-3 w-3" />
                   {tag}
                </div>
             ))}
          </div>
        )}
      </div>
      
      <MarkdownRenderer source={guide.content} />

      <hr className="my-10" />
      
      <div className="flex justify-center">
        <Link 
            href="/signup" 
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
            Start Your Journey with GoalSlot
        </Link>
      </div>
    </div>
  )
}
