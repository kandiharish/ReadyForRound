import 'dotenv/config'
import { z } from 'zod'

// Every setting the server needs, read from the .env file.
// zod checks them at startup so a typo fails loudly instead of breaking later.
const schema = z.object({
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:5180'),

  // Supabase project address and its SECRET key (full access - server only).
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),

  // Which AI provider to use: "ollama" (your laptop) or "groq" (online).
  LLM_PROVIDER: z.enum(['ollama', 'groq', 'openrouter']).default('ollama'),
  // Optional backup provider used if the main one fails (e.g. rate limit).
  LLM_FALLBACK_PROVIDER: z.enum(['ollama', 'groq', 'openrouter', 'none']).default('none'),

  OLLAMA_BASE_URL: z.string().default('http://localhost:11434/v1'),
  OLLAMA_MODEL: z.string().default('llama3.2:3b'),

  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('llama-3.1-8b-instant'),

  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
})

export const config = schema.parse(process.env)
