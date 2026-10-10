import { config } from '../config.js'

// Ollama, Groq and OpenRouter all accept the same request format
// (the "OpenAI-compatible" chat format), so one function can talk to all three.
// Only the address, the API key and the model name change.

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ChatOptions = {
  temperature?: number // 0 = predictable, 1 = creative
  maxTokens?: number // upper limit on the length of the reply
  json?: boolean // ask the model to reply with a JSON object only
  task?: 'interview' | 'report' // which job this is for; the report can use a stronger AI (see REPORT_LLM_PROVIDER)
  retries?: number // set internally when a busy AI service asked us to wait and try again
}

type Provider = 'ollama' | 'groq' | 'openrouter'

// Thrown when we can't reach the AI service at all (e.g. Ollama isn't running, or no internet).
export class LlmUnavailableError extends Error {}

function providerSettings(provider: Provider, task: ChatOptions['task'] = 'interview') {
  switch (provider) {
    case 'ollama':
      return { baseUrl: config.OLLAMA_BASE_URL, apiKey: 'ollama', model: config.OLLAMA_MODEL }
    case 'groq':
      if (!config.GROQ_API_KEY) throw new Error('GROQ_API_KEY is missing in .env')
      return {
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: config.GROQ_API_KEY,
        model: task === 'report' ? config.GROQ_REPORT_MODEL : config.GROQ_MODEL,
      }
    case 'openrouter':
      if (!config.OPENROUTER_API_KEY || !config.OPENROUTER_MODEL) {
        throw new Error('OPENROUTER_API_KEY or OPENROUTER_MODEL is missing in .env')
      }
      return { baseUrl: 'https://openrouter.ai/api/v1', apiKey: config.OPENROUTER_API_KEY, model: config.OPENROUTER_MODEL }
  }
}

async function callProvider(provider: Provider, messages: ChatMessage[], options: ChatOptions) {
  const { baseUrl, apiKey, model } = providerSettings(provider, options.task)
  // "Reasoning" models (like gpt-oss) think before answering, and that thinking uses tokens too.
  const reasoning = /gpt-oss/.test(model)
  const maxTokens = options.maxTokens ?? 500

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: reasoning ? maxTokens + 1500 : maxTokens,
      ...(reasoning ? { reasoning_effort: 'low' } : {}),
      ...(options.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  }).catch((err) => {
    throw new LlmUnavailableError(`Cannot reach ${provider} at ${baseUrl}: ${(err as Error).message}`)
  })

  if (!res.ok) {
    const body = await res.text()
    // Free AI plans allow only so many words a minute. When the service says "try again in a few seconds",
    // wait that long and try again (twice at most), instead of failing a student's report.
    if (res.status === 429 && (options.retries ?? 0) < 2) {
      const wait = retryAfterSeconds(res.headers.get('retry-after'), body)
      if (wait !== null && wait <= 20) {
        await new Promise((r) => setTimeout(r, Math.ceil(wait * 1000) + 250))
        return callProvider(provider, messages, { ...options, retries: (options.retries ?? 0) + 1 })
      }
    }
    // Reasoning models (like gpt-oss) sometimes wrap a normal reply in a broken "tool call". Groq then refuses it,
    // but still sends back what the model wrote ("failed_generation"). Recover that text instead of failing.
    const recovered = recoverFailedGeneration(body)
    if (recovered) return { provider, model, text: recovered, usage: undefined }
    throw new Error(`${provider} returned ${res.status}: ${body}`)
  }

  const data = await res.json()
  return {
    provider,
    model,
    text: data.choices[0].message.content as string,
    usage: data.usage, // how many tokens the question and reply used
  }
}

// Seconds to wait before retrying, from the Retry-After header or the "Please try again in 1.5s" message.
export function retryAfterSeconds(header: string | null, body: string): number | null {
  const fromHeader = header !== null ? Number(header) : NaN
  if (Number.isFinite(fromHeader)) return fromHeader
  const m = body.match(/try again in (?:(\d+)m)?([\d.]+)s/i)
  return m ? Number(m[1] ?? 0) * 60 + Number(m[2]) : null
}

export function recoverFailedGeneration(body: string): string | null {
  try {
    const err = JSON.parse(body)?.error
    if (err?.code !== 'tool_use_failed' || typeof err.failed_generation !== 'string') return null
    const raw: string = err.failed_generation
    // The text usually sits after "arguments": ... ; fall back to the whole thing.
    const m = raw.match(/"arguments"\s*:\s*"?([\s\S]*?)"?\s*}\s*$/)
    const text = (m ? m[1] : raw).replace(/\\n/g, '\n').trim() // turn written "\n" back into real line breaks
    return text.length > 3 ? text : null
  } catch {
    return null
  }
}

// House style for everything the AI writes: plain punctuation that reads like a person wrote it.
// Only about dashes: wording that mentions full stops made the interviewer drop question marks.
const STYLE_RULE = 'Never use em dashes (—) or spaced en dashes in your reply; where you would use one, use a comma instead.'

// Safety net for the same rule: models don't always follow it. Swaps a dash used as a pause for a comma,
// and a dash starting a line for a hyphen bullet. En dashes inside ranges (₹5L–₹8L) are left alone.
export function plainPunctuation(text: string) {
  return text
    .replace(/(^|\n)[ \t]*[—–][ \t]*/g, '$1- ')
    .replace(/\s*—\s*([.,;:!?])/g, '$1') // "fine —." becomes "fine."
    .replace(/\s*—\s*/g, ', ')
    .replace(/ – /g, ', ')
}

function withStyle(messages: ChatMessage[]): ChatMessage[] {
  const i = messages.findIndex((m) => m.role === 'system')
  if (i === -1) return [{ role: 'system', content: STYLE_RULE }, ...messages]
  return messages.map((m, k) => (k === i ? { ...m, content: `${m.content}

${STYLE_RULE}` } : m))
}

// Ask the main provider; if it fails and a fallback is set, ask the fallback.
export async function chat(messages: ChatMessage[], options: ChatOptions = {}) {
  const main = options.task === 'report' ? config.REPORT_LLM_PROVIDER ?? config.LLM_PROVIDER : config.LLM_PROVIDER
  const styled = withStyle(messages)
  let result
  try {
    result = await callProvider(main, styled, options)
  } catch (err) {
    if (config.LLM_FALLBACK_PROVIDER === 'none' || config.LLM_FALLBACK_PROVIDER === main) throw err
    console.warn(`Main AI provider failed, using fallback: ${(err as Error).message}`)
    result = await callProvider(config.LLM_FALLBACK_PROVIDER, styled, options)
  }
  return { ...result, text: plainPunctuation(result.text ?? '') }
}

// Quick check used by /api/health: can we reach the main provider at all?
export async function isLlmReachable() {
  try {
    const { baseUrl, apiKey } = providerSettings(config.LLM_PROVIDER)
    const res = await fetch(`${baseUrl}/models`, { headers: { Authorization: `Bearer ${apiKey}` } })
    return res.ok
  } catch {
    return false
  }
}
