# Firefly vs Bat untuk Cloud Task Scheduling

Website presentasi interaktif untuk mata kuliah **Strategi Optimasi Komputasi Awan**.
Dibuat dengan HTML, CSS, dan JavaScript murni. Tanpa backend, tanpa API berbayar, tanpa CDN. Semua font dan kode sudah ada di dalam proyek.

Identitas visual dan kodenya dibuat orisinal, dengan nama desain **Observatorium**: panggung 1920x1080 yang diskalakan ke layar, spine bab di tepi kiri, transisi iris dari titik klik, kartu bab, plat judul di tengah atas yang berganti tiap beat, peta topografi neon, dan dock kendali melayang. Panah kanan memajukan beat di dalam slide dulu, baru pindah slide.

## Cara menjalankan

**Langsung dari file.** Klik dua kali `index.html`. Mode `file://` memakai `public/app.bundle.js`, jadi tidak perlu server.

**Dengan server lokal.**

```bash
npm run dev        # http://localhost:4173
```

Mode `http(s)://` memuat ES module dari `src/main.js` secara langsung.

**Setelah mengubah kode di `src/`**, bangun ulang bundel untuk `file://` dan folder `dist/`:

```bash
npm run build
```

## Deploy ke GitHub Pages

1. Buat repositori, lalu unggah seluruh isi folder ini (file `.nojekyll` ikut).
2. Di GitHub: **Settings, Pages, Source: Deploy from a branch**, pilih branch `main` dan folder `/ (root)`.
3. Buka `https://<username>.github.io/<nama-repo>/`.

Semua jalur memakai alamat relatif, jadi berjalan di subfolder GitHub Pages. Folder `dist/` berisi salinan siap pakai bila ingin menyajikan folder itu saja.

## Pintasan keyboard

| Tombol | Fungsi |
| --- | --- |
| `→` atau `Spasi` | Beat atau slide berikutnya |
| `←` | Sebelumnya |
| `1` sampai `8` | Lompat ke bab |
| `P` | Mulai atau jeda simulasi |
| `S` | Maju satu langkah simulasi |
| `R` | Reset simulasi |
| `T` | Buka atau tutup kertas naskah narasi |
| `N` | Buka atau tutup catatan teknis presenter |
| `G` | Kisi semua slide |
| `F` | Layar penuh |
| `?` | Daftar pintasan |

## Isi presentasi (20 slide, 10 bagian materi)

| Bagian | Slide | Interaksi |
| --- | --- | --- |
| 1. Masalah cloud | `judul`, `masalah`, `lanskap` | Animasi tugas masuk ke VM dan lanskap pencarian |
| 2. Dasar metaheuristik | `lanskap` | Banyak pencari menghindari lembah dangkal |
| 3. Pengantar Firefly | `fa-inspirasi`, `fa-karakter`, `fa-cara` | Slider β₀, γ, α dengan peragaan gerak langsung |
| 4. Simulasi Firefly | `fa-sim` | Play, Pause, Langkah, Reset, parameter, tiga fungsi objektif, grafik konvergensi |
| 5. Pengantar Bat | `ba-inspirasi`, `ba-karakter`, `ba-cara` | Slider A₀, r₀, αA, γr |
| 6. Simulasi Bat | `ba-sim` | Kontrol yang sama dengan Firefly |
| 7. Model dan fitness | `model-fitness`, `model-persamaan` | Posisi menjadi jadwal, makespan, persamaan FA dan BA |
| 8. Penerapan di cloud | `kasus-kode`, `kasus-run` | Pindahkan tugas sendiri, lalu FA dan BA menjadwalkan beban kerja yang sama berdampingan |
| 9. Hasil eksperimen | `adu`, `eksperimen` | Adu 2D dengan posisi awal sama, 10 beban kerja dengan grafik batang |
| 10. Kesimpulan | `ringkas`, `penutup`, `pustaka` | Angka kesimpulan dihitung dari data, bukan ditulis tangan |

### Arena RTS dan medan 3D

