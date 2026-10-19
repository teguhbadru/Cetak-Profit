
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export const dynamic = 'force-dynamic'

function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value)
}

function readAmount(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value.trim()) return null
  const amount = Number(value)
  if (!Number.isSafeInteger(amount) || amount < 0 ||
      amount > 1000000000) return null
  return amount
}

async function saveProduct(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const workspaceId = String(formData.get('workspace_id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const sellingPrice = readAmount(formData.get('selling_price'))
  const productionCost = readAmount(formData.get('production_cost'))
  const marketplaceFee = readAmount(formData.get('marketplace_fee'))

  if (
    !/^[0-9a-f-]{36}$/i.test(workspaceId) ||
    !name || name.length > 150 ||
    category.length > 100 ||
    sellingPrice === null ||
    productionCost === null ||
    marketplaceFee === null
  ) {
    redirect('/products?status=invalid')
  }

  // Pastikan workspace dapat diakses oleh akun login.
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .maybeSingle()

  if (workspaceError || !workspace) {
    redirect('/products?status=denied')
  }

  // Kebijakan RLS products tetap memeriksa hak akses.
  const { error } = await supabase
    .from('products')
    .insert({
      workspace_id: workspaceId,
      name,
      category: category || null,
      selling_price: sellingPrice,
      production_cost: productionCost,
      marketplace_fee: marketplaceFee
    })

  if (error) redirect('/products?status=failed')

  redirect('/products?status=saved')
}

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { status } = await searchParams

  const { data: workspaces, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name')
    .order('created_at', { ascending: false })

  const { data: products, error: productError } = await supabase
    .from('products')
    .select('id, workspace_id, name, category, selling_price, production_cost, marketplace_fee')
    .order('created_at', { ascending: false })
    .limit(50)

  const box = {
    background: '#112b40',
    borderRadius: 14,
    padding: 24,
    marginBottom: 20
  }

  const input = {
    display: 'block' as const,
    width: '100%',
    padding: 12,
    marginTop: 7,
    background: '#081b2a',
    border: '1px solid #36536b',
    borderRadius: 8,
    color: 'white',
    boxSizing: 'border-box' as const
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#081b2a',
      color: 'white',
      padding: '32px 18px'
    }}>
      <div style={{ maxWidth: 950, margin: 'auto' }}>
        <Link href="/dashboard" style={{ color: '#54e3ac' }}>
          ← Kembali ke Dashboard
        </Link>

        <h1>Database Produk Cetakprofit</h1>
        <p>Simpan harga jual, HPP, dan biaya marketplace per workspace.</p>

        {status === 'saved' && (
          <p style={{ color: '#54e3ac' }}>Produk berhasil disimpan!</p>
        )}
        {status === 'invalid' && (
          <p role="alert">Periksa kembali semua data produk.</p>
        )}
        {status === 'denied' && (
          <p role="alert">Workspace tidak dapat diakses.</p>
        )}
        {status === 'failed' && (
          <p role="alert">Gagal menyimpan produk. Periksa izin database.</p>
        )}

        <section style={box}>
          <h2>Tambah Produk Baru</h2>

          {workspaceError && (
            <p role="alert">Gagal membaca workspace.</p>
          )}

          {!workspaceError && !workspaces?.length ? (
            <p>
              Belum ada workspace.{' '}
              <Link href="/dashboard" style={{ color: '#54e3ac' }}>
                Buat workspace dahulu
              </Link>
            </p>
          ) : (
            <form action={saveProduct} style={{
              display: 'grid',
              gap: 16
            }}>
              <label>
                Workspace
                <select name="workspace_id" required style={input}>
                  {workspaces?.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Nama Produk
                <input name="name" required maxLength={150}
                  placeholder="Stiker Vinyl A3+ (1 lembar)"
                  style={input}/>
              </label>

              <label>
                Kategori
                <input name="category" maxLength={100}
                  defaultValue="Label & Stiker" style={input}/>
              </label>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16
              }}>
                <label>
                  Harga Jual (Rp)
                  <input name="selling_price" type="number"
                    min="0" max="1000000000" step="1" required
                    defaultValue={16000} style={input}/>
                </label>

                <label>
                  HPP Produksi (Rp)
                  <input name="production_cost" type="number"
                    min="0" max="1000000000" step="1" required
                    defaultValue={6650} style={input}/>
                </label>

                <label>
                  Biaya Marketplace (Rp)
                  <input name="marketplace_fee" type="number"
                    min="0" max="1000000000" step="1" required
                    defaultValue={5509} style={input}/>
                </label>
              </div>

              <button type="submit" style={{
                background: '#2581b8',
                color: 'white',
                padding: 14,
                borderRadius: 8,
                border: 0,
                cursor: 'pointer'
              }}>
                Simpan Produk
              </button>
            </form>
          )}
        </section>

        <section style={box}>
          <h2>Daftar Produk Tersimpan</h2>

          {productError && (
            <p role="alert">Gagal membaca produk dari database.</p>
          )}

          {!productError && products?.length === 0 && (
            <p>Belum ada produk yang disimpan.</p>
          )}

          {products?.map(p => {
            const harga = Number(p.selling_price)
            const hpp = Number(p.production_cost)
            const biaya = Number(p.marketplace_fee)
            const profit = harga - hpp - biaya
            const margin = harga > 0 ? profit / harga * 100 : 0
            const workspace = workspaces?.find(w => w.id === p.workspace_id)

            return (
              <article key={p.id} style={{
                padding: 18,
                background: '#081b2a',
                border: '1px solid #36536b',
                borderRadius: 10,
                marginBottom: 12
              }}>
                <strong>{p.name}</strong>
                <p style={{ color: '#a7c8dc' }}>
                  {workspace?.name ?? 'Workspace'} · {p.category}
                </p>
                <p>Harga jual: {rupiah(harga)}</p>
                <p>HPP: {rupiah(hpp)} · Marketplace: {rupiah(biaya)}</p>
                <h3 style={{
                  color: profit >= 0 ? '#54e3ac' : '#ff9696'
                }}>
                  Profit: {rupiah(profit)} ({margin.toFixed(1)}%)
                </h3>
              </article>
            )
          })}
        </section>
      </div>
    </main>
  )
}
