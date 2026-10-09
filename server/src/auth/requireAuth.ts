import type { NextFunction, Request, Response } from 'express'
import type { User } from '@supabase/supabase-js'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { config } from '../config.js'
import { supabase } from '../db/supabase.js'

// Lets route handlers read req.user after this check has run.
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

// Supabase's public signing keys. jose fetches them once, caches them, and refreshes only when a new key appears.
const JWKS = config.SUPABASE_URL ? createRemoteJWKSet(new URL(`${config.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)) : null

// "Bouncer" for protected routes: the request must carry a valid Supabase login token.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!supabase || !JWKS) return res.status(503).json({ error: 'Database is not configured' })

  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not logged in' })

  // Check the token's signature and expiry here on the server, with no round trip to Supabase,
  // so many requests at once (like the home page loading) are all checked in parallel.
  try {
    const { payload } = await jwtVerify(token, JWKS, { audience: 'authenticated' })
    if (!payload.sub || payload.role !== 'authenticated') throw new Error('bad claims')
    req.user = { id: payload.sub, email: payload.email } as User
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' })
  }
  next()
}
