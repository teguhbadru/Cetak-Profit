
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'
import LogoutButton from './logout-button'

export const dynamic = 'force-dynamic'

async function createWorkspace(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const { data: { user }, error: authError } =
    await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const name = String(formData.get('name') ?? '').trim()

  if (name.length < 2 || name.length > 100) {
    throw new Error('Nama workspace harus 2–100 karakter')
  }

  const { error } = await supabase
    .from('workspaces')
    .insert({
      name,
      owner_id: user.id
    })

  if (error) {
    throw new Error('Gagal membuat workspace: ' + error.message)
  }

  revalidatePath('/dashboard')
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } =
    await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  return (
    <main style={{
      minHeight: '100vh',
      background: '#081b2a',
      color: 'white',
      padding: '40px 20px'
    }}>
      <section style={{
        maxWidth: 850,
        margin: 'auto',
        background: '#112b40',
        padding: 30,
        borderRadius: 16
      }}>
        <h1>Dashboard Cetakprofit</h1>
        <p>Login sebagai: {user.email}</p>

        <hr style={{ margin: '24px 0' }} />

        <h2>Workspace Percetakan</h2>
        <p>Buat workspace untuk menyimpan data usaha.</p>

        <form action={createWorkspace} style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 24
        }}>
          <input
            name="name"
            placeholder="Contoh: Bisa Print"
            required
            minLength={2}
            maxLength={100}
            style={{
              padding: 12,
              flex: 1,
              minWidth: 180,
              borderRadius: 8,
              color: '#111'
            }}
          />

          <button type="submit" style={{
            background: '#2581b8',
            color: 'white',
            border: 0,
            padding: '12px 20px',
            borderRadius: 8,
            cursor: 'pointer'
          }}>
            Buat Workspace
          </button>
        </form>

        <h3>Daftar Workspace</h3>

        {error && (
          <p role="alert">Gagal mengambil data workspace.</p>
        )}

        {!error && workspaces?.length === 0 && (
          <p>Belum ada workspace.</p>
        )}

        {workspaces?.map(workspace => (
          <div key={workspace.id} style={{
            background: '#0b2134',
            padding: 16,
            borderRadius: 10,
            marginBottom: 12
          }}>
            <strong>{workspace.name}</strong>
            <p>Workspace tersimpan di database.</p>
          </div>
        ))}

        <hr style={{ margin: '24px 0' }} />

        <p>
          <Link href="/" style={{ color: '#54e3ac' }}>
            Buka Kalkulator HPP
          </Link>
        </p>

        <LogoutButton />
      </section>
    </main>
  )
}
