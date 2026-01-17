import { getPostHogServer } from '@/app/posthog-server'

export const captureException = (error: any) => {
  const posthog = getPostHogServer()
  posthog.captureException(error, {
    $exception_message: error instanceof Error ? error.message : String(error),
    $exception_type: error?.constructor.name,
    additional_context: {
      code: (error as any).code,
      data: (error as any).data,
      name: (error as any).name,
    },
  })
}
