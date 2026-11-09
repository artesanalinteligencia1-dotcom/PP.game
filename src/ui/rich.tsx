import type { ReactNode } from 'react'

/** Renders the **bold** runs of a translated string. Translators move the markers with the words they belong to. */
export function rich(text: string, className?: string): ReactNode {
  return text.split(/\*\*(.+?)\*\*/).map((part, i) =>
    i % 2 === 1 ? (
      className ? <span key={i} className={className}>{part}</span> : <b key={i}>{part}</b>
    ) : (
      part
    ),
  )
}
