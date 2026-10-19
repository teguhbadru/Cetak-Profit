
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

  const amount = Number(value)

  if (
    !Number.isSafeInteger(amount) ||
    amount < 0 ||
    amount > 1000000000
  ) {
    return null
  }

  return amount
}

// ====================================
// SIMPAN PERUBAHAN PRODUK
// ====================================

async function updateProduct(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const id = String(formData.get('id') ?? '')

  if (!uuidPattern.test(id)) {
    redirect('/products?status=invalid')
  }

  const name = String(formData.get('name') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()

  const sellingPrice = readAmount(formData.get('selling_price'))
  const productionCost = readAmount(formData.get('production_cost'))
  const marketplaceFee = readAmount(formData.get('marketplace_fee'))

  if (
    name.length < 1 ||
    name.length > 150 ||
    category.length > 100 ||
    sellingPrice === null ||
    productionCost === null ||
    marketplaceFee === null
  ) {
    redirect(`/products/${id}/edit?status=invalid`)
  }

  // Produk hanya dapat diakses sesuai RLS Supabase.
  const { data: product, error: findError } = await supabase
    .from('products')
    .select('id, workspace_id')
    .eq('id', id)
    .maybeSingle()

  if (findError || !product) {
    redirect('/products?status=denied')
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
    .eq('workspace_id', product.workspace_id)
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    redirect(`/products/${id}/edit?status=failed`)
  }

  redirect('/products?status=updated')
}

// ====================================
// HAPUS PRODUK DENGAN CHECKBOX
// ====================================

async function deleteProduct(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const id = String(formData.get('id') ?? '')

  if (!uuidPattern.test(id)) {
    redirect('/products?status=invalid')
  }

  // Checkbox wajib dicentang.
  // Validasi dilakukan kembali di server.
  const confirmed = formData.get('confirm_delete')

  if (confirmed !== 'on') {
    redirect(`/products/${id}/edit?status=confirm`)
  }

  // Hapus hanya jika produk dapat diakses
  // berdasarkan kebijakan RLS Supabase.
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

// ====================================
// HALAMAN EDIT DAN HAPUS PRODUK
// ====================================

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

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  if (!uuidPattern.test(id)) {
    notFound()
  }

  const { data: product, error } = await supabase
    .from('products')
    .select(
      'id, name, category, selling_price, production_cost, marketplace_fee'
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !product) {
    notFound()
  }

  const inputStyle = {
    display: 'block' as const,
    width: '100%',
    padding: 12,
    marginTop: 7,
    background: '#081b2a',
    color: '#ffffff',
    border: '1px solid #36536b',
    borderRadius: 8,
    boxSizing: 'border-box' as const
  }

  const fields = [
    {
      key: 'selling_price',
      label: 'Harga Jual',
      value: product.selling_price
    },
    {
      key: 'production_cost',
      label: 'HPP Produksi',
      value: product.production_cost
    },
    {
      key: 'marketplace_fee',
      label: 'Biaya Marketplace',
      value: product.marketplace_fee
    }
  ]

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#081b2a',
        padding: '32px 18px',
        color: '#ffffff'
      }}
    >
      <div
        style={{
          maxWidth: 650,
          margin: 'auto',
          background: '#112b40',
          padding: 28,
          borderRadius: 16
        }}
      >
        <Link
          href="/products"
          style={{
            color: '#54e3ac',
            textDecoration: 'none'
          }}
        >
          ← Kembali ke Database Produk
        </Link>

        <h1 style={{ marginTop: 26 }}>
          Edit Produk Cetakprofit
        </h1>

        <p style={{ color: '#b8d5e8' }}>
          Perbarui informasi produk dan biaya produksi.
        </p>

        {status && (
          <p
            role="alert"
            style={{
              color: '#ffb4b4',
              padding: 12,
              background: '#40252d',
              borderRadius: 8
            }}
          >
            {status === 'invalid'
              ? 'Periksa kembali data produk.'
              : status === 'confirm'
              ? 'Centang persetujuan sebelum menghapus produk.'
              : 'Operasi gagal. Periksa hak akses dan coba lagi.'}
          </p>
        )}

        {/* FORM EDIT PRODUK */}

        <form
          action={updateProduct}
          style={{
            display: 'grid',
            gap: 16,
            marginTop: 24
          }}
        >
          <input
            type="hidden"
            name="id"
            value={product.id}
          />

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

          <button
            type="submit"
            style={{
              background: '#2581b8',
              color: '#ffffff',
              padding: 14,
              border: 0,
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Simpan Perubahan Produk
          </button>
        </form>

        {/* PEMBATAS */}

        <hr
          style={{
            margin: '32px 0',
            borderColor: '#36536b'
          }}
        />

        {/* FORM HAPUS PRODUK */}

        <h2 style={{ color: '#ffffff' }}>
          Hapus Produk
        </h2>

        <p
          style={{
            color: '#ffb4b4',
            lineHeight: 1.6
          }}
        >
          Produk yang dihapus tidak dapat dikembalikan.
          Centang persetujuan sebelum menghapus produk.
        </p>

        <form
          action={deleteProduct}
          style={{
            display: 'grid',
            gap: 16,
            marginTop: 20
          }}
        >
          <input
            type="hidden"
            name="id"
            value={product.id}
          />

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              background: '#0b2134',
              border: '1px solid #36536b',
              borderRadius: 10,
              cursor: 'pointer',
              color: '#ffffff'
            }}
          >
            <input
              type="checkbox"
              name="confirm_delete"
              value="on"
              required
              style={{
                width: 20,
                height: 20,
                flexShrink: 0,
                accentColor: '#54e3ac',
                cursor: 'pointer'
              }}
            />

            <span style={{ lineHeight: 1.5 }}>
              Saya yakin ingin menghapus produk ini
              secara permanen.
            </span>
          </label>

          <button
            type="submit"
            style={{
              padding: 14,
              border: 0,
              borderRadius: 8,
              background: '#a33535',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Hapus Produk Permanen
          </button>
        </form>
      </div>
    </main>
  )
}
