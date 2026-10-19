
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readAmount(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null
  }

  const number = Number(value)

  if (!Number.isSafeInteger(number) ||
      number < 0 || number > 1000000000) {
    return null
  }

  return number
}

// SIMPAN PERUBAHAN PRODUK
async function updateProduct(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const id = String(formData.get('id') ?? '')
  if (!uuidPattern.test(id)) redirect('/products?status=invalid')

  const name = String(formData.get('name') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const sellingPrice = readAmount(formData.get('selling_price'))
  const productionCost = readAmount(formData.get('production_cost'))
  const marketplaceFee = readAmount(formData.get('marketplace_fee'))

  if (!name || name.length > 150 || category.length > 100 ||
      sellingPrice === null || productionCost === null ||
      marketplaceFee === null) {
    redirect(`/products/${id}/edit?status=invalid`)
  }

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
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    redirect(`/products/${id}/edit?status=failed`)
  }

  redirect('/products?status=updated')
}

// HAPUS PRODUK MENGGUNAKAN CHECKBOX
async function deleteProduct(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const id = String(formData.get('id') ?? '')
  if (!uuidPattern.test(id)) redirect('/products?status=invalid')

  // Validasi persetujuan pada server
  if (formData.get('confirm_delete') !== 'on') {
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

// HALAMAN EDIT DAN HAPUS
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

  const { data: product, error } = await supabase
    .from('products')
    .select('id, name, category, selling_price, production_cost, marketplace_fee')
    .eq('id', id)
    .maybeSingle()

  if (error || !product) notFound()

  const inputStyle = {
    display: 'block' as const,
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: 12,
    marginTop: 8,
    borderRadius: 8,
    border: '1px solid #36536b',
    background: '#081b2a',
    color: 'white'
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
      color: 'white',
      padding: '32px 18px'
    }}>
      <section style={{
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
        <p style={{ color: '#b8d5e8' }}>
          Perbarui informasi produk dan biaya marketplace.
        </p>

        {status && (
          <p role="alert" style={{
            color: '#ffb4b4',
            background: '#40252d',
            padding: 12,
            borderRadius: 8
          }}>
            {status === 'invalid'
              ? 'Periksa kembali data produk.'
              : status === 'confirm'
              ? 'Centang persetujuan sebelum menghapus.'
              : 'Operasi gagal. Periksa akses dan coba lagi.'}
          </p>
        )}

        <form action={updateProduct} style={{
          display: 'grid',
          gap: 16,
          marginTop: 24
        }}>
          <input type="hidden" name="id" value={product.id}/>

          <label>
            Nama Produk
            <input
              name="name"
              required
              maxLength={150}
              defaultValue={product.name}
              style={inputStyle}
            />
          </label>

          <label>
            Kategori
            <input
              name="category"
              maxLength={100}
              defaultValue={product.category ?? ''}
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
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Simpan Perubahan
          </button>
        </form>

        <hr style={{
          margin: '32px 0',
          borderColor: '#36536b'
        }}/>

        <h2>Hapus Produk</h2>
        <p style={{ color: '#ffb4b4' }}>
          Produk yang dihapus tidak dapat dikembalikan.
          Centang persetujuan untuk melanjutkan.
        </p>

        <form action={deleteProduct} style={{
          display: 'grid',
          gap: 16,
          marginTop: 18
        }}>
          <input type="hidden" name="id" value={product.id}/>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            border: '1px solid #36536b',
            background: '#081b2a',
            borderRadius: 10,
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              name="confirm_delete"
              value="on"
              required
              style={{
                width: 20,
                height: 20,
                flexShrink: 0,
                accentColor: '#54e3ac'
              }}
            />
            <span>
              Saya yakin ingin menghapus produk ini
              secara permanen.
            </span>
          </label>

          <button type="submit" style={{
            background: '#a33535',
            color: 'white',
            padding: 14,
            border: 0,
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Hapus Produk Permanen
          </button>
        </form>
      </section>
    </main>
  )
}
