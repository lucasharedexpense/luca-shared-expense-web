# Troubleshooting Receipt Scan

## Error: "fetch failed" saat upload image

### Penyebab Umum:

1. **Server Next.js belum direstart setelah menambahkan environment variables**
   - Environment variables hanya di-load saat server start
   - Solusi: Stop server (Ctrl+C) dan jalankan `npm run dev` lagi

2. **Hugging Face Space sedang sleep/loading**
   - Free tier Hugging Face Spaces akan sleep setelah tidak digunakan
   - Model perlu beberapa menit untuk "wake up"
   - Solusi: 
     - Coba lagi setelah 1-2 menit
     - Kunjungi URL: https://lucashared-luca-shared-expense.hf.space untuk wake up space

3. **Masalah network/internet connection**
   - Solusi: Check koneksi internet Anda

4. **API Token expired atau invalid**
   - Solusi: Generate token baru dari Hugging Face

### Langkah-langkah Pengecekan:

1. **Pastikan .env.local sudah benar:**
   ```bash
   # Check file exists
   ls .env.local
   
   # Pastikan ada HF_API_URL dan HF_API_TOKEN
   cat .env.local
   ```

2. **Restart development server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then start again
   npm run dev
   ```

3. **Check terminal logs:**
   - Setelah upload, lihat terminal yang menjalankan `npm run dev`
   - Look for `[Server Action]` logs untuk detail error

4. **Test Hugging Face Space:**
   - Buka browser: https://lucashared-luca-shared-expense.hf.space
   - Pastikan space sedang running (tidak ada "Building" atau "Sleeping")

### Error Messages dan Solusinya:

- **"API configuration missing"**
  → Restart server dengan `npm run dev`

- **"AI service is currently sleeping"** 
  → Wait 1-2 minutes, try again

- **"Network error: Unable to reach AI service"**
  → Check internet connection

- **"Request timeout"**
  → Try with smaller image or wait for space to fully load

### Jika masih error:

1. Check console browser (F12) untuk detail error
2. Check terminal server untuk `[Server Action]` logs
3. Try dengan image yang lebih kecil (< 2MB)
4. Pastikan format image: JPG, PNG, atau JPEG
