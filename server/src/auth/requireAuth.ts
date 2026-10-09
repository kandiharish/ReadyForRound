import type { NextFunction, Request, Response } from 'express'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../db/supabase.js'

// Lets route handlers read req.user after this check has run.
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

// "Bouncer" for protected routes: the request must carry a valid Supabase login token.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!supabase) return res.status(503).json({ error: 'Database is not configured' })

  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not logged in' })

  // Check the token's signature and expiry here on the server, using Supabase's public signing keys
  // (fetched once and cached). This avoids a round trip to Supabase on every request.
  const { data, error } = await supabase.auth.getClaims(token)
  const claims = data?.claims
  if (error || !claims?.sub || claims.role !== 'authenticated') return res.status(401).json({ error: 'Session expired, please log in again' })

  req.user = { id: claims.sub, email: claims.email } as User
  next()
}
