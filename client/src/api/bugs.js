const BASE_URL = '/api/bugs'

async function request(url, options) {
  const res = await fetch(url, options)
  const body = await res.json()
  if (!body.success) {
    throw new Error(body.error || 'Request failed')
  }
  return body.data
}

export function listBugs({ status = '', severity = '', priority = '', search = '' } = {}) {
  const params = new URLSearchParams({ status, severity, priority, search })
  return request(`${BASE_URL}?${params.toString()}`)
}

export function getBug(id) {
  return request(`${BASE_URL}/${id}`)
}

export function createBug(payload) {
  return request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function updateBug(id, payload) {
  return request(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteBug(id) {
  return request(`${BASE_URL}/${id}`, { method: 'DELETE' })
}

export function changeBugStatus(id, status, message) {
  return request(`${BASE_URL}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, message }),
  })
}

export function addBugComment(id, message) {
  return request(`${BASE_URL}/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
}
