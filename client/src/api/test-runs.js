const BASE_URL = '/api/test-runs'

async function request(url, options) {
  const res = await fetch(url, options)
  const body = await res.json()
  if (!body.success) {
    throw new Error(body.error || 'Request failed')
  }
  return body.data
}

export function listTestRuns() {
  return request(BASE_URL)
}

export function getTestRun(id) {
  return request(`${BASE_URL}/${id}`)
}

export function createTestRun(suiteId) {
  return request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suiteId }),
  })
}

export function updateTestRunResult(runId, testCaseId, result, notes) {
  return request(`${BASE_URL}/${runId}/cases/${testCaseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result, notes }),
  })
}
