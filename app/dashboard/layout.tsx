
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function DashboardLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <div className="app">

      <aside className="sidebar">

        <Link
          href="/"
          className="brand"
          style={{
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <span className="brand-mark">C</span>
          <div>
            <strong>Cetak<span>profit</span></strong>
            <small>Seller Profit Tools</small>
          </div>
        </Link>

        <div className="nav-title">
          MENU UTAMA
        </div>

        <nav aria-label="Menu Cetakprofit">

          <Link
            href="/"
            className="nav"
            style={{
              display: 'flex',
              textDecoration: 'none'
            }}
          >
            ▦ &nbsp; Kalkulator Profit
          </Link>

          <Link
            href="/products"
            className="nav"
            style={{
              display: 'flex',
              textDecoration: 'none'
            }}
          >
            ▤ &nbsp; Database Produk
          </Link>

          <Link
            href="/dashboard"
            className="nav active"
            aria-current="page"
            style={{
              display: 'flex',
              textDecoration: 'none'
            }}
          >
            ♧ &nbsp; Dashboard Seller
          </Link>

          <div
            className="nav disabled"
            style={{ display: 'flex' }}
          >
            ⚙ &nbsp; Pengaturan Toko
            <em>Segera</em>
          </div>

        </nav>

        <div className="aside-note">
          Kelola workspace percetakan, database
          produk, dan profit toko secara online.
        </div>

      </aside>

      <div style={{
        flex: 1,
        minWidth: 0
      }}>
        {children}
      </div>

    </div>
  )
}
