import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import FeeForm from './fee-form'

export const dynamic = 'force-dynamic'

function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value)
}

function readAmount(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null
  const amount = Number(value)
  if (!Number.isSafeInteger(amount) || amount > 1000000000) return null
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
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId) ||
    !name || name.length > 150 || category.length > 100 ||
    sellingPrice === null || productionCost === null || marketplaceFee === null
  ) redirect('/products?status=invalid')

  // Baca hanya workspace yang diizinkan RLS bagi akun ini.
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .maybeSingle()

  if (workspaceError || !workspace) redirect('/products?status=denied')

  // RLS produk tetap mengontrol siapa yang dapat menambah produk.
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

  return (
    <main style={{ minHeight: '100vh', background: '#081b2a', color: '#fff', padding: '32px 18px' }}>
      <div style={{ maxWidth: 950, margin: 'auto' }}>
        <Link href="/dashboard" style={{ color: '#54e3ac' }}>
          ← Kembali ke Dashboard
        </Link>
        <h1 style={{ marginTop: 16 }}>Database Produk Cetakprofit</h1>
        <p>Simpan harga jual, HPP, dan biaya marketplace per workspace.</p>

        {status === 'saved' && (
          <p role="status" style={{ color: '#54e3ac' }}>Produk berhasil disimpan!</p>
        )}
        {status === 'updated' && (
          <p role="status" style={{ color: '#54e3ac' }}>Produk berhasil diperbarui!</p>
        )}
        {status === 'deleted' && (
          <p role="status" style={{ color: '#54e3ac' }}>Produk berhasil dihapus!</p>
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

        {workspaceError ? (
          <section style={box}><p role="alert">Gagal membaca workspace.</p></section>
        ) : !workspaces?.length ? (
          <section style={box}>
            <p>Belum ada workspace. <Link href="/dashboard" style={{ color: '#54e3ac' }}>
              Buat workspace terlebih dahulu
            </Link>.</p>
          </section>
        ) : (
          <FeeForm
            workspaces={workspaces.map(w => ({ id: w.id, name: w.name }))}
            saveAction={saveProduct}
          />
        )}

        <section style={box}>
          <h2 style={{ marginBottom: 20 }}>Daftar Produk Tersimpan</h2>
          {productError && <p role="alert">Gagal membaca produk dari database.</p>}
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
                <h3 style={{ color: profit >= 0 ? '#54e3ac' : '#ff9696' }}>
                  Profit: {rupiah(profit)} ({margin.toFixed(1)}%)
                </h3>
                <Link href={`/products/${p.id}/edit`} style={{
                  display: 'inline-block', marginTop: 12, padding: '10px 16px',
                  background: '#174c66', color: '#54e3ac',
                  borderRadius: 8, textDecoration: 'none'
                }}>
                  Edit / Hapus Produk
                </Link>
              </article>
            )
          })}
        </section>
      </div>
    </main>
  )
}
