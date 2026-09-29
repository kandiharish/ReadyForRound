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
}

type Provider = 'ollama' | 'groq' | 'openrouter'

function providerSettings(provider: Provider) {
  switch (provider) {
    case 'ollama':
      return { baseUrl: config.OLLAMA_BASE_URL, apiKey: 'ollama', model: config.OLLAMA_MODEL }
    case 'groq':
      if (!config.GROQ_API_KEY) throw new Error('GROQ_API_KEY is missing in .env')
      return { baseUrl: 'https://api.groq.com/openai/v1', apiKey: config.GROQ_API_KEY, model: config.GROQ_MODEL }
    case 'openrouter':
      if (!config.OPENROUTER_API_KEY || !config.OPENROUTER_MODEL) {
        throw new Error('OPENROUTER_API_KEY or OPENROUTER_MODEL is missing in .env')
      }
      return { baseUrl: 'https://openrouter.ai/api/v1', apiKey: config.OPENROUTER_API_KEY, model: config.OPENROUTER_MODEL }
  }
}

async function callProvider(provider: Provider, messages: ChatMessage[], options: ChatOptions) {
  const { baseUrl, apiKey, model } = providerSettings(provider)

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
      max_tokens: options.maxTokens ?? 500,
    }),
  })

  if (!res.ok) {
    throw new Error(`${provider} returned ${res.status}: ${await res.text()}`)
  }

  const data = await res.json()
  return {
    provider,
    model,
    text: data.choices[0].message.content as string,
    usage: data.usage, // how many tokens the question and reply used
  }
}

// Ask the main provider; if it fails and a fallback is set, ask the fallback.
export async function chat(messages: ChatMessage[], options: ChatOptions = {}) {
  try {
    return await callProvider(config.LLM_PROVIDER, messages, options)
  } catch (err) {
    if (config.LLM_FALLBACK_PROVIDER === 'none') throw err
    console.warn(`Main AI provider failed, using fallback: ${(err as Error).message}`)
    return await callProvider(config.LLM_FALLBACK_PROVIDER, messages, options)
  }
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
