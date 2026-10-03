import { Router } from 'express'
import { requireAuth } from '../auth/requireAuth.js'
import { BankError, getPracticeQuestions } from '../companyQuestions.js'

// Company practice question banks: /api/companies/:id/questions?role=sde
export const companiesRouter = Router()
companiesRouter.use(requireAuth)

companiesRouter.get('/:id/questions', async (req, res, next) => {
  try {
    res.json(await getPracticeQuestions(String(req.params.id), String(req.query.role ?? '')))
  } catch (err) {
    if (err instanceof BankError) return res.status(err.status).json({ error: err.message })
    next(err)
  }
})
