
'use client'

import { useState, type CSSProperties } from 'react'
import { useFormStatus } from 'react-dom'

type Workspace = { id: string; name: string }
type Props = {
  workspaces: Workspace[]
  saveAction: (formData: FormData) => Promise<void>
}

const rupiah = (value: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0
}).format(value)

const input: CSSProperties = {
  display: 'block', width: '100%', minWidth: 0, boxSizing: 'border-box',
  padding: 12, marginTop: 7, background: '#081b2a',
  border: '1px solid #36536b', borderRadius: 8, color: 'white'
}

const card: CSSProperties = {
  background: '#112b40', border: '1px solid #28465d',
  borderRadius: 14, padding: 24, marginBottom: 20
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending || disabled} style={{
      width: '100%', padding: 15, border: 0, borderRadius: 8,
      background: pending || disabled ? '#506e83' : '#2581b8',
      color: '#fff', fontWeight: 700,
      cursor: pending || disabled ? 'not-allowed' : 'pointer'
    }}>
      {pending ? 'Menyimpan...' : 'Simpan Produk ke Database'}
    </button>
  )
}

export default function FeeForm({ workspaces, saveAction }: Props) {
  const [price, setPrice] = useState('16000')
  const [cost, setCost] = useState('6650')
  const [fee, setFee] = useState('5010')

  const validNumber = (value: string) => /^\d+$/.test(value) &&
    Number.isSafeInteger(Number(value)) && Number(value) <= 1000000000
  const valid = validNumber(price) && validNumber(cost) && validNumber(fee) &&
    workspaces.length > 0
  const profit = Number(price || 0) - Number(cost || 0) - Number(fee || 0)
  const margin = Number(price) > 0 ? profit / Number(price) * 100 : 0

  return (
    <form action={saveAction}>
      <section style={card}>
        <h2 style={{ margin: '0 0 10px' }}>Tambah Produk Baru</h2>
        <p style={{ color: '#a1bccc', fontSize: 13, lineHeight: 1.6 }}>
          Setelan tarif marketplace sudah dipindah ke Kalkulator Profit.
          Untuk hitung potongan otomatis termasuk Flash Sale dan Voucher Toko,
          gunakan kalkulator lalu klik Simpan sebagai Produk Baru.
          Di sini kamu tetap bisa menambahkan produk secara manual.
        </p>
        <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
          <label>
            Workspace
            <select name="workspace_id" required style={input}>
              {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>
          <label>
            Nama Produk
            <input name="name" required maxLength={150}
              placeholder="Contoh: Stiker Vinyl A3+" style={input} />
          </label>
          <label>
            Kategori Produk
            <input name="category" maxLength={100}
              defaultValue="Label & Stiker" style={input} />
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16
          }}>
            <label>
              Harga Jual / Unit (Rp)
              <input type="number" name="selling_price" min="0"
                max="1000000000" step="1" required
                value={price} onChange={e => setPrice(e.target.value)} style={input}/>
            </label>
            <label>
              HPP Produksi / Unit (Rp)
              <input type="number" name="production_cost" min="0"
                max="1000000000" step="1" required
                value={cost} onChange={e => setCost(e.target.value)} style={input}/>
            </label>
            <label>
              Total Biaya Nonproduksi / Unit (Rp)
              <input type="number" name="marketplace_fee" min="0"
                max="1000000000" step="1" required
                value={fee} onChange={e => setFee(e.target.value)} style={input}/>
            </label>
          </div>
          <div style={{
            padding: 16, border: '1px solid #36536b',
            borderRadius: 10, background: '#081b2a'
          }}>
            <p style={{ marginTop: 0 }}>Estimasi Profit / Unit</p>
            <strong style={{ color: profit >= 0 ? '#54e3ac' : '#ff9696', fontSize: 22 }}>
              {valid ? `${rupiah(profit)} (${margin.toFixed(1)}%)` : 'Periksa angka biaya'}
            </strong>
            <p style={{ marginBottom: 0, fontSize: 12, color: '#a1bccc' }}>
              Perhitungan manual. Untuk potongan otomatis, gunakan halaman Kalkulator.
            </p>
          </div>
          <SubmitButton disabled={!valid}/>
        </div>
      </section>
    </form>
  )
}
