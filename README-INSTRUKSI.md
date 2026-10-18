# Cetakprofit - Tambahan login Supabase (Next.js 15)

Jangan mengunggah file .env atau secret. File di ZIP ini merupakan tambahan ke repository yang sudah ada; jangan hapus app/page.tsx, app/layout.tsx, atau app/globals.css.

1. Ubah package.json pada GitHub: tambahkan ke dependencies dua baris (pastikan koma sesuai JSON):
   "@supabase/supabase-js": "^2.57.0",
   "@supabase/ssr": "^0.6.1"
   atau gunakan versi terbaru yang kompatibel melalui npm jika melakukan development lokal.
2. Upload seluruh folder app dan lib berikut middleware.ts di root repository; pertahankan path.
3. Periksa environment variables Production di Vercel: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Jangan masukkan secret ke GitHub.
4. Di Supabase Authentication -> URL Configuration: Site URL https://cetak-profit.vercel.app dan redirect https://cetak-profit.vercel.app/auth/callback.
5. Tunggu redeploy Vercel selesai.
6. Coba /register, email konfirmasi, /login, /dashboard dan logout.

Ini implementasi autentikasi tahap awal. Belum menambahkan database/workspace per seller, fitur reset password, penanganan rate limit produk, dan pengujian RLS.
