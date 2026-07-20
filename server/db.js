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
  CREATE TABLE IF NOT EXISTS test_runs_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suite_id INTEGER NOT NULL REFERENCES suites(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('in-progress', 'completed')),
    pass_count INTEGER NOT NULL DEFAULT 0,
    fail_count INTEGER NOT NULL DEFAULT 0,
    skip_count INTEGER NOT NULL DEFAULT 0,
    start_time TEXT NOT NULL,
    end_time TEXT,
    created_by TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS test_run_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL REFERENCES test_runs_v2(id) ON DELETE CASCADE,
    test_case_id INTEGER NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    result TEXT CHECK (result IS NULL OR result IN ('passed', 'failed', 'skipped')),
    duration_ms INTEGER,
    notes TEXT,
    failed_at TEXT,
    github_issue_url TEXT,
    sort_order INTEGER NOT NULL,
    UNIQUE (run_id, test_case_id)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL REFERENCES test_runs_v2(id) ON DELETE CASCADE,
    suite_name TEXT NOT NULL,
    run_date TEXT NOT NULL,
    total_count INTEGER NOT NULL,
    passed_count INTEGER NOT NULL,
    failed_count INTEGER NOT NULL,
    skipped_count INTEGER NOT NULL,
    results TEXT NOT NULL,
    generated_at TEXT NOT NULL
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

const runSeedCount = db.prepare('SELECT COUNT(*) AS count FROM test_runs_v2').get().count

if (runSeedCount === 0) {
  const suite = db.prepare('SELECT id FROM suites WHERE name = ?').get('Login Smoke Suite')

  if (suite) {
    const cases = db
      .prepare('SELECT test_case_id, sort_order FROM suite_test_cases WHERE suite_id = ? ORDER BY sort_order ASC')
      .all(suite.id)

    if (cases.length > 0) {
      const now = Date.now()
      const minutesAgo = (n) => new Date(now - n * 60000).toISOString()

      const resultSeedData = [
        { result: 'passed', notes: null, failed: false },
        {
          result: 'failed',
          notes: 'Login intermittently returns a 503 under load — matches the known "Login fails with 503 under load" bug.',
          failed: true,
        },
        { result: 'skipped', notes: 'Skipped — blocked by environment setup.', failed: false },
      ]

      const counts = { passed: 0, failed: 0, skipped: 0 }
      const insertResult = db.prepare(`
        INSERT INTO test_run_results (run_id, test_case_id, result, notes, failed_at, sort_order)
        VALUES (@run_id, @test_case_id, @result, @notes, @failed_at, @sort_order)
      `)

      const insertRun = db.transaction(() => {
        const runInfo = db
          .prepare(`
            INSERT INTO test_runs_v2 (suite_id, status, pass_count, fail_count, skip_count, start_time, end_time, created_by)
            VALUES (@suite_id, 'completed', 0, 0, 0, @start_time, @end_time, @created_by)
          `)
          .run({
            suite_id: suite.id,
            start_time: minutesAgo(30),
            end_time: minutesAgo(5),
            created_by: 'local-user',
          })
        const runId = runInfo.lastInsertRowid

        cases.forEach((c, index) => {
          const seed = resultSeedData[index] || { result: 'skipped', notes: null, failed: false }
          counts[seed.result]++
          insertResult.run({
            run_id: runId,
            test_case_id: c.test_case_id,
            result: seed.result,
            notes: seed.notes,
            failed_at: seed.failed ? minutesAgo(10) : null,
            sort_order: c.sort_order,
          })
        })

        db.prepare(`
          UPDATE test_runs_v2 SET pass_count = ?, fail_count = ?, skip_count = ? WHERE id = ?
        `).run(counts.passed, counts.failed, counts.skipped, runId)
      })

      insertRun()
    }
  }
}

const reportSeedCount = db.prepare('SELECT COUNT(*) AS count FROM reports').get().count

if (reportSeedCount === 0) {
  const run = db
    .prepare(`
      SELECT tr.*, s.name AS suite_name
      FROM test_runs_v2 tr
      JOIN suites s ON s.id = tr.suite_id
      ORDER BY tr.start_time DESC
      LIMIT 1
    `)
    .get()

  if (run) {
    const results = db
      .prepare(`
        SELECT rr.*, tc.title AS title, tc.severity AS severity
        FROM test_run_results rr
        JOIN test_cases tc ON tc.id = rr.test_case_id
        WHERE rr.run_id = ?
        ORDER BY rr.sort_order ASC
      `)
      .all(run.id)
      .map((row) => ({
        testCaseId: row.test_case_id,
        title: row.title,
        severity: row.severity,
        result: row.result,
        notes: row.notes,
        durationMs: row.duration_ms,
        failedAt: row.failed_at,
        githubIssueUrl: row.github_issue_url,
      }))

    db.prepare(`
      INSERT INTO reports (run_id, suite_name, run_date, total_count, passed_count, failed_count, skipped_count, results, generated_at)
      VALUES (@run_id, @suite_name, @run_date, @total_count, @passed_count, @failed_count, @skipped_count, @results, @generated_at)
    `).run({
      run_id: run.id,
      suite_name: run.suite_name,
      run_date: run.start_time,
      total_count: results.length,
      passed_count: run.pass_count,
      failed_count: run.fail_count,
      skipped_count: run.skip_count,
      results: JSON.stringify(results),
      generated_at: new Date().toISOString(),
    })
  }
}

export default db
