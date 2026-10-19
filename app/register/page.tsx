
'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/browser'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')

    if (password.length < 8) {
      setMessage('Password minimal 8 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo:
            'https://cetak-profit.vercel.app/auth/callback'
        }
      })

      if (error) {
        setMessage(error.message)
        return
      }

      setSuccess(true)
      setMessage('Silakan periksa email untuk verifikasi akun.')
    } catch {
      setMessage('Terjadi kesalahan. Coba lagi nanti.')
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
      <form onSubmit={handleRegister} style={{
        width: '100%',
        maxWidth: 420,
        background: '#112b40',
        padding: 30,
        borderRadius: 16,
        display: 'grid',
        gap: 14
      }}>
        <h1 style={{ color: '#54e3ac' }}>Cetakprofit</h1>
        <h2>Daftar Akun Seller</h2>
        <p>Buat akun untuk mengelola bisnis percetakan.</p>

        {!success && (
          <>
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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
            />

            <label htmlFor="confirm">Ulangi Password</label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />
          </>
        )}

        {message && (
          <p role="status" style={{
            color: success ? '#54e3ac' : '#ffaaaa'
          }}>
            {message}
          </p>
        )}

        {!success && (
          <button type="submit" disabled={loading} style={{
            padding: 14,
            border: 0,
            borderRadius: 8,
            background: '#2581b8',
            color: 'white',
            cursor: 'pointer'
          }}>
            {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>
        )}

        <p>
          Sudah punya akun?{' '}
          <Link href="/login" style={{ color: '#54e3ac' }}>
            Masuk
          </Link>
        </p>
      </form>
    </main>
  )
}
