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
      <div className="space-y-12 px-4 md:px-0">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Guides & Resources
          </h1>
          <p className="max-w-[800px] text-xl text-gray-600">
            Master the art of productivity with our comprehensive list of resources.
          </p>
          <div className="pt-4">
             <GuideSearch />
          </div>
        </div>

        {/* E-Books Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2 border-gray-200">E-Books</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {ebooks.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} />
             ))}
          </div>
        </div>

        {/* Guides/Courses Section */}
        <div className="space-y-6">
            <h2 className="text-2xl font-bold border-b pb-2 border-gray-200">Courses & Guides</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((guide) => (
                  <GuideCard key={guide.slug} guide={guide} />
                ))}
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 px-4 md:px-0">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Search Results
        </h1>
         <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <GuideSearch />
        </div>
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
