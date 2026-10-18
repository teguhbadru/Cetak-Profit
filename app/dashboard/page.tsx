import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'
import LogoutButton from './logout-button'

export const dynamic = 'force-dynamic'
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')
  return <main style={{minHeight:'100vh',background:'#081b2a',color:'white',padding:'48px 24px'}}>
    <section style={{margin:'auto',maxWidth:800,background:'#112b40',padding:30,borderRadius:16}}>
      <h1>Dashboard Cetakprofit</h1>
      <p>Berhasil login sebagai: <strong>{user.email}</strong></p>
      <p>Berikutnya kita akan menambahkan workspace percetakan dan penyimpanan produk.</p>
      <p><Link href="/">Buka Kalkulator HPP</Link></p>
      <LogoutButton />
    </section>
  </main>
}
