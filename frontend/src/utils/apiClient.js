export function createApiClient(getToken, baseUrl) {
  async function request(path, options = {}) {
    const token = await getToken?.()
    const headers = new Headers(options.headers || {})
    headers.set('Content-Type', 'application/json')
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const res = await fetch(`${baseUrl}${path}`, { ...options, headers })
    const text = await res.text()
    let json
    try { json = text ? JSON.parse(text) : null } catch { json = { raw: text } }
    if (!res.ok) throw Object.assign(new Error('Request failed'), { status: res.status, data: json })
    return json
  }
  return {
    get: (p) => request(p),
    post: (p, b) => request(p, { method: 'POST', body: JSON.stringify(b) }),
    patch: (p, b) => request(p, { method: 'PATCH', body: JSON.stringify(b) }),
    del: (p) => request(p, { method: 'DELETE' })
  }
}


