import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import testCasesRouter from './routes/test-cases.js'
import suitesRouter from './routes/suites.js'
import bugsRouter from './routes/bugs.js'
import testRunsRouter from './routes/test-runs.js'
import dashboardRouter from './routes/dashboard.js'
import reportsRouter from './routes/reports.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()
const PORT = process.env.PORT || 5050

app.use(cors())
app.use(express.json())

// Simple liveness check used by the dev workflow and CI smoke tests.
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' }, error: null })
})

app.use('/api/test-cases', testCasesRouter)
app.use('/api/suites', suitesRouter)
app.use('/api/bugs', bugsRouter)
app.use('/api/test-runs', testRunsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/reports', reportsRouter)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ success: false, data: null, error: 'internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
