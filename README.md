# Callplan (Unggul Plastik) — demo

Callplan untuk demo ke Unggul Plastik. Frontend-only (React + Vite), data dummy disimpan di browser (localStorage). Demo lama (`sales-ops-web`) tetap dipakai terpisah.

## Menu
- **Dashboard** — jumlah callplan per status, siklus berjalan / berikutnya per Hub, aktivitas terakhir
- **Master** — Product, Outlet, Salesman (referensi untuk validasi import)
- **Sales** — Pipeline (kanban), Callplan

## Callplan
1. **Import** — form: Hub, start cycle date, end cycle date + file Excel kolom `Toko | Salesman | Hari | Siklus` (format persis contoh klien; baris info `start date cycle : … | Hub : …` di atas header otomatis mengisi form). Tombol *Template* dan *Pakai contoh file* tersedia.
2. Hasilnya **callplan baru berstatus Draft** dengan ID `CP-YYYYMM-NNN`.
3. **Edit** (hanya Draft) → **Approve** → **Publish** (dikirim ke Mile Field sebagai jadwal kunjungan).
4. **Callplan yang sudah Approved/Published tidak bisa diedit.** Perubahan = import callplan baru untuk siklus berikutnya.

### Aturan validasi
| Aturan | Hasil |
|---|---|
| Siklus beririsan dengan callplan lain di Hub yang sama (Draft/Approved/Published) — **slicing** | Ditolak (import, edit tanggal, approve) |
| Siklus sama persis dengan callplan lain di Hub yang sama — **redundant** | Ditolak |
| End cycle date < start cycle date | Ditolak |
| Toko / Salesman tidak ada di master, atau beda Hub | Baris error, dilewati |
| Hari bukan Senin–Sabtu, siklus bukan weekly/biweekly | Baris error, dilewati |
| Baris duplikat (toko + salesman + hari sama) dalam file | Baris kedua error, dilewati |

Tanggal kunjungan: `weekly` = setiap hari tersebut dalam siklus; `biweekly` = minggu ke-1, 3, 5… dihitung dari start cycle date.

### Audit trail
Setiap callplan menyimpan created by/at, updated by/at, dan log aksi **Import, Edit, Approve, Publish** (siapa, kapan, keterangan perubahan).

### Akses (demo)
Hak akses hanya dari permission user: `import_callplan`, `edit_callplan`, `approve_callplan`, `publish_callplan`. Ganti user lewat menu kanan atas (Admin Sales / Sales Supervisor / Super Admin). *Reset data demo* ada di menu yang sama.

## Jalankan
```bash
npm install
npm run dev      # http://localhost:5181
npm run build    # output dist/ (base relatif, bisa di GitHub Pages)
```
