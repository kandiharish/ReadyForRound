import 'dotenv/config'
import { z } from 'zod'

// Every setting the server needs, read from the .env file.
// zod checks them at startup so a typo fails loudly instead of breaking later.
const schema = z.object({
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:5180'),

  // Daily limits per student (protect the free AI quota). A "pro" plan gets the PRO_ numbers.
  DAILY_INTERVIEWS_FREE: z.coerce.number().default(5),
  DAILY_INTERVIEWS_PRO: z.coerce.number().default(30),
  DAILY_DRILLS_FREE: z.coerce.number().default(10),
  DAILY_DRILLS_PRO: z.coerce.number().default(50),
  // "Today" starts at midnight in this time zone (minutes from UTC). 330 = India (UTC+5:30).
  TIMEZONE_OFFSET_MINUTES: z.coerce.number().default(330),

  // Supabase project address and its SECRET key (full access - server only).
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),

  // Which AI provider to use: "ollama" (your laptop) or "groq" (online).
  LLM_PROVIDER: z.enum(['ollama', 'groq', 'openrouter']).default('ollama'),
  // Optional backup provider used if the main one fails (e.g. rate limit).
  LLM_FALLBACK_PROVIDER: z.enum(['ollama', 'groq', 'openrouter', 'none']).default('none'),
  // Which AI grades answers and writes reports. Accuracy matters more here, so it can differ from LLM_PROVIDER.
  REPORT_LLM_PROVIDER: z.enum(['ollama', 'groq', 'openrouter']).optional(),

  OLLAMA_BASE_URL: z.string().default('http://localhost:11434/v1'),
  OLLAMA_MODEL: z.string().default('llama3.2:3b'),

  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'), // asks the interview questions (when LLM_PROVIDER=groq); most reliable in tests
  GROQ_REPORT_MODEL: z.string().default('openai/gpt-oss-120b'), // grades answers and writes the report
  // Speech-to-text model on Groq (Whisper). Used for spoken answers even when the chat AI is Ollama.
  GROQ_STT_MODEL: z.string().default('whisper-large-v3-turbo'),

  // Feedback button: messages are emailed here using Resend (free account at https://resend.com).
  // Job Market data (free key at https://developer.adzuna.com)
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  FEEDBACK_TO_EMAIL: z.string().optional(),

  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
})

export const config = schema.parse(process.env)
