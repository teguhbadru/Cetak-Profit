
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
  // Setelan Biaya Default: nilai awal simulasi, bukan tarif resmi marketplace.
  const [storeType, setStoreType] = useState('Non Star')
  const [marketCategory, setMarketCategory] = useState('Lainnya')
  const [admin, setAdmin] = useState(9)
  const [shipping, setShipping] = useState(4.5)
  const [promo, setPromo] = useState(4.5)
  const [affiliate, setAffiliate] = useState(5)
  const [taxRate, setTaxRate] = useState(0.5)
  const [proses, setProses] = useState(1250)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [flashPrice, setFlashPrice] = useState(14000)
  const [voucherEnabled, setVoucherEnabled] = useState(false)
  const [voucherAmount, setVoucherAmount] = useState(2500)
  const [voucherMinimum, setVoucherMinimum] = useState(25000)
  const [manualFeeEnabled, setManualFeeEnabled] = useState(false)
  const [manualFeePerUnit, setManualFeePerUnit] = useState(5010)
  // Iklan dan target margin dipertahankan dari kalkulator sebelumnya.
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
    const jumlah = Math.max(1, Math.floor(qty))
    const unit = bahan + cetak + finishing + packing
    const hpp = unit * jumlah
    const invalidFlash = flashEnabled && (
      !Number.isSafeInteger(flashPrice) || flashPrice > harga || flashPrice < 0
    )
    // Harga aktual setelah Flash Sale, digunakan untuk menghitung dan menyimpan produk.
    const activePrice = flashEnabled ? flashPrice : harga
    const normalSubtotal = harga * jumlah
    const subtotal = activePrice * jumlah
    const voucherEligible = voucherEnabled && subtotal >= voucherMinimum
    const voucherApplied = voucherEligible ? Math.min(voucherAmount, subtotal) : 0
    const pendapatan = Math.max(0, subtotal - voucherApplied)

    // Simulasi: semua persentase dikenakan ke subtotal setelah Flash Sale,
    // namun sebelum voucher. Ketentuan dan dasar biaya aktual bisa berbeda.
    const percentTotal = admin + shipping + promo + affiliate + taxRate
    const automaticFee = subtotal * percentTotal / 100 + proses
    // Override opsional: total biaya marketplace + voucher (per unit).
    const combinedNonProd = manualFeeEnabled
      ? manualFeePerUnit * jumlah
      : automaticFee + voucherApplied
    const fee = combinedNonProd - voucherApplied
    const adCost = pendapatan * iklan / 100
    const profit = subtotal - hpp - combinedNonProd - adCost
    const margin = pendapatan > 0 ? profit / pendapatan * 100 : 0
    const beAcos = pendapatan > 0
      ? Math.max(0, (pendapatan - hpp - fee) / pendapatan * 100)
      : 0

    // Perkiraan harga jual efektif per unit untuk target margin.
    // Voucher diasumsikan tetap berlaku pada jumlah saat ini.
    const denominator = 1 - (percentTotal + iklan + target) / 100
    const voucherAdjustment = voucherApplied * (1 - (iklan + target) / 100)
    const rekomendasi = !manualFeeEnabled && denominator > 0
      ? Math.max(0, (hpp + proses + voucherAdjustment) / (denominator * jumlah))
      : null

    return {
      jumlah, unit, hpp, normalSubtotal, subtotal, activePrice, invalidFlash,
      percentTotal, voucherEligible, voucherApplied, pendapatan, fee, combinedNonProd, adCost,
      profit, margin, rekomendasi, beAcos
    }
  }, [harga, bahan, cetak, finishing, packing, qty, admin, shipping, promo,
    affiliate, taxRate, proses, flashEnabled, flashPrice, voucherEnabled,
    voucherAmount, voucherMinimum, manualFeeEnabled, manualFeePerUnit, iklan, target])

  // products menyimpan biaya PER UNIT dalam satu kolom marketplace_fee.
  // Termasuk biaya marketplace, iklan, dan voucher yang ditanggung seller.
  // Jumlah per unit dibulatkan, sehingga bisa berbeda sedikit dari simulasi/order.
  const allocatedFee = Math.round(
    (hasil.combinedNonProd + hasil.adCost) / hasil.jumlah
  )

  async function saveToDatabase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savingRef.current) return
    setSaveMessage('')
    setSaveSuccess(false)

    const name = productName.trim()
    const categoryName = category.trim()
    const amounts = [harga, bahan, cetak, finishing, packing, proses]
    const manualValid = !manualFeeEnabled || (Number.isSafeInteger(manualFeePerUnit) && manualFeePerUnit >= 0 && manualFeePerUnit <= 1000000000)
    const promoAmounts = (
      (!flashEnabled || (Number.isSafeInteger(flashPrice) && flashPrice <= harga && flashPrice >= 0 && flashPrice <= 1000000000)) &&
      (!voucherEnabled || (
        Number.isSafeInteger(voucherAmount) && voucherAmount >= 0 && voucherAmount <= 1000000000 &&
        Number.isSafeInteger(voucherMinimum) && voucherMinimum >= 0 && voucherMinimum <= 1000000000
      ))
    )
    const percentages = [admin, shipping, promo, affiliate, taxRate, iklan, target]
    const valid = name.length >= 2 && name.length <= 150 &&
      categoryName.length <= 100 && workspaces.some(w => w.id === workspaceId) &&
      Number.isSafeInteger(qty) && qty >= 1 && qty <= 10000 &&
      amounts.every(n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000000) &&
      promoAmounts && manualValid && !hasil.invalidFlash &&
      percentages.every(n => Number.isFinite(n) && n >= 0 && n <= 100) &&
      Number.isSafeInteger(hasil.activePrice) && hasil.activePrice <= 1000000000 &&
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
        selling_price: hasil.activePrice,
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

  const toggleStyle = {
    display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700,
    cursor: 'pointer'
  } as const
  const promoBoxStyle = {
    display: 'grid', gap: 12, background: '#071a29',
    padding: 14, borderRadius: 11, border: '1px solid #2c495d'
  } as const

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
          <span className="version">BETA v0.5</span>
        </header>
        <div className="notice">
          <strong>Simulasi biaya marketplace.</strong> Setelan tipe toko, kategori, dan persentase di bawah adalah nilai awal, bukan tarif resmi Shopee. Periksa ketentuan akun serta program yang benar-benar diikuti.
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
              <div className="panel-head"><span className="step">02</span><h2>Setelan Biaya Default</h2></div>
              <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 18 }}>
                Menggantikan Potongan Marketplace lama. Tarif bisa diedit; pilihan tipe toko dan kategori belum mengubah persentase otomatis.
              </p>
              <div className="fields">
                <label className="field">
                  <span>Tipe Toko</span>
                  <select value={storeType} onChange={e => setStoreType(e.target.value)} style={selectStyle}>
                    <option>Non Star</option>
                    <option>Star / Star Plus</option>
                    <option>Shopee Mall</option>
                  </select>
                </label>
                <label className="field">
                  <span>Kategori Shopee</span>
                  <select value={marketCategory} onChange={e => setMarketCategory(e.target.value)} style={selectStyle}>
                    {[
                      'Lainnya', 'Label & Stiker', 'Buku & Alat Tulis',
                      'Percetakan & Grafika', 'Kemasan & Packaging',
                      'Poster & Dekorasi', 'Ibu & Bayi', 'Makanan & Minuman',
                      'Perlengkapan Rumah', 'Fashion', 'Kesehatan & Kecantikan',
                      'Elektronik', 'Hobi & Koleksi'
                    ].map(item => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <Field label="Biaya Admin" value={admin} onChange={setAdmin} suffix="%" />
                <Field label="Gratis Ongkir XTRA" value={shipping} onChange={setShipping} suffix="%" />
                <Field label="Promo XTRA" value={promo} onChange={setPromo} suffix="%" />
                <Field label="Komisi Affiliate (AMS)" value={affiliate} onChange={setAffiliate} suffix="%" />
                <label className="field">
                  <span>PPh Pasal 22</span>
                  <select value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} style={selectStyle}>
                    <option value={0.5}>Dipotong 0,5%</option>
                    <option value={0}>Tidak dipotong (0%)</option>
                  </select>
                </label>
                <Field label="Biaya per Pesanan" value={proses} onChange={setProses} />
              </div>
              <h3 style={{ marginTop: 22, marginBottom: 12, fontSize: 15 }}>Flash Sale &amp; Voucher Toko</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={promoBoxStyle}>
                  <label style={toggleStyle}>
                    <input type="checkbox" checked={flashEnabled} onChange={e => setFlashEnabled(e.target.checked)} />
                    Aktifkan Flash Sale
                  </label>
                  <Field label="Harga Flash Sale per unit" value={flashPrice} onChange={setFlashPrice} />
                  <small className="muted" style={{ fontSize: 12 }}>
                    Harga aktif: {rupiah(hasil.activePrice)} / unit. Flash Sale menggantikan harga normal saat menghitung profit.
                  </small>
                  {hasil.invalidFlash && (
                    <span role="alert" style={{ color: '#ffb4b4', fontSize: 12 }}>
                      Harga Flash Sale tidak boleh lebih besar dari harga normal.
                    </span>
                  )}
                </div>
                <div style={promoBoxStyle}>
                  <label style={toggleStyle}>
                    <input type="checkbox" checked={voucherEnabled} onChange={e => setVoucherEnabled(e.target.checked)} />
                    Aktifkan Voucher Toko
                  </label>
                  <Field label="Nominal voucher per pesanan" value={voucherAmount} onChange={setVoucherAmount} />
                  <Field label="Minimum belanja untuk voucher" value={voucherMinimum} onChange={setVoucherMinimum} />
                  {voucherEnabled && !hasil.voucherEligible && (
                    <small style={{ color: '#ffcb8b', fontSize: 12 }}>
                      Voucher belum berlaku karena subtotal masih di bawah {rupiah(voucherMinimum)}.
                    </small>
                  )}
                </div>
              </div>
              <div style={{ ...promoBoxStyle, marginTop: 12 }}>
                <label style={toggleStyle}>
                  <input type="checkbox" checked={manualFeeEnabled} onChange={e => {
                    setManualFeeEnabled(e.target.checked)
                    if (e.target.checked) setManualFeePerUnit(Math.round(hasil.combinedNonProd / hasil.jumlah))
                  }} />
                  Ubah manual total biaya marketplace + voucher per unit
                </label>
                {manualFeeEnabled && (
                  <Field label="Total biaya nonproduksi manual / unit" value={manualFeePerUnit} onChange={setManualFeePerUnit} />
                )}
                <small className="muted" style={{ fontSize: 12 }}>
                  Override ini menggantikan potongan marketplace dan voucher dalam profit, tetapi biaya iklan tetap dihitung terpisah.
                </small>
              </div>
              <div className="disclaimer" style={{ marginTop: 14 }}>
                Total tarif persentase: <strong>{hasil.percentTotal.toLocaleString('id-ID')}%</strong>.
                Flash Sale mengubah harga jual, voucher mengurangi pendapatan penjualan, dan biaya per pesanan dihitung satu kali tiap order.
                Semua angka adalah estimasi, belum tersimpan sebagai preset permanen per workspace.
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
              {hasil.invalidFlash && <p role="alert" style={{ color: '#ffb4b4' }}>
                Perbaiki harga Flash Sale sebelum menyimpan produk.
              </p>}
              <div className="profit-card">
                <span>Estimasi profit bersih</span>
                <strong className={hasil.profit >= 0 ? 'positive' : 'negative'}>{rupiah(hasil.profit)}</strong>
                <small className={hasil.profit >= 0 ? 'positive' : 'negative'}>{hasil.margin.toFixed(1)}% margin dari pendapatan bersih</small>
              </div>
              <div className="breakdown">
                {flashEnabled && <div><span>Subtotal harga normal</span><strong>{rupiah(hasil.normalSubtotal)}</strong></div>}
                <div><span>Subtotal setelah Flash Sale</span><strong>{rupiah(hasil.subtotal)}</strong></div>
                <div><span>Pendapatan setelah voucher (informasi)</span><strong>{rupiah(hasil.pendapatan)}</strong></div>
                <div><span>HPP produksi</span><strong>− {rupiah(hasil.hpp)}</strong></div>
                {manualFeeEnabled ? (
                  <div><span>Marketplace + voucher (manual)</span><strong>− {rupiah(hasil.combinedNonProd)}</strong></div>
                ) : (
                  <>
                    {hasil.voucherApplied > 0 && <div><span>Voucher toko</span><strong>− {rupiah(hasil.voucherApplied)}</strong></div>}
                    <div><span>Potongan marketplace (termasuk PPh 22)</span><strong>− {rupiah(hasil.fee)}</strong></div>
                  </>
                )}
                <div><span>Estimasi biaya iklan</span><strong>− {rupiah(hasil.adCost)}</strong></div>
              </div>
              <div className="metrics">
                <div><small>Break-even ACOS</small><strong>{hasil.beAcos.toFixed(1)}%</strong></div>
                <div><small>Harga jual target / unit</small><strong>{hasil.rekomendasi === null ? 'Tidak tercapai' : rupiah(Math.ceil(hasil.rekomendasi))}</strong></div>
              </div>
              <p className="disclaimer">Harga target adalah perkiraan harga jual efektif per unit (tidak tersedia bila override manual aktif), dengan nominal voucher saat ini dianggap tetap. Dasar biaya dan pajak yang sebenarnya dapat berbeda; minimum voucher dan batas maksimal program belum dimodelkan penuh.</p>
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
                    Tersimpan per unit: harga efektif {rupiah(hasil.activePrice)}, HPP {rupiah(hasil.unit)}, alokasi biaya nonproduksi {rupiah(allocatedFee)}.
                    Alokasi mencakup marketplace, iklan, dan voucher toko. Rincian promosi serta tipe toko belum tersimpan terpisah, dan angka dibulatkan per unit.
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
        <footer>Cetakprofit © 2026 • Tarif simulasi dapat disesuaikan • Penyimpanan produk memerlukan login seller.</footer>
      </section>
    </main>
  )
}
