import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { installGlobalErrorReporting } from './lib/errorReporting'
import { API_URL } from './lib/api'

installGlobalErrorReporting()

// Wake the server up straight away: the free server sleeps when idle, and this gives it a head start
// while the page loads and the student logs in.
void fetch(`${API_URL}/api/ping`).catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
