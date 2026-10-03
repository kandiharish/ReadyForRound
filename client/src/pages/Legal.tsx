import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Brand } from '../components/Brand'
import { usePageTitle } from '../lib/pageTitle'

// Who students can contact about their data. Set VITE_CONTACT_EMAIL in client/.env.
const CONTACT = import.meta.env.VITE_CONTACT_EMAIL as string | undefined
const contactLine = CONTACT
  ? <>email <a href={`mailto:${CONTACT}`} className="text-accent-deep underline">{CONTACT}</a></>
  : <>use the contact details on our website</>

const UPDATED = '2 October 2026'

function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-12 sm:py-16">
      <article className="max-w-2xl mx-auto bg-card border border-line rounded-3xl p-6 sm:p-10">
        <Link to="/" aria-label="ReadyForRound home"><Brand size="sm" /></Link>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl mt-4">{title}</h1>
        <p className="text-sm text-muted mt-2">Last updated {UPDATED}</p>
        <div className="mt-8 space-y-6 text-soft leading-relaxed [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-2xl [&_h2]:text-ink [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
          {children}
        </div>
        <p className="text-sm text-muted mt-10 border-t border-line pt-6">
          See also: <Link to="/privacy" className="text-accent-deep">Privacy policy</Link> · <Link to="/terms" className="text-accent-deep">Terms of use</Link>
        </p>
      </article>
    </main>
  )
}

export function PrivacyPage() {
  usePageTitle('Privacy policy')
  return (
    <LegalLayout title="Privacy policy">
      <p>ReadyForRound helps you practise job interviews. This page explains, in plain words, what we collect, why, and the choices you have.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Your account:</b> your name and email address (and, if you sign in with Google, your Google name and email).</li>
        <li><b>Your profile and goals:</b> experience level, skills and how you rate them, the roles and companies you're preparing for, and target dates.</li>
        <li><b>Your interviews:</b> the questions you were asked and your answers as text, plus the feedback reports and study plans made from them.</li>
        <li><b>Usage:</b> how many interviews and drills you do each day (to apply fair-use limits), and technical error reports that help us fix problems.</li>
        <li><b>Feedback you send:</b> your message, the page you were on, and your email only if you choose to give it, so we can reply.</li>
      </ul>

      <h2>What we do not keep</h2>
      <ul>
        <li><b>Your video never leaves your device.</b> The camera is only shown to you. It is never recorded, uploaded or used for scoring.</li>
        <li><b>Voice recordings are not stored.</b> When you answer by voice, the recording is sent to a speech-to-text service, turned into text, and then discarded. Only the text is saved.</li>
        <li>We never judge your accent, appearance or emotions.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To run your interviews, write your feedback reports, build your study roadmap and show your progress.</li>
        <li>To keep the service working fairly for everyone (daily limits, security, fixing errors).</li>
      </ul>
      <p>We don't sell your data, show you ads, or share your private practice with employers or colleges.</p>

      <h2>Services that process your data for us</h2>
      <ul>
        <li><b>Supabase:</b> secure storage of your account and data, and sign-in.</li>
        <li><b>Groq:</b> the AI that asks questions, turns your voice into text, and grades your answers. Your answers are sent to it for this purpose only.</li>
        <li><b>Google:</b> only if you choose "Continue with Google" to sign in.</li>
        <li><b>Resend:</b> delivers the messages you send with the Feedback button to our inbox.</li>
      </ul>

      <h2>AI feedback is an estimate</h2>
      <p>Scores and feedback are written by AI against a fixed scoring guide. They can be wrong, and they are not a hiring decision or a prediction of whether you'll get a job.</p>

      <h2>How long we keep it</h2>
      <p>We keep your data while your account exists, so you can see your progress over time. When you delete your account, your profile, goals, interviews, reports and roadmap are deleted straight away.</p>

      <h2>Your choices</h2>
      <ul>
        <li><b>Download your data</b> at any time from Settings → Your data.</li>
        <li><b>Delete your account</b> and everything linked to it from Settings → Your data.</li>
        <li>Hide scores with "Practise without scores" in Settings.</li>
      </ul>

      <h2>Contact</h2>
      <p>Questions about your data? Please {contactLine}.</p>
    </LegalLayout>
  )
}

export function TermsPage() {
  usePageTitle('Terms of use')
  return (
    <LegalLayout title="Terms of use">
      <p>By using ReadyForRound you agree to these simple terms.</p>

      <h2>What the service is</h2>
      <p>ReadyForRound is a practice tool. It gives AI-generated mock interviews, feedback and study plans to help you prepare. It does not guarantee a job, a placement, or any interview result.</p>

      <h2>Fair use</h2>
      <ul>
        <li>Daily limits apply so the free service stays available to everyone.</li>
        <li>Don't try to break, overload or misuse the service, or use someone else's account.</li>
        <li>Answer in your own words. Don't submit content that is illegal, hateful, or someone else's private information.</li>
      </ul>

      <h2>AI feedback</h2>
      <p>Feedback and scores are produced by AI and may contain mistakes. Use them as guidance, and check important facts with trusted sources.</p>

      <h2>Your account</h2>
      <p>You're responsible for keeping your login safe. You can delete your account at any time from Settings. We may suspend accounts that misuse the service.</p>

      <h2>Changes</h2>
      <p>We may update these terms as the service grows. We'll show the new date at the top of this page.</p>

      <h2>Contact</h2>
      <p>Questions? Please {contactLine}.</p>
    </LegalLayout>
  )
}
