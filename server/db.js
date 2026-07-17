import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, 'data.sqlite'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS test_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    preconditions TEXT,
    steps_json TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('Critical', 'Major', 'Minor', 'Trivial')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'ready', 'passed', 'failed', 'skipped')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS suites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    feature TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'ready', 'in-progress', 'passed', 'failed')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS suite_test_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suite_id INTEGER NOT NULL REFERENCES suites(id) ON DELETE CASCADE,
    test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    UNIQUE (suite_id, test_case_id)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS bugs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    steps_json TEXT NOT NULL,
    expected TEXT NOT NULL,
    actual TEXT NOT NULL,
    environment TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('Critical', 'Major', 'Minor', 'Trivial')),
    priority TEXT NOT NULL CHECK (priority IN ('Urgent', 'High', 'Medium', 'Low')),
    status TEXT NOT NULL CHECK (status IN ('open', 'in-progress', 'resolved', 'closed', 'reopened')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS bug_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bug_id INTEGER NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('status_change', 'comment')),
    old_value TEXT,
    new_value TEXT,
    message TEXT,
    created_at TEXT NOT NULL
  )
`)

const seedCount = db.prepare('SELECT COUNT(*) AS count FROM test_cases').get().count

if (seedCount === 0) {
  const now = new Date().toISOString()
  const insert = db.prepare(`
    INSERT INTO test_cases (title, preconditions, steps_json, expected_result, severity, status, created_at, updated_at)
    VALUES (@title, @preconditions, @steps_json, @expected_result, @severity, @status, @created_at, @updated_at)
  `)

  const seedData = [
    {
      title: 'Login with valid credentials',
      preconditions: 'The user has an existing account with a known valid email and password, and is not currently logged in.',
      steps: ['Go to the login page.', 'Enter a valid email and password.', 'Click the login button.'],
      expected_result: "The user is logged in and redirected to the app's main/authenticated view.",
      severity: 'Critical',
      status: 'ready',
    },
    {
      title: 'Login with incorrect password',
      preconditions: 'The user has an existing account and is not currently logged in.',
      steps: ['Go to the login page.', 'Enter a valid email and an incorrect password.', 'Click the login button.'],
      expected_result: 'The login is rejected and an "invalid credentials" error is shown. The user is not logged in.',
      severity: 'Major',
      status: 'passed',
    },
    {
      title: 'Search test cases by title',
      preconditions: 'At least one test case exists whose title contains a known keyword.',
      steps: ['Go to the /test-cases page.', 'Type the keyword into the search field.'],
      expected_result: 'Only test cases whose title contains the keyword are shown in the table.',
      severity: 'Minor',
      status: 'draft',
    },
    {
      title: 'Filter test cases by status',
      preconditions: 'Test cases exist with at least two different status values.',
      steps: ['Go to the /test-cases page.', 'Select a status from the status filter.'],
      expected_result: 'Only test cases matching the selected status are shown in the table.',
      severity: 'Minor',
      status: 'ready',
    },
    {
      title: 'Delete a test case',
      preconditions: 'At least one test case exists.',
      steps: ['Go to the /test-cases page.', 'Open the row menu for a test case.', 'Click delete.', 'Confirm the deletion.'],
      expected_result: 'The test case is removed and no longer appears in the table.',
      severity: 'Major',
      status: 'failed',
    },
  ]

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run({
        title: row.title,
        preconditions: row.preconditions || null,
        steps_json: JSON.stringify(row.steps),
        expected_result: row.expected_result,
        severity: row.severity,
        status: row.status,
        created_at: now,
        updated_at: now,
      })
    }
  })

  insertMany(seedData)
}

const suiteSeedCount = db.prepare('SELECT COUNT(*) AS count FROM suites').get().count

if (suiteSeedCount === 0) {
  const now = new Date().toISOString()
  const insertSuite = db.prepare(`
    INSERT INTO suites (name, feature, status, created_at, updated_at)
    VALUES (@name, @feature, @status, @created_at, @updated_at)
  `)
  const insertSuiteCase = db.prepare(`
    INSERT INTO suite_test_cases (suite_id, test_case_id, sort_order)
    VALUES (@suite_id, @test_case_id, @sort_order)
  `)
  const findCaseByTitle = db.prepare('SELECT id FROM test_cases WHERE title = ?')

  function findAnyUnusedCase(usedIds) {
    const placeholders = usedIds.length ? usedIds.map(() => '?').join(',') : 'NULL'
    return db.prepare(`SELECT id FROM test_cases WHERE id NOT IN (${placeholders}) LIMIT 1`).get(...usedIds)
  }

  const suiteSeedData = [
    {
      name: 'Login Smoke Suite',
      feature: 'login',
      status: 'ready',
      caseTitles: ['Login with valid credentials', 'Login with incorrect password', 'Search test cases by title'],
    },
    {
      name: 'Test Case Management Suite',
      feature: 'test-case-management',
      status: 'draft',
      caseTitles: ['Filter test cases by status', 'Login with valid credentials', 'Search test cases by title'],
    },
  ]

  const insertSuites = db.transaction((suites) => {
    for (const suite of suites) {
      const info = insertSuite.run({
        name: suite.name,
        feature: suite.feature,
        status: suite.status,
        created_at: now,
        updated_at: now,
      })
      const suiteId = info.lastInsertRowid
      const usedIds = []
      let order = 1

      for (const title of suite.caseTitles) {
        const row = findCaseByTitle.get(title) || findAnyUnusedCase(usedIds)
        if (!row) continue
        usedIds.push(row.id)
        insertSuiteCase.run({ suite_id: suiteId, test_case_id: row.id, sort_order: order })
        order++
      }
    }
  })

  insertSuites(suiteSeedData)
}

const bugSeedCount = db.prepare('SELECT COUNT(*) AS count FROM bugs').get().count

if (bugSeedCount === 0) {
  const now = Date.now()
  const minutesAgo = (n) => new Date(now - n * 60000).toISOString()

  const insertBug = db.prepare(`
    INSERT INTO bugs (title, description, steps_json, expected, actual, environment, severity, priority, status, created_at, updated_at)
    VALUES (@title, @description, @steps_json, @expected, @actual, @environment, @severity, @priority, @status, @created_at, @updated_at)
  `)
  const insertActivity = db.prepare(`
    INSERT INTO bug_activity (bug_id, action, old_value, new_value, message, created_at)
    VALUES (@bug_id, @action, @old_value, @new_value, @message, @created_at)
  `)

  const bugSeedData = [
    {
      title: 'Login fails with 503 under load',
      description: 'Login requests intermittently return a 503 error when multiple users attempt to log in around the same time.',
      steps: ['Have multiple users attempt to log in simultaneously.', 'Observe the response for some requests.'],
      expected: 'All valid login attempts succeed.',
      actual: 'Some login attempts fail with a 503 Service Unavailable error.',
      environment: 'Chrome 120 on macOS 14, staging environment',
      severity: 'Critical',
      priority: 'Urgent',
      status: 'open',
      createdMinutesAgo: 180,
      activity: [],
    },
    {
      title: 'Deleting a test case shows no loading state',
      description: 'When deleting a test case from the /test-cases page, there is no visual feedback while the delete request is in flight.',
      steps: ['Go to the /test-cases page.', 'Open the row menu for any test case.', 'Click Delete and confirm.'],
      expected: 'A loading indicator shows while the deletion is processing.',
      actual: 'No loading indicator appears; the row simply disappears once the request completes.',
      environment: 'Firefox 121 on Windows 11',
      severity: 'Minor',
      priority: 'Low',
      status: 'in-progress',
      createdMinutesAgo: 1440,
      activity: [
        { minutesAgo: 60, action: 'status_change', old_value: 'open', new_value: 'in-progress', message: 'Picked up for the next sprint.' },
      ],
    },
    {
      title: 'Suite case count is stale after removing a case',
      description: 'The "# Cases" count on the /test-suites list can briefly show the wrong number after removing a case from a suite.',
      steps: ['Open a suite with 2+ cases.', 'Remove one case and confirm.', 'Go back to /test-suites without reloading.'],
      expected: 'The case count reflects the removal immediately.',
      actual: 'The case count is correct after a manual page reload, but was stale before this fix.',
      environment: 'Chrome 120 on macOS 14',
      severity: 'Major',
      priority: 'Medium',
      status: 'resolved',
      createdMinutesAgo: 2880,
      activity: [
        { minutesAgo: 2000, action: 'status_change', old_value: 'open', new_value: 'in-progress', message: 'Reproduced, looking into it.' },
        { minutesAgo: 500, action: 'status_change', old_value: 'in-progress', new_value: 'resolved', message: 'Fixed by refetching suite data after removal.' },
      ],
    },
  ]

  const insertBugs = db.transaction((bugs) => {
    for (const bug of bugs) {
      const createdAt = minutesAgo(bug.createdMinutesAgo)
      const info = insertBug.run({
        title: bug.title,
        description: bug.description,
        steps_json: JSON.stringify(bug.steps),
        expected: bug.expected,
        actual: bug.actual,
        environment: bug.environment || null,
        severity: bug.severity,
        priority: bug.priority,
        status: bug.status,
        created_at: createdAt,
        updated_at: bug.activity.length ? minutesAgo(bug.activity[bug.activity.length - 1].minutesAgo) : createdAt,
      })
      const bugId = info.lastInsertRowid

      for (const entry of bug.activity) {
        insertActivity.run({
          bug_id: bugId,
          action: entry.action,
          old_value: entry.old_value,
          new_value: entry.new_value,
          message: entry.message || null,
          created_at: minutesAgo(entry.minutesAgo),
        })
      }
    }
  })

  insertBugs(bugSeedData)
}

export default db
