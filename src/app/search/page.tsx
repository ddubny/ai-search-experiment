'use client'
import { useState } from 'react'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<any[]>([])

  const handleSearch = async () => {
    if (!query) return
    const res = await fetch(
      `/api/google?q=${encodeURIComponent(query)}`
    )
    const data = await res.json()
    setResult(data.items || [])

    // 로그 저장
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participant_id: sessionStorage.getItem('participant_id'),
        mode: 'search',
        query,
        response: JSON.stringify(data.items),
      }),
    })
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Search Engine Experiment</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search something..."
        style={{ width: '60%', padding: '0.5rem' }}
      />
      <button onClick={handleSearch} style={{ marginLeft: '1rem' }}>
        Search
      </button>

      <ul>
        {result.map((r, i) => (
          <li key={i}>
            <a href={r.link} target="_blank" rel="noreferrer">
              {r.title}
            </a>
          </li>
        ))}
      </ul>

      <button onClick={() => location.href = '/chatgpt'}>Next → ChatGPT</button>
    </main>
  )
}
