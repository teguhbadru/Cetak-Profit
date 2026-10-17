# Cetakprofit

Kalkulator HPP dan profit marketplace untuk seller percetakan. Ini proyek **baru** yang tidak menggunakan source code PrintCost lama.

## Status

Starter Next.js yang siap dideploy ke Vercel. Saat ini **belum** ada autentikasi, database, atau penyimpanan produk: semua input hanya berada di memori halaman browser. Tarif marketplace pada tampilan merupakan **angka contoh**, bukan tarif Shopee resmi.

## Jalankan lokal (opsional)

```bash
npm install
npm run dev
```

## Deploy dari GitHub

Import repository ke Vercel sebagai project Next.js; gunakan root directory `./` ketika `package.json` ada di root repository. Tidak memerlukan environment variables untuk versi awal.

## Tahap berikutnya

Tambahkan Auth, PostgreSQL cloud, isolasi tenant, model produk, dan penyimpanan simulasi, lalu lakukan pengujian keamanan sebelum dibuka untuk publik.
