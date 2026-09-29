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

  // Ask Supabase: is this token real and still valid? Which user does it belong to?
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return res.status(401).json({ error: 'Session expired, please log in again' })

  req.user = data.user
  next()
}
