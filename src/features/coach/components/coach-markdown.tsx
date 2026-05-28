import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

const components: Components = {
  p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 marker:text-zinc-400 first:mt-0 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-zinc-400 first:mt-0 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed [&>p]:my-0">{children}</li>,
  h1: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold text-zinc-900 first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold text-zinc-900 first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="mb-1.5 mt-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 first:mt-0">{children}</h4>,
  code: ({ children }) => (
    <code className="rounded bg-zinc-100 px-1 py-[1px] font-mono text-[0.85em] text-zinc-800">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-md bg-zinc-900 p-3 font-mono text-[12px] leading-relaxed text-zinc-100">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-zinc-300 pl-3 italic text-zinc-600">{children}</blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#8a7307] underline decoration-[#f2cc0d] decoration-2 underline-offset-2 hover:text-[#6b5905]"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-zinc-200" />,
}

interface CoachMarkdownProps {
  content: string
  className?: string
}

export function CoachMarkdown({ content, className }: CoachMarkdownProps) {
  return (
    <div className={cn('text-[15px] leading-relaxed text-zinc-900', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
