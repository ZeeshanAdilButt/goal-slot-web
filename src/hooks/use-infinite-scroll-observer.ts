import { useEffect, useRef } from 'react'

export interface UseInfiniteScrollObserverOptions {
  callback: () => void
  enabled?: boolean
  root?: Element | Document | null
  rootMargin?: string
  threshold?: number | number[]
}

export const useInfiniteScrollObserver = <T extends Element>({
  callback,
  enabled = true,
  root = null,
  rootMargin = '0px',
  threshold = 0.1,
}: UseInfiniteScrollObserverOptions) => {
  const targetRef = useRef<T | null>(null)

  useEffect(() => {
    const element = targetRef.current
    if (!enabled || !element || typeof IntersectionObserver === 'undefined') {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          callback()
        }
      },
      {
        root,
        rootMargin,
        threshold,
      },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [callback, enabled, root, rootMargin, threshold])

  return targetRef
}

export default useInfiniteScrollObserver