Game Arena memakai Canvas 2D bergaya RTS dengan fog of war: hanya Town Center dan radius pandang unit yang menyingkap peta, sedangkan pulsa sonar Bat membuka area sementara. Villager memilih node emas/kayu yang terlihat berdasarkan intensitas dan tarikan Firefly yang melemah terhadap jarak. Villager membawa maksimal 10 resource lalu kembali ke Town Center untuk menyetor. Knight memakai frekuensi, loudness, pulse rate, velocity, serta sonar untuk berpatroli dan berkelompok menyerbu minion yang terdeteksi. Rekrutmen villager berbiaya 50 emas, sedangkan knight berbiaya 100 emas dan 50 kayu. Peta dapat dijelajahi dengan drag dan zoom, serta simulasi bisa dijeda atau diulang.

Pada Medan 3D, Firefly dan Bat terbang mengikuti langkah simulasi. Agen terbaik masing-masing ditandai mahkota. Dinding ruang dan batu gua menjadi tembus pandang saat kamera mendekat agar unit dan kristal tetap terlihat.

### Kertas naskah untuk presenter

Tombol berikon kertas di kanan atas (atau tombol `T`) membuka lembar kertas krem berisi **naskah yang tinggal dibaca** untuk slide aktif. Paragraf untuk beat yang sedang tampil menyala dan lembar ikut menggulir saat beat atau slide berganti.

- Seret kepala kertas untuk memindahkannya, tarik sudut kanan bawah untuk mengubah ukurannya.
- `A−` dan `A+` mengubah ukuran huruf (tersimpan di browser).
- Ikon panah keluar membuka naskah di **jendela terpisah**, cocok untuk layar presenter saat slide diproyeksikan di layar lain. Panah kiri dan kanan di jendela itu ikut memajukan slide. Jendela pop-up harus diizinkan oleh browser.
- Teks naskah ada di `src/slides/naskah.js`. Ubah sesuai gaya bicara kamu. Jumlah paragraf tiap slide harus sama dengan jumlah beat (ada tesnya).

Catatan teknis tiap slide (rumus, alasan desain) tetap ada di tombol `N`. Untuk versi teks seluruh naskah dan catatan:

```bash
npm run narasi     # menulis narasi-presentasi.md
```

## Struktur proyek

```
index.html               cangkang panggung + pemuat dua mode (file:// dan http)
public/app.bundle.js     bundel untuk file:// (dibuat oleh npm run build)
public/fonts/            Sora, Manrope, Red Hat Mono (lisensi SIL OFL)
src/main.js              titik masuk
src/ui/presenter.js      Presenter: spine, fade slide, popup Act, beat, catatan, kisi, pintasan
src/ui/script.js         ScriptPaper: kertas naskah (geser, ubah ukuran, jendela terpisah)
src/core/                random.js (PRNG ber-seed), landscapes.js (fungsi 2D), ticker.js (StepTicker)
src/algorithms/          LOGIKA MURNI tanpa DOM: firefly.js, bat.js, cloudScheduling.js
src/render/              motion.js (loop kanvas), ambient.js, heatmap.js (peta isoline), sprites, Gantt, grafik
src/slides/              frame.js (slide bercerita), console.js (konsol simulasi), lab.js (slider), naskah.js (narasi), satu berkas per bab
src/styles/              tokens, shell, frame, console, panels, fonts
scripts/                 build (esbuild), serve, run-tests, export-narasi, generate-fonts-css
tests/                   tes Node (algoritma, cloud, struktur) dan E2E Playwright
```

Mengubah kode di `src/` membutuhkan `npm install` sekali (untuk esbuild), lalu `npm run build`. Menjalankan presentasi dan tes Node tidak membutuhkan paket apa pun.

## Pengujian

```bash
npm test                          # 30 tes Node, tanpa dependensi
node tests/e2e/walk.mjs file      # tangkapan layar tiap slide dan beat, melaporkan error konsol
node tests/e2e/interact.mjs file  # klik tombol sungguhan di tiap simulasi (juga: http)
```

Dua skrip E2E membutuhkan `playwright`. Tes Node memeriksa urutan fase FA dan BA, best tidak pernah memburuk, anggaran evaluasi yang sama, populasi awal bersama, serta tidak adanya URL eksternal dan API browser di `src/algorithms`.

## Model dan keadilan perbandingan

