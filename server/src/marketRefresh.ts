// Manual refresh of the Job Market data: npm run market:refresh
import { refreshMarket } from './market.js'
await refreshMarket()
console.log('Job market data refreshed')
process.exit(0)
