// Checks every link in the learning-resources library still opens. Run before a release: npm run check-links
import { ALL_URLS } from '../../client/src/lib/resources.ts'

// These sites block automated checkers (HTTP 403) but open normally in a browser; last checked by hand 2026-10.
const BROWSER_VERIFIED = new Set(['https://www.electrical4u.com/', 'https://www.cloudflare.com/learning/'])

const bad: string[] = []
await Promise.all(ALL_URLS.map(async (url) => {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20_000), headers: { 'User-Agent': 'Mozilla/5.0 (link check; ReadyForRound)' } })
    const note = res.redirected ? ` -> ${res.url}` : ''
    if (res.ok) console.log('ok ', res.status, url + note)
    else if (BROWSER_VERIFIED.has(url)) console.log('ok*', res.status, url, '(blocks bots; checked in a browser)')
    else { console.log('BAD', res.status, url + note); bad.push(url) }
  } catch (err) {
    console.log('ERR', (err as Error).message.slice(0, 60), url); bad.push(url)
  }
}))
console.log(`\n${ALL_URLS.length - bad.length}/${ALL_URLS.length} links ok`)
process.exit(bad.length ? 1 : 0)