- Tugas independen dengan panjang MI, VM heterogen dengan kecepatan MIPS. Waktu = MI / MIPS.
- Posisi agen x di [0, m)ⁿ, tugas i dijalankan di VM ⌊xᵢ⌋.
- Fitness = makespan + 0,001 · σ(beban VM). Suku σ hanya pemecah seri.
- FA dan BA memakai **beban kerja, populasi awal, fungsi objektif, dan anggaran evaluasi yang sama** (N evaluasi per iterasi). Pembanding: Round-Robin, Min-Min, dan batas bawah ideal ΣMI / ΣMIPS.
- Parameter bawaan dipilih dari sapuan kecil, tidak disetel untuk memenangkan salah satu algoritma. Kesimpulan di aplikasi dihitung dari hasil yang sedang ditampilkan.

## Batasan dan catatan kejujuran

Bagian ini penting kalau deck dipakai untuk presentasi dan akan ditanya dosen.

1. **Paper Firefly (Yousif dkk., 2011)** membahas penjadwalan **job di grid**, memakai aturan SPV, dan membandingkan dengan Min-Min dan Max-Min. Deck ini memindahkan idenya ke penjadwalan tugas di cloud, dan decoding-nya memakai pembulatan (lantai), bukan SPV. Angka di aplikasi adalah hasil simulator ini, bukan angka dari paper.
2. **Paper Bat (Raghavan dkk., 2015)**: hanya abstrak dan metadata yang saya verifikasi. Baca teks lengkapnya sebelum mengutip hasilnya.
3. **Tanda kecepatan Bat.** Yang (2010) menulis vᵢ ← vᵢ + (xᵢ − x*)·fᵢ. Di sini ditulis (x* − xᵢ)·fᵢ supaya kelelawar terbang **menuju** x*, sesuai penjelasan verbalnya. Hal ini dinyatakan di slide dan catatan.
4. **Ketegangan r dan A pada Bat.** Pseudo-code Yang memakai "jika rand > rᵢ lakukan jelajah lokal", sementara r naik seiring waktu. Akibatnya r awal 0 membuat iterasi awal didominasi jelajah lokal, lalu makin jarang. Implementasi mengikuti pseudo-code itu apa adanya.
5. **Jarak Firefly dinormalkan** ke 0 sampai 1 (akar rata-rata kuadrat per dimensi dibagi lebar domain) agar γ bermakna sama di peta 2D dan jadwal 16 tugas. Persamaan di slide dan catatan menyebutkannya.
6. **Simulator disederhanakan.** Tugas independen, VM tetap, tanpa antrean, tanpa biaya komunikasi, tanpa energi atau biaya. Metrik tunggal: makespan.
7. **Sepuluh beban kerja bukan uji statistik.** Selisih Firefly dan Bat kecil dan berubah-ubah menurut seed. Gunakan tombol "Seed baru" untuk melihatnya sendiri. Jangan menyimpulkan satu algoritma selalu menang.
8. **Sitasi dari ingatan bibliografis.** Yang (2009), Yang (2010), dan Braun dkk. (2001) tidak saya buka ulang. Periksa halaman dan daftar penulis di sumber aslinya sebelum masuk daftar pustaka laporan. Hal ini juga dinyatakan di slide `pustaka`.

## Sumber

- Yousif, A., Abdullah, A. H., Nor, S. M., & Abdelaziz, A. A. (2011). Scheduling jobs on grid computing using Firefly Algorithm. *Journal of Theoretical and Applied Information Technology*, 33(2). https://www.jatit.org/volumes/Vol33No2/3Vol33No2.pdf
- Raghavan, S., Sarwesh, P., Marimuthu, C., & Chandrasekaran, K. (2015). Bat algorithm for scheduling workflow applications in cloud. *2015 International Conference on Electronic Design, Computer Networks & Automated Verification (EDCAV)*, 139 to 144. https://ieeexplore.ieee.org/document/7060555
- Yang, X.-S. (2009). Firefly algorithms for multimodal optimization. *Stochastic Algorithms: Foundations and Applications (SAGA 2009)*, LNCS 5792, 169 to 178. Springer. (periksa ulang)
- Yang, X.-S. (2010). A new metaheuristic bat-inspired algorithm. *Nature Inspired Cooperative Strategies for Optimization (NICSO 2010)*, SCI 284, 65 to 74. Springer. (periksa ulang)
- Braun, T. D., dkk. (2001). A comparison of eleven static heuristics for mapping a class of independent tasks onto heterogeneous distributed computing systems. *Journal of Parallel and Distributed Computing*, 61(6), 810 to 837. (periksa ulang)
