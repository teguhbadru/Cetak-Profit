
'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        })

      if (loginError) {
        setError(loginError.message)
        return
      }

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    background: '#0b2134',
    border: '1px solid #35526b',
    borderRadius: '8px',
    color: '#fff',
    boxSizing: 'border-box' as const
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#081b2a',
      color: 'white',
      display: 'grid',
      placeItems: 'center',
      padding: 20
    }}>
      <form onSubmit={handleLogin} style={{
        width: '100%',
        maxWidth: 420,
        background: '#112b40',
        padding: 30,
        borderRadius: 16,
        display: 'grid',
        gap: 14
      }}>
        <h1 style={{ color: '#54e3ac' }}>Cetakprofit</h1>
        <h2>Login Seller</h2>
        <p>Masuk untuk mengelola profit percetakan.</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && <p role="alert" style={{ color: '#ffaaaa' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{
          padding: 14,
          borderRadius: 8,
          border: 0,
          background: '#2581b8',
          color: 'white',
          cursor: 'pointer'
        }}>
          {loading ? 'Memproses...' : 'Masuk'}
        </button>

        <p>
          Belum punya akun?{' '}
          <Link href="/register" style={{ color: '#54e3ac' }}>
            Daftar sekarang
          </Link>
        </p>

        <Link href="/" style={{ color: '#b8d5e8' }}>
          Kembali ke Kalkulator
        </Link>
      </form>
    </main>
  )
}
