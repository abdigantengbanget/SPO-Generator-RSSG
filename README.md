# SPO Generator - RS Semen Gresik / PT Cipta Nirmala

Aplikasi generator dokumen Standar Prosedur Operasional (SPO) rumah sakit berbasis **React + TypeScript + Tailwind CSS** dan **Node.js Express** dengan editor diagram alur (_swimlane_) dan ekspor Microsoft Word (`.docx`).

---

## Cara Menjalankan di Localhost (VS Code)

### 1. Prasyarat

- **Node.js** versi 20 LTS atau 22 LTS.

### 2. Instalasi Dependensi

Buka folder proyek di terminal VS Code, lalu jalankan:

```bash
npm install
```

### 3. Konfigurasi API Key Gemini (`.env`)

Buat file `.env` di root folder proyek (sejajar dengan `package.json`), lalu isi dengan API Key Gemini Anda:

```env
GEMINI_API_KEY="MASUKKAN_API_KEY_GEMINI_ANDA"
PORT=3000
```

> File `.env` otomatis diabaikan oleh `.gitignore` agar aman dan tidak ikut ter-upload ke GitHub.

### 4. Menjalankan Server Aplikasi

```bash
npm run dev
```

Lalu buka **`http://localhost:3000`** di browser.

---

## Deploy ke Vercel

1. Push proyek ke repository GitHub Anda.
2. Import repository tersebut di **Vercel** (`Framework Preset: Vite`, `Build Command: npm run build`, `Output Directory: dist`).
3. Tambahkan Environment Variable **`GEMINI_API_KEY`** di pengaturan proyek Vercel.
4. Klik **Deploy**.

---

## Ringkasan Script

- `npm run dev` : Menjalankan server development full-stack (`http://localhost:3000`).
- `npm run build` : Compile dan bundle aplikasi frontend ke `dist/`.
- `npm run lint` : Memeriksa tipe TypeScript (`tsc --noEmit`).
