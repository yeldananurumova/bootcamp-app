import { useEffect, useState } from 'react'

function HomePage() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((body) => setStatus(body.data.status))
      .catch(() => setStatus('unreachable'))
  }, [])

  return (
    <div className="app">
      <h1>Bootcamp App</h1>
      <p>
        Server status: <strong>{status}</strong>
      </p>
    </div>
  )
}

export default HomePage
