import { useEffect } from 'react'

const DEFAULT_TITLE = 'ReadyForRound · Free AI mock interviews for campus placements'

// Sets the browser tab title (also what Google shows as the blue link in search results).
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ReadyForRound` : DEFAULT_TITLE
    return () => { document.title = DEFAULT_TITLE }
  }, [title])
}
