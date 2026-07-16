import { TemplateDetailPage } from '@/features/library'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <TemplateDetailPage templateId={id} />
}
