'use client'

import { useState, type CSSProperties } from 'react'
import { useFormStatus } from 'react-dom'

type Workspace = { id: string; name: string }

type Props = {
  workspaces: Workspace[]
  saveAction: (formData: FormData) => Promise<void>
}

const card: CSSProperties = {
  background: '#112b40',
  border: '1px solid #28465d',
  borderRadius: 14,
  padding: 24,
  marginBottom: 20
}

const input: CSSProperties = {
  width: '100%',
  minWidth: 0,
  display: 'block',
  padding: 12,
  marginTop: 7,
  background: '#081b2a',
  border: '1px solid #36536b',
  borderRadius: 8,
  color: '#fff',
  boxSizing: 'border-box'
}

const help: CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#a1bccc',
  lineHeight: 1.6,
  marginTop: 6
}

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16
}

function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value)
}

function safeNumber(value: string) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: '100%',
        background: pending ? '#506e83' : '#2581b8',
        color: '#fff',
        padding: 15,
        borderRadius: 8,
        border: 0,
        fontWeight: 700,
        cursor: pending ? 'wait' : 'pointer'
      }}
    >
      {pending ? 'Menyimpan produk...' : 'Simpan Produk ke Database'}
    </button>
  )
}

export default function FeeForm({ workspaces, saveAction }: Props) {
  const [price, setPrice] = useState('16000')
  const [cost, setCost] = useState('6650')
  const [quantity, setQuantity] = useState('1')
  const [storeType, setStoreType] = useState('Non Star')
  const [marketCategory, setMarketCategory] = useState('Lainnya')
  const [admin, setAdmin] = useState('9')
  const [shipping, setShipping] = useState('4.5')
  const [promo, setPromo] = useState('4.5')
  const [affiliate, setAffiliate] = useState('5')
  const [taxRate, setTaxRate] = useState('0.5')
  const [orderFee, setOrderFee] = useState('1250')
  const [manual, setManual] = useState(false)
  const [manualFee, setManualFee] = useState('0')

  const rates = [admin, shipping, promo, affiliate, taxRate]
    .map(safeNumber)
  const percentTotal = rates.reduce((total, rate) => total + rate, 0)
  const units = Math.max(1, Math.floor(safeNumber(quantity)))
  const unitPrice = safeNumber(price)
  const unitHpp = safeNumber(cost)
  const processFee = safeNumber(orderFee)
  // Potongan persentase per unit + biaya pesanan dibagi jumlah unit.
  const calculatedFee = Math.round(
    unitPrice * percentTotal / 100 + processFee / units
  )
  const finalFee = manual ? Math.round(safeNumber(manualFee)) : calculatedFee
  const profit = unitPrice - unitHpp - finalFee
  const margin = unitPrice > 0 ? profit / unitPrice * 100 : 0

  return (
    <form action={saveAction}>
      <section style={card}>
        <h2 style={{ margin: '0 0 20px' }}>1. Tambah Produk Baru</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          <label>
            Workspace
            <select name="workspace_id" required style={input}>
              {workspaces.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </label>
          <label>
            Nama Produk
            <input name="name" required maxLength={150}
              placeholder="Contoh: Stiker Vinyl A3+ (1 lembar)" style={input} />
          </label>
          <div style={grid}>
            <label>
              Kategori Produk Cetakprofit
              <input name="category" maxLength={100} defaultValue="Label & Stiker"
                style={input} />
            </label>
            <label>
              Jumlah unit per pesanan
              <input type="number" min="1" max="100000" step="1"
                value={quantity} onChange={e => setQuantity(e.target.value)}
                required style={input} />
              <small style={help}>Untuk membagi biaya tetap per pesanan ke setiap unit.</small>
            </label>
            <label>
              Harga Jual per Unit (Rp)
              <input name="selling_price" type="number" min="0"
                max="1000000000" step="1" required value={price}
                onChange={e => setPrice(e.target.value)} style={input} />
            </label>
            <label>
              HPP Produksi per Unit (Rp)
              <input name="production_cost" type="number" min="0"
                max="1000000000" step="1" required value={cost}
                onChange={e => setCost(e.target.value)} style={input} />
            </label>
          </div>
        </div>
      </section>

      <section style={card}>
        <h2 style={{ margin: '0 0 6px' }}>2. Setelan Biaya Default</h2>
        <p style={{ color: '#a1bccc', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
          Nilai awal mengikuti contoh simulasi kamu, bukan klaim tarif resmi Shopee 2026.
          Sesuaikan tarif dengan Seller Centre dan program toko sebelum menyimpan produk.
        </p>
        <div style={grid}>
          <label>
            Tipe Toko
            <select style={input} value={storeType}
              onChange={e => setStoreType(e.target.value)}>
              <option>Non Star</option>
              <option>Star / Star Plus</option>
              <option>Shopee Mall</option>
            </select>
            <small style={help}>Pilihan: Non Star, Star / Star Plus, Shopee Mall. Tarif dapat berbeda untuk setiap tipe.</small>
          </label>
          <label>
            Kategori Shopee
            <select style={input} value={marketCategory}
              onChange={e => setMarketCategory(e.target.value)}>
              <option>Lainnya</option>
              <option>Label &amp; Stiker</option>
              <option>Buku &amp; Alat Tulis</option>
              <option>Percetakan &amp; Grafika</option>
              <option>Kemasan &amp; Packaging</option>
              <option>Poster &amp; Dekorasi</option>
              <option>Ibu &amp; Bayi</option>
              <option>Makanan &amp; Minuman</option>
              <option>Perlengkapan Rumah</option>
              <option>Fashion</option>
              <option>Kesehatan &amp; Kecantikan</option>
              <option>Elektronik</option>
              <option>Hobi &amp; Koleksi</option>
            </select>
            <small style={help}>Kategori ini hanya referensi. Persentase admin tidak berubah otomatis saat dipilih.</small>
          </label>
          <label>
            Biaya Admin (%)
            <input type="number" min="0" max="100" step="0.01"
              value={admin} onChange={e => setAdmin(e.target.value)} style={input} required />
            <small style={help}>Default 9% — dapat diubah sesuai biaya aktual tokomu.</small>
          </label>
          <label>
            Gratis Ongkir XTRA (%)
            <input type="number" min="0" max="100" step="0.01"
              value={shipping} onChange={e => setShipping(e.target.value)} style={input} required />
            <small style={help}>Default 4,5%.</small>
          </label>
          <label>
            Promo XTRA (%)
            <input type="number" min="0" max="100" step="0.01"
              value={promo} onChange={e => setPromo(e.target.value)} style={input} required />
            <small style={help}>Nilai awal 4,5%.</small>
          </label>
          <label>
            Komisi Affiliate (AMS) (%)
            <input type="number" min="0" max="100" step="0.01"
              value={affiliate} onChange={e => setAffiliate(e.target.value)} style={input} required />
            <small style={help}>Isi 0% jika tidak menggunakan affiliate.</small>
          </label>
          <label>
            PPh Pasal 22
            <select value={taxRate} onChange={e => setTaxRate(e.target.value)} style={input}>
              <option value="0.5">Dipotong 0,5% (default)</option>
              <option value="0">Tidak dipotong (0%)</option>
            </select>
            <small style={help}>Default simulasi 0,5%; pilih 0% jika tidak dipotong. Dasar pajak aktual dapat berbeda.</small>
          </label>
          <label>
            Biaya Per Pesanan (Rp)
            <input type="number" min="0" max="1000000000" step="1"
              value={orderFee} onChange={e => setOrderFee(e.target.value)} style={input} required />
            <small style={help}>Nilai awal Rp1.250, dibagi jumlah unit dalam pesanan.</small>
          </label>
        </div>
        <div style={{
          marginTop: 22, background: '#081b2a', border: '1px solid #36536b',
          borderRadius: 12, padding: 18, display: 'grid', gap: 13
        }}>
          <strong>Ringkasan Biaya Produk Baru</strong>
          <div style={grid}>
            <div>
              <small style={help}>Total persentase potongan</small>
              <strong>{percentTotal.toLocaleString('id-ID')}%</strong>
            </div>
            <div>
              <small style={help}>Estimasi marketplace / unit</small>
              <strong>{rupiah(calculatedFee)}</strong>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={manual}
              onChange={e => {
                setManual(e.target.checked)
                if (e.target.checked) setManualFee(String(calculatedFee))
              }} />
            Ubah total biaya marketplace secara manual
          </label>
          <label>
            Total Biaya Marketplace yang Disimpan / Unit (Rp)
            <input name="marketplace_fee" type="number" min="0"
              max="1000000000" step="1" required
              value={manual ? manualFee : calculatedFee}
              onChange={e => setManualFee(e.target.value)}
              readOnly={!manual} style={input} />
            <small style={help}>
              Rincian tarif saat ini belum disimpan ke database; yang disimpan
              adalah total biaya marketplace per unit.
            </small>
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span>Estimasi Profit / Unit</span>
            <strong style={{ color: profit >= 0 ? '#54e3ac' : '#ff9696', fontSize: 20 }}>
              {rupiah(profit)} ({margin.toFixed(1)}%)
            </strong>
          </div>
        </div>
      </section>
      <div style={{ ...card, padding: 16 }}>
        <SubmitButton />
      </div>
    </form>
  )
}
