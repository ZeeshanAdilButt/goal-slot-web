import { getAllGuides } from '@/lib/guides'
import { GuideCard } from '@/components/guides/guide-card'
import { GuideSearch } from '@/components/guides/guide-search'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function GuidesPage(props: Props) {
  const searchParams = await props.searchParams
  const allGuides = getAllGuides()

  const category =
    typeof searchParams?.category === 'string' ? searchParams.category : null
  const search =
    typeof searchParams?.search === 'string' ? searchParams.search : null

  const filteredGuides = allGuides.filter((guide) => {
    const matchesCategory = category ? guide.category === category : true
    const matchesSearch = search
      ? guide.title.toLowerCase().includes(search.toLowerCase()) ||
        guide.description.toLowerCase().includes(search.toLowerCase())
      : true
    return matchesCategory && matchesSearch
  })

  // Grouping for default view
  const ebooks = allGuides.filter(g => g.category === 'E-books')
  const courses = allGuides.filter(g => g.category === 'Guides')

  if (!category && !search) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
            Guides & Resources
          </h1>
          <p className="mt-2 text-gray-600">
            Learn productivity strategies and goal-setting frameworks.
          </p>
        </div>

        <div className="mb-8">
          <GuideSearch />
        </div>

        {/* E-Books Section */}
        {ebooks.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 font-display text-xl font-bold">E-Books</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ebooks.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          </div>
        )}

        {/* Guides/Courses Section */}
        {courses.length > 0 && (
          <div>
            <h2 className="mb-4 font-display text-xl font-bold">Courses & Guides</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
          Search Results
        </h1>
      </div>

      <div className="mb-8">
        <GuideSearch />
      </div>

      {filteredGuides.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGuides.map((guide) => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-gray-500">No guides found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
