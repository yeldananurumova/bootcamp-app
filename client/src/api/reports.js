const BASE_URL = '/api/reports'

async function request(url, options) {
  const res = await fetch(url, options)
  const body = await res.json()
  if (!body.success) {
    throw new Error(body.error || 'Request failed')
  }
  return body.data
}

export function listReports() {
  return request(BASE_URL)
}

export function getReport(id) {
  return request(`${BASE_URL}/${id}`)
}

export function createReport(runId) {
  return request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId }),
  })
}

export function exportReportHtmlUrl(id) {
  return `${BASE_URL}/${id}/export/html`
}
