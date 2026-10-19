'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createClient } from '../lib/supabase/browser'

const rupiah = (number: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0
}).format(number)
const clean = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0

type Workspace = { id: string; name: string }
type AccountStatus = 'loading' | 'guest' | 'ready' | 'error'

function Field({ label, value, onChange, suffix }: {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="field-input">
        <input type="number" min="0" value={value}
          onChange={event => onChange(clean(Number(event.target.value)))} />
        <span>{suffix ?? 'Rp'}</span>
      </div>
    </label>
  )
}

export default function Home() {
  const supabase = useMemo(() => createClient(), [])
  const savingRef = useRef(false)

  const [harga, setHarga] = useState(16000)
  const [bahan, setBahan] = useState(5000)
  const [cetak, setCetak] = useState(800)
  const [finishing, setFinishing] = useState(500)
  const [packing, setPacking] = useState(350)
  const [qty, setQty] = useState(1)
  const [admin, setAdmin] = useState(10)
  const [program, setProgram] = useState(5)
  const [proses, setProses] = useState(1250)
  const [diskon, setDiskon] = useState(0)
  const [iklan, setIklan] = useState(0)
  const [target, setTarget] = useState(20)

  const [accountStatus, setAccountStatus] = useState<AccountStatus>('loading')
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [workspaceId, setWorkspaceId] = useState('')
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('Label & Stiker')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    let active = true
    async function loadWorkspaces() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (!active) return
        if (userError || !user) {
          setAccountStatus('guest')
          return
        }

        const { data, error } = await supabase
          .from('workspaces')
          .select('id, name')
          .order('created_at', { ascending: false })

        if (!active) return
        if (error) {
          setAccountStatus('error')
          return
        }
        const available = (data ?? []) as Workspace[]
        setWorkspaces(available)
        setWorkspaceId(available[0]?.id ?? '')
        setAccountStatus('ready')
      } catch {
        if (active) setAccountStatus('error')
      }
    }
    void loadWorkspaces()
    return () => { active = false }
  }, [supabase])

  const hasil = useMemo(() => {
    const unit = bahan + cetak + finishing + packing
    const jumlah = Math.max(1, Math.floor(qty))
    const hpp = unit * jumlah
    const subtotal = harga * jumlah
    const pendapatan = Math.max(0, subtotal - diskon)
    // Nilai contoh, bukan tarif resmi Shopee.
    const fee = pendapatan * (admin + program) / 100 + proses
    const adCost = pendapatan * iklan / 100
    const profit = pendapatan - hpp - fee - adCost
    const margin = pendapatan > 0 ? profit / pendapatan * 100 : 0
    const variableRate = (admin + program + iklan) / 100
    const targetRate = target / 100
    const minimal = 1 - variableRate - targetRate
    const rekomendasi = minimal > 0
      ? (hpp + proses + diskon * (1 - variableRate)) / (minimal * jumlah)
      : null
    const beAcos = pendapatan > 0
      ? Math.max(0, (pendapatan - hpp - fee) / pendapatan * 100)
      : 0
    return { unit, jumlah, hpp, subtotal, pendapatan, fee, adCost, profit, margin, rekomendasi, beAcos }
  }, [harga, bahan, cetak, finishing, packing, qty, admin, program, proses, diskon, iklan, target])

  // Tabel products sekarang hanya punya satu kolom biaya non-produksi.
  // Alokasikan fee, iklan, dan diskon seller per unit agar profit katalog
  // mendekati profit simulasi (perbedaan pembulatan maks. ~Rp0,5 per unit).
  const allocatedFee = Math.round((hasil.fee + hasil.adCost + diskon) / hasil.jumlah)

  async function saveToDatabase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return
    setSaveMessage('')
    setSaveSuccess(false)

    const name = productName.trim()
    const categoryName = category.trim()
    const amounts = [harga, bahan, cetak, finishing, packing, proses, diskon]
    const percentages = [admin, program, iklan, target]
    const valid = name.length >= 2 && name.length <= 150 &&
      categoryName.length <= 100 && workspaces.some(w => w.id === workspaceId) &&
      Number.isSafeInteger(qty) && qty >= 1 && qty <= 10000 &&
      amounts.every(n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000000) &&
      percentages.every(n => Number.isFinite(n) && n >= 0 && n <= 100) &&
      Number.isSafeInteger(hasil.unit) && hasil.unit <= 1000000000 &&
      Number.isSafeInteger(allocatedFee) && allocatedFee >= 0 && allocatedFee <= 1000000000

    if (!valid) {
      setSaveMessage('Periksa nama produk, workspace, jumlah, dan angka biaya sebelum menyimpan.')
      return
    }

    savingRef.current = true
    setSaving(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setAccountStatus('guest')
        setSaveMessage('Sesi login habis. Silakan login kembali.')
        return
      }
      // Akses juga wajib lolos RLS pada tabel products.
      const { error } = await supabase.from('products').insert({
        workspace_id: workspaceId,
        name,
        category: categoryName || null,
        selling_price: harga,
        production_cost: hasil.unit,
        marketplace_fee: allocatedFee
      })
      if (error) {
        setSaveMessage('Produk gagal disimpan: ' + error.message)
        return
      }
      setSaveSuccess(true)
      setSaveMessage('Produk berhasil disimpan ke Database Produk!')
    } catch {
      setSaveMessage('Ada gangguan koneksi. Coba lagi.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const selectStyle = {
    width: '100%', padding: 12, borderRadius: 9, background: '#071a29',
    border: '1px solid #2c495d', color: 'white'
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">C</span>
          <div><strong>Cetak<span>profit</span></strong><small>Seller Profit Tools</small></div>
        </div>
        <div className="nav-title">MENU UTAMA</div>
        <div className="nav active">▦ &nbsp; Kalkulator Profit</div>
        <Link className="nav" href="/products" style={{ textDecoration: 'none' }}>▤ &nbsp; Database Produk</Link>
        <Link className="nav" href="/dashboard" style={{ textDecoration: 'none' }}>♧ &nbsp; Dashboard Seller</Link>
        <div className="nav disabled">⚙ &nbsp; Pengaturan Toko <em>Segera</em></div>
        <div className="aside-note">Simulasi tetap bisa digunakan tanpa login. Login untuk menyimpan produk ke workspace.</div>
      </aside>
      <section className="main">
        <header>
          <div>
            <p className="eyebrow">CETAKPROFIT / KALKULATOR</p>
            <h1>Hitung Profit Percetakan</h1>
            <p className="muted">Simulasikan HPP dan biaya marketplace sebelum menentukan harga jual.</p>
          </div>
          <span className="version">BETA v0.2</span>
        </header>
        <div className="notice">
          <strong>Tarif di bawah hanya simulasi.</strong> Angka administrasi, program, dan biaya proses bukan tarif resmi Shopee. Sesuaikan dengan biaya aktual toko Anda.
        </div>
        <div className="content-grid">
          <div className="forms">
            <section className="panel">
              <div className="panel-head"><span className="step">01</span><h2>Harga & Produksi</h2></div>
              <div className="fields">
                <Field label="Harga jual per unit" value={harga} onChange={setHarga} />
                <Field label="Jumlah unit dalam pesanan" value={qty} onChange={setQty} suffix="unit" />
                <Field label="Biaya bahan per unit" value={bahan} onChange={setBahan} />
                <Field label="Biaya cetak per unit" value={cetak} onChange={setCetak} />
                <Field label="Finishing per unit" value={finishing} onChange={setFinishing} />
                <Field label="Packing per unit" value={packing} onChange={setPacking} />
              </div>
            </section>
            <section className="panel">
              <div className="panel-head"><span className="step">02</span><h2>Potongan Marketplace</h2></div>
              <div className="fields">
                <Field label="Biaya admin" value={admin} onChange={setAdmin} suffix="%" />
                <Field label="Program tambahan" value={program} onChange={setProgram} suffix="%" />
                <Field label="Biaya proses per order" value={proses} onChange={setProses} />
                <Field label="Diskon seller per order" value={diskon} onChange={setDiskon} />
              </div>
            </section>
            <section className="panel">
              <div className="panel-head"><span className="step">03</span><h2>Iklan & Target Margin</h2></div>
              <div className="fields">
                <Field label="Biaya iklan (ACOS)" value={iklan} onChange={setIklan} suffix="%" />
                <Field label="Target margin bersih" value={target} onChange={setTarget} suffix="%" />
              </div>
            </section>
          </div>
          <div className="result-col">
            <section className="panel results">
              <p className="eyebrow">RINGKASAN HASIL / ORDER</p>
              <div className="profit-card">
                <span>Estimasi profit bersih</span>
                <strong className={hasil.profit >= 0 ? 'positive' : 'negative'}>{rupiah(hasil.profit)}</strong>
                <small className={hasil.profit >= 0 ? 'positive' : 'negative'}>{hasil.margin.toFixed(1)}% margin dari pendapatan bersih</small>
              </div>
              <div className="breakdown">
                <div><span>Subtotal penjualan</span><strong>{rupiah(hasil.subtotal)}</strong></div>
                <div><span>Pendapatan setelah diskon</span><strong>{rupiah(hasil.pendapatan)}</strong></div>
                <div><span>HPP produksi</span><strong>− {rupiah(hasil.hpp)}</strong></div>
                <div><span>Potongan marketplace</span><strong>− {rupiah(hasil.fee)}</strong></div>
                <div><span>Estimasi biaya iklan</span><strong>− {rupiah(hasil.adCost)}</strong></div>
              </div>
              <div className="metrics">
                <div><small>Break-even ACOS</small><strong>{hasil.beAcos.toFixed(1)}%</strong></div>
                <div><small>Harga jual target / unit</small><strong>{hasil.rekomendasi === null ? 'Tidak tercapai' : rupiah(Math.ceil(hasil.rekomendasi))}</strong></div>
              </div>
              <p className="disclaimer">Harga rekomendasi adalah pendekatan sederhana untuk struktur tarif persentase tanpa batas maksimum. Belum memperhitungkan pajak khusus atau ongkir seller.</p>
            </section>
            <section className="panel" style={{ marginTop: 18 }}>
              <div className="panel-head"><span className="step">04</span><h2>Simpan Hasil ke Database</h2></div>
              {accountStatus === 'loading' && <p className="muted">Memeriksa akun seller...</p>}
              {accountStatus === 'guest' && <p className="muted">Untuk menyimpan produk, <Link href="/login" style={{ color: '#67e7b4' }}>login sebagai seller</Link> terlebih dahulu.</p>}
              {accountStatus === 'error' && <p className="muted">Gagal membaca workspace. Refresh halaman atau coba login ulang.</p>}
              {accountStatus === 'ready' && workspaces.length === 0 && <p className="muted">Belum ada workspace. <Link href="/dashboard" style={{ color: '#67e7b4' }}>Buat workspace di Dashboard</Link> dahulu.</p>}
              {accountStatus === 'ready' && workspaces.length > 0 && (
                <form onSubmit={saveToDatabase} style={{ display: 'grid', gap: 14 }}>
                  <label className="field">
                    <span>Workspace</span>
                    <select value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} required style={selectStyle}>
                      {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Nama produk</span>
                    <div className="field-input"><input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Contoh: Stiker Vinyl A3+" maxLength={150} minLength={2} required /></div>
                  </label>
                  <label className="field">
                    <span>Kategori</span>
                    <div className="field-input"><input value={category} onChange={e => setCategory(e.target.value)} maxLength={100} /></div>
                  </label>
                  <div className="disclaimer" style={{ margin: 0 }}>
                    Tersimpan per unit: harga {rupiah(harga)}, HPP {rupiah(hasil.unit)}, alokasi biaya nonproduksi {rupiah(allocatedFee)}.
                    Alokasi terakhir mencakup potongan marketplace, iklan, dan diskon seller; disatukan sementara dalam kolom biaya marketplace produk. Angka dibulatkan per unit. Rincian simulasi belum tersimpan.
                  </div>
                  <button type="submit" disabled={saving} style={{ padding: 13, color: 'white', fontWeight: 700, border: 0, borderRadius: 9, background: saving ? '#466274' : '#2581b8', cursor: saving ? 'wait' : 'pointer' }}>
                    {saving ? 'Menyimpan...' : 'Simpan sebagai Produk Baru'}
                  </button>
                  {saveMessage && <p role="status" style={{ color: saveSuccess ? '#67e7b4' : '#ffaaaa', fontSize: 13, margin: 0 }}>{saveMessage}</p>}
                  {saveSuccess && <Link href="/products" style={{ color: '#67e7b4', fontSize: 13 }}>Lihat Database Produk →</Link>}
                </form>
              )}
            </section>
          </div>
        </div>
        <footer>Cetakprofit © 2026 • Simulasi dengan tarif contoh • Penyimpanan memerlukan login seller.</footer>
      </section>
    </main>
  )
}
