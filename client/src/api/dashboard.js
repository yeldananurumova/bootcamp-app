const BASE_URL = '/api/dashboard'

export async function getDashboardMetrics() {
  const res = await fetch(`${BASE_URL}/metrics`)
  const body = await res.json()
  if (!body.success) {
    throw new Error(body.error || 'Request failed')
  }
  return body.data
}
