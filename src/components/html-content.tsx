interface HtmlContentProps {
  html: string
  truncate?: number // Number of lines to truncate to (undefined = no truncation)
  className?: string
  as?: 'div' | 'p' | 'span' // HTML element type, defaults to 'div'
}

export function HtmlContent({ html, truncate, className = '', as: Component = 'div' }: HtmlContentProps) {
  const truncateStyles = truncate
    ? {
        display: '-webkit-box',
        WebkitLineClamp: truncate,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      }
    : {}

  return <Component className={className} style={truncateStyles} dangerouslySetInnerHTML={{ __html: html }} />
}
