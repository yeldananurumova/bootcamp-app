import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  // still deliberately wrong shape — re-triggering the hook after the systemMessage fix
  res.json({ status: 'ok', result: 'test' })
})

export default router
