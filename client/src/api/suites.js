const BASE_URL = '/api/suites'

async function request(url, options) {
  const res = await fetch(url, options)
  const body = await res.json()
  if (!body.success) {
    throw new Error(body.error || 'Request failed')
  }
  return body.data
}

export function listSuites({ status = '' } = {}) {
  const params = new URLSearchParams({ status })
  return request(`${BASE_URL}?${params.toString()}`)
}

export function getSuite(id) {
  return request(`${BASE_URL}/${id}`)
}

export function createSuite(payload) {
  return request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function updateSuite(id, payload) {
  return request(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteSuite(id) {
  return request(`${BASE_URL}/${id}`, { method: 'DELETE' })
}

export function reorderSuiteCases(id, testCaseIds) {
  return request(`${BASE_URL}/${id}/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testCaseIds }),
  })
}

export function addSuiteCase(id, testCaseId) {
  return request(`${BASE_URL}/${id}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testCaseId }),
  })
}

export function removeSuiteCase(id, testCaseId) {
  return request(`${BASE_URL}/${id}/cases/${testCaseId}`, { method: 'DELETE' })
}
