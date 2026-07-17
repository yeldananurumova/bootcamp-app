const BASE_URL = '/api/test-cases'

async function request(url, options) {
  const res = await fetch(url, options)
  const body = await res.json()
  if (!body.success) {
    throw new Error(body.error || 'Request failed')
  }
  return body.data
}

export function listTestCases({ search = '', status = '', sortBy = 'updatedAt', sortDir = 'desc', page = 1 } = {}) {
  const params = new URLSearchParams({ search, status, sortBy, sortDir, page })
  return request(`${BASE_URL}?${params.toString()}`)
}

export function getTestCase(id) {
  return request(`${BASE_URL}/${id}`)
}

export function createTestCase(payload) {
  return request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function updateTestCase(id, payload) {
  return request(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteTestCase(id) {
  return request(`${BASE_URL}/${id}`, { method: 'DELETE' })
}

const MAX_PAGES = 1000

export async function listAllTestCases() {
  const all = []
  let page = 1

  while (page <= MAX_PAGES) {
    const data = await listTestCases({ page })
    if (data.items.length === 0) break
    all.push(...data.items)
    if (all.length >= data.total) break
    page++
  }

  return all
}
