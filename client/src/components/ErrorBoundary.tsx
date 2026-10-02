import { Component, type ReactNode } from 'react'
import { reportError } from '../lib/errorReporting'

// If any page crashes while drawing, show a calm screen (instead of a blank page) and report the error.
// Error boundaries are one of the few things React still writes as a class.
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    reportError(error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-card border border-line rounded-3xl p-8 max-w-md w-full text-center">
          <h1 className="font-display font-semibold text-4xl">Something went wrong</h1>
          <p className="text-sm text-muted mt-3">
            Sorry about that. We've been told about the problem automatically. Your interviews and reports are safe.
          </p>
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => window.location.reload()}
              className="min-h-11 px-5 rounded-xl bg-accent text-on-accent font-semibold hover:bg-accent-hover">Reload the page</button>
            <a href="/home" className="inline-flex items-center min-h-11 px-5 rounded-xl border border-line-strong text-ink font-medium hover:bg-raised">Go home</a>
          </div>
        </div>
      </main>
    )
  }
}
