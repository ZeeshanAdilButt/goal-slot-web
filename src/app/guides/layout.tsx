import { getAllCategories, getGuidesByCategory } from '@/lib/guides'
import { GuidesSidebar } from '@/components/guides/guides-sidebar'
import { GuidesNavigation } from '@/components/guides/guides-navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guides & Resources - GoalSlot',
  description: 'Learn about time management, prioritization, and goal setting with our expert guides.',
}

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const categoriesList = getAllCategories()
  const categories = categoriesList.map(cat => ({
    name: cat,
    count: getGuidesByCategory(cat).length
  }))

  return (
    <div className="min-h-screen bg-white">
      <GuidesNavigation />
      <div className="container flex-1 items-start pt-20 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <GuidesSidebar categories={categories} />
        <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
          <div className="mx-auto w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
