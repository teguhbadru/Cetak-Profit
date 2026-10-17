'use client';

import { useMemo, useState } from 'react';

const rupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
const clean = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;

function Field({ label, value, onChange, suffix }: { label: string; value: number; onChange: (value: number) => void; suffix?: string }) {
  return <label className="field"><span>{label}</span><div className="field-input"><input type="number" min="0" value={value} onChange={(event) => onChange(clean(Number(event.target.value)))} /><span>{suffix ?? 'Rp'}</span></div></label>;
}

export default function Home() {
  const [harga, setHarga] = useState(16000);
  const [bahan, setBahan] = useState(5000);
  const [cetak, setCetak] = useState(800);
  const [finishing, setFinishing] = useState(500);
  const [packing, setPacking] = useState(350);
  const [qty, setQty] = useState(1);
  const [admin, setAdmin] = useState(10);
  const [program, setProgram] = useState(5);
  const [proses, setProses] = useState(1250);
  const [diskon, setDiskon] = useState(0);
  const [iklan, setIklan] = useState(0);
  const [target, setTarget] = useState(20);

  const hasil = useMemo(() => {
    const unit = bahan + cetak + finishing + packing;
    const jumlah = Math.max(1, Math.floor(qty));
    const hpp = unit * jumlah;
    const subtotal = harga * jumlah;
    const pendapatan = Math.max(0, subtotal - diskon);
    // TARIF CONTOH; bukan tarif resmi Shopee. Sesuaikan dengan biaya toko sebenarnya.
    const fee = pendapatan * (admin + program) / 100 + proses;
    const adCost = pendapatan * iklan / 100;
    const profit = pendapatan - hpp - fee - adCost;
    const margin = pendapatan > 0 ? profit / pendapatan * 100 : 0;
    const variableRate = (admin + program + iklan) / 100;
    const targetRate = target / 100;
    const minimal = 1 - variableRate - targetRate;
    const rekomendasi = minimal > 0 ? (hpp + proses + diskon * (1 - variableRate)) / (minimal * jumlah) : null;
    const beAcos = pendapatan > 0 ? Math.max(0, (pendapatan - hpp - fee) / pendapatan * 100) : 0;
    return { hpp, subtotal, pendapatan, fee, adCost, profit, margin, rekomendasi, beAcos };
  }, [harga, bahan, cetak, finishing, packing, qty, admin, program, proses, diskon, iklan, target]);

  return <main className="app">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">C</span><div><strong>Cetak<span>profit</span></strong><small>Seller Profit Tools</small></div></div>
      <div className="nav-title">MENU UTAMA</div><div className="nav active">▦ &nbsp; Kalkulator Profit</div>
      <div className="nav disabled">▤ &nbsp; Database Produk <em>Segera</em></div>
      <div className="nav disabled">♧ &nbsp; Dashboard Seller <em>Segera</em></div>
      <div className="nav disabled">⚙ &nbsp; Pengaturan Toko <em>Segera</em></div>
      <div className="aside-note">Versi awal tanpa login dan database. Tahap berikutnya: akun seller & penyimpanan cloud.</div>
    </aside>
    <section className="main">
      <header><div><p className="eyebrow">CETAKPROFIT / KALKULATOR</p><h1>Hitung Profit Percetakan</h1><p className="muted">Simulasikan HPP dan biaya marketplace sebelum menentukan harga jual.</p></div><span className="version">BETA v0.1</span></header>
      <div className="notice"><strong>Tarif di bawah hanya simulasi.</strong> Angka administrasi, program, dan biaya proses bukan klaim tarif resmi Shopee. Sesuaikan dengan biaya aktual toko Anda.</div>
      <div className="content-grid">
        <div className="forms">
          <section className="panel"><div className="panel-head"><span className="step">01</span><h2>Harga & Produksi</h2></div><div className="fields"><Field label="Harga jual per unit" value={harga} onChange={setHarga}/><Field label="Jumlah unit dalam pesanan" value={qty} onChange={setQty} suffix="unit"/><Field label="Biaya bahan per unit" value={bahan} onChange={setBahan}/><Field label="Biaya cetak per unit" value={cetak} onChange={setCetak}/><Field label="Finishing per unit" value={finishing} onChange={setFinishing}/><Field label="Packing per unit" value={packing} onChange={setPacking}/></div></section>
          <section className="panel"><div className="panel-head"><span className="step">02</span><h2>Potongan Marketplace</h2></div><div className="fields"><Field label="Biaya admin" value={admin} onChange={setAdmin} suffix="%"/><Field label="Program tambahan" value={program} onChange={setProgram} suffix="%"/><Field label="Biaya proses per order" value={proses} onChange={setProses}/><Field label="Diskon seller per order" value={diskon} onChange={setDiskon}/></div></section>
          <section className="panel"><div className="panel-head"><span className="step">03</span><h2>Iklan & Target Margin</h2></div><div className="fields"><Field label="Biaya iklan (ACOS)" value={iklan} onChange={setIklan} suffix="%"/><Field label="Target margin bersih" value={target} onChange={setTarget} suffix="%"/></div></section>
        </div>
        <div className="result-col"><section className="panel results"><p className="eyebrow">RINGKASAN HASIL / ORDER</p><div className="profit-card"><span>Estimasi profit bersih</span><strong className={hasil.profit >= 0 ? 'positive' : 'negative'}>{rupiah(hasil.profit)}</strong><small className={hasil.profit >= 0 ? 'positive' : 'negative'}>{hasil.margin.toFixed(1)}% margin dari pendapatan bersih</small></div><div className="breakdown"><div><span>Subtotal penjualan</span><strong>{rupiah(hasil.subtotal)}</strong></div><div><span>Pendapatan setelah diskon</span><strong>{rupiah(hasil.pendapatan)}</strong></div><div><span>HPP produksi</span><strong>− {rupiah(hasil.hpp)}</strong></div><div><span>Potongan marketplace</span><strong>− {rupiah(hasil.fee)}</strong></div><div><span>Estimasi biaya iklan</span><strong>− {rupiah(hasil.adCost)}</strong></div></div><div className="metrics"><div><small>Break-even ACOS</small><strong>{hasil.beAcos.toFixed(1)}%</strong></div><div><small>Harga jual target / unit</small><strong>{hasil.rekomendasi === null ? 'Tidak tercapai' : rupiah(Math.ceil(hasil.rekomendasi))}</strong></div></div><p className="disclaimer">Harga rekomendasi adalah pendekatan sederhana untuk struktur tarif persentase tanpa batas maksimum. Belum memperhitungkan pajak khusus atau ongkir seller.</p></section></div>
      </div><footer>Cetakprofit © 2026 • Versi demo kalkulator • Data input tidak disimpan di server.</footer>
    </section>
  </main>;
}
