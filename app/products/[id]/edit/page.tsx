
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function amount(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number > 1000000000) return null
  return number
}

async function updateProduct(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = String(formData.get('id') ?? '')
  if (!uuidPattern.test(id)) redirect('/products?status=invalid')

  const name = String(formData.get('name') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const sellingPrice = amount(formData.get('selling_price'))
  const productionCost = amount(formData.get('production_cost'))
  const marketplaceFee = amount(formData.get('marketplace_fee'))

  if (
    name.length < 1 || name.length > 150 ||
    category.length > 100 ||
    sellingPrice === null ||
    productionCost === null ||
    marketplaceFee === null
  ) {
    redirect(`/products/${id}/edit?status=invalid`)
  }

  const { data: product } = await supabase
    .from('products')
    .select('id, workspace_id')
    .eq('id', id)
    .maybeSingle()

  if (!product) redirect('/products?status=denied')

  const { data: updated, error } = await supabase
    .from('products')
    .update({
      name,
      category: category || null,
      selling_price: sellingPrice,
      production_cost: productionCost,
      marketplace_fee: marketplaceFee,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('workspace_id', product.workspace_id)
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    redirect(`/products/${id}/edit?status=failed`)
  }

  redirect('/products?status=updated')
}

async function deleteProduct(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = String(formData.get('id') ?? '')
  if (!uuidPattern.test(id)) redirect('/products?status=invalid')

  if (formData.get('confirmation') !== 'HAPUS') {
    redirect(`/products/${id}/edit?status=confirm`)
  }

  const { data: deleted, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error || !deleted) {
    redirect(`/products/${id}/edit?status=failed`)
  }

  redirect('/products?status=deleted')
}

export default async function EditProductPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { id } = await params
  const { status } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!uuidPattern.test(id)) notFound()

  const { data: product } = await supabase
    .from('products')
    .select('id, name, category, selling_price, production_cost, marketplace_fee')
    .eq('id', id)
    .maybeSingle()

  if (!product) notFound()

  const inputStyle = {
    display: 'block' as const,
    width: '100%',
    padding: 12,
    marginTop: 7,
    background: '#081b2a',
    color: 'white',
    border: '1px solid #36536b',
    borderRadius: 8,
    boxSizing: 'border-box' as const
  }

  const fields = [
    { key: 'selling_price', label: 'Harga Jual', value: product.selling_price },
    { key: 'production_cost', label: 'HPP Produksi', value: product.production_cost },
    { key: 'marketplace_fee', label: 'Biaya Marketplace', value: product.marketplace_fee }
  ]

  return (
    <main style={{
      minHeight: '100vh',
      background: '#081b2a',
      padding: '32px 18px',
      color: 'white'
    }}>
      <div style={{
        maxWidth: 650,
        margin: 'auto',
        background: '#112b40',
        padding: 28,
        borderRadius: 16
      }}>
        <Link href="/products" style={{ color: '#54e3ac' }}>
          ← Kembali ke Database Produk
        </Link>

        <h1>Edit Produk Cetakprofit</h1>

        {status && (
          <p role="alert" style={{ color: '#ffb4b4' }}>
            {status === 'invalid'
              ? 'Periksa data produk.'
              : status === 'confirm'
              ? 'Ketik HAPUS untuk mengonfirmasi.'
              : 'Operasi gagal. Periksa hak akses dan coba lagi.'}
          </p>
        )}

        <form action={updateProduct} style={{
          display: 'grid',
          gap: 16
        }}>
          <input type="hidden" name="id" value={product.id}/>

          <label>
            Nama Produk
            <input
              name="name"
              defaultValue={product.name}
              required
              maxLength={150}
              style={inputStyle}
            />
          </label>

          <label>
            Kategori
            <input
              name="category"
              defaultValue={product.category ?? ''}
              maxLength={100}
              style={inputStyle}
            />
          </label>

          {fields.map(field => (
            <label key={field.key}>
              {field.label} (Rp)
              <input
                name={field.key}
                type="number"
                min="0"
                max="1000000000"
                step="1"
                required
                defaultValue={Number(field.value)}
                style={inputStyle}
              />
            </label>
          ))}

          <button type="submit" style={{
            background: '#2581b8',
            color: 'white',
            padding: 14,
            border: 0,
            borderRadius: 8,
            cursor: 'pointer'
          }}>
            Simpan Perubahan
          </button>
        </form>

        <hr style={{ margin: '32px 0', borderColor: '#36536b' }}/>

        <h2>Hapus Produk</h2>
        <p style={{ color: '#ffc5c5' }}>
          Tindakan ini menghapus produk dari database.
          Ketik HAPUS untuk mengonfirmasi.
        </p>

        <form action={deleteProduct} style={{
          display: 'grid',
          gap: 14
        }}>
          <input type="hidden" name="id" value={product.id}/>
          <input
            name="confirmation"
            placeholder="Ketik HAPUS"
            pattern="HAPUS"
            required
            autoComplete="off"
            style={inputStyle}
          />

          <button type="submit" style={{
            padding: 14,
            border: 0,
            borderRadius: 8,
            background: '#a33535',
            color: 'white',
            cursor: 'pointer'
          }}>
            Hapus Produk Permanen
          </button>
        </form>
      </div>
    </main>
  )
}
