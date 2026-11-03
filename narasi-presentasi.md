# Narasi presentasi: Firefly vs Bat untuk Cloud Task Scheduling

Dihasilkan otomatis dari catatan presenter di tiap slide.

## 1. Judul

### Naskah yang diucapkan

Halo semuanya. Hari ini saya akan membahas dua algoritma yang terinspirasi dari alam, yaitu Firefly Algorithm dan Bat Algorithm, dan bagaimana keduanya dipakai untuk menjadwalkan tugas di cloud. Sebelum masuk ke rumus, kita lihat dulu gambarnya. Tiap konsep akan saya tunjukkan lewat animasi dan simulasi yang bisa dijalankan langsung di slide ini.

### Catatan teknis

Sapa audiens. Mulai dari pertanyaan sehari-hari: kalau ada banyak pekerjaan dan beberapa komputer yang kecepatannya beda, pekerjaan mana ditaruh di komputer mana?

    Hari ini kita bandingkan dua jawaban dari alam: kunang-kunang (Firefly Algorithm) dan kelelawar (Bat Algorithm). Keduanya diuji pada beban kerja dan fungsi tujuan yang sama.

## 2. Masalah penjadwalan

### Naskah yang diucapkan

**Beat 1.** Bayangkan ada enam belas tugas dengan panjang yang berbeda-beda, lalu ada empat mesin virtual yang kecepatannya juga tidak sama, dari 85 sampai 175 MIPS. Pertanyaan intinya sederhana. Tugas mana sebaiknya ditaruh di mesin mana. Waktu kerja satu tugas dihitung dari panjang tugas dibagi kecepatan mesin.

**Beat 2.** Cara paling gampang adalah Round-Robin, yaitu tugas dibagi bergiliran. Kelihatannya adil karena jumlahnya sama, tapi mesin yang paling lambat ikut kebagian jatah yang sama sehingga selesai paling akhir. Waktu selesai mesin terakhir inilah yang kita sebut makespan. Di sini Round-Robin berada sekitar 51 persen di atas batas bawah ideal, yaitu garis hijau.

**Beat 3.** Mungkin ada yang berpikir, coba saja semua kemungkinan. Masalahnya, tiap tugas punya empat pilihan mesin, jadi setiap tugas tambahan melipatkan jumlah jadwal empat kali. Pohon ini baru sampai tugas keempat dan sudah ada dua ratus lima puluh enam cabang. Untuk enam belas tugas, jumlahnya sekitar 4,3 miliar jadwal. Kalau satu jadwal dicek dalam satu milidetik, kita butuh hampir lima puluh hari nonstop. Karena itu kita perlu pencari yang cerdas, bukan pencoba semua.

### Catatan teknis

Beat 1. Ada 16 tugas dengan panjang berbeda (satuan MI, juta instruksi) dan 4 VM dengan kecepatan berbeda (85 sampai 175 MIPS). Waktu eksekusi satu tugas = MI dibagi MIPS.

    Beat 2. Cara paling sederhana adalah Round-Robin: tugas dibagi bergiliran. Adil dari sisi jumlah, tapi tidak adil dari sisi waktu. VM paling lambat menerima jatah sama banyak, sehingga selesai paling akhir. Waktu selesai VM terakhir itulah makespan. Garis hijau adalah batas bawah ideal bila seluruh instruksi terbagi sempurna sesuai kecepatan VM.

    Beat 3. Pohon percabangan: tiap tugas membuka empat pilihan VM, jadi jumlah jadwal naik empat kali lipat per tugas (4, 16, 64, 256, dan seterusnya sampai tugas ke-16, sekitar 4,3 miliar). Bila satu jadwal dicek dalam satu milidetik, mengecek semuanya butuh hampir 50 hari nonstop. Pengaturan bawaan FA dan BA di deck ini hanya memakai sekitar 1.100 evaluasi (28 individu × 40 iterasi, ditambah evaluasi awal). Jadi kita butuh cara mencari yang cerdas. Itu pintu masuk ke metaheuristik.

## 3. Lanskap pencarian

### Naskah yang diucapkan

**Beat 1.** Sekarang bayangkan setiap jadwal sebagai satu titik di pegunungan, dan tingginya adalah waktu selesai. Pencari tunggal yang hanya mau turun akan berhenti di lembah terdekat. Itu yang disebut optimum lokal, sementara lembah yang lebih dalam tidak pernah ia lihat.

**Beat 2.** Metaheuristik memakai banyak pencari sekaligus dan membuat mereka saling memberi kabar. Satu pencari yang beruntung menemukan lembah yang dalam, lalu yang lain ikut bergerak ke sana.

**Beat 3.** Kuncinya ada di keseimbangan. Di awal kita menjelajah seluas mungkin supaya tidak terjebak, dan di akhir kita menelusuri dengan teliti supaya hasilnya rapi. Firefly dan Bat mengatur keseimbangan ini dengan cara yang berbeda, dan itulah inti perbandingan kita hari ini.

### Catatan teknis

Beat 1. Bayangkan setiap jadwal sebagai satu titik di pegunungan, dengan tinggi = waktu selesai. Pencari tunggal yang hanya mau turun akan berhenti di lembah terdekat. Itu optimum lokal. Lembah yang lebih dalam tidak pernah ia lihat.

    Beat 2. Metaheuristik memakai banyak pencari sekaligus dan membuat mereka saling memberi kabar. Satu pencari yang beruntung menemukan lembah dalam, lalu yang lain ikut bergerak ke sana.

    Beat 3. Kuncinya keseimbangan. Di awal kita jelajah luas supaya tidak terjebak. Di akhir kita telusuri teliti supaya hasilnya rapi. Firefly dan Bat mengatur keseimbangan ini dengan cara berbeda, dan itu inti perbandingan kita.

## 4. Firefly: inspirasi

### Naskah yang diucapkan

**Beat 1.** Firefly Algorithm terinspirasi dari kunang-kunang yang berkedip untuk saling memanggil. Di algoritma ini, satu kunang-kunang mewakili satu kandidat jadwal.

**Beat 2.** Terang redupnya cahaya mewakili kualitas solusi. Semakin bagus jadwalnya, semakin terang kunang-kunangnya. Jadi kecerahan di sini bukan sekadar hiasan.

**Beat 3.** Aturan mainnya, yang redup terbang mengejar yang lebih terang. Semakin jauh jaraknya, semakin lemah tarikannya, sama seperti cahaya yang memudar di kejauhan.

### Catatan teknis

Beat 1. Kunang-kunang menyala untuk menarik pasangan dan mangsa. Setiap kunang-kunang adalah satu kandidat jadwal.

    Beat 2. Aturan pertama: cahaya adalah kualitas solusi. Semakin bagus jadwalnya (makespan makin kecil), semakin terang nyalanya.

    Beat 3. Aturan kedua: kunang-kunang yang lebih redup terbang mendekati yang lebih terang. Semakin jauh jaraknya, semakin lemah tarikannya karena cahaya meredup di udara. Itulah dua aturan inti Firefly Algorithm (Yang, 2009).

## 5. Firefly: tiga tombol pengatur

### Naskah yang diucapkan

Ada tiga tombol pengatur di Firefly. Beta nol menentukan kuat tarikan saat jaraknya nol. Gamma menentukan seberapa cepat tarikan hilang karena jarak. Alpha mengatur lebar langkah acak setelah terbang. Saya geser slider-nya sekarang, dan kurva serta peragaan geraknya langsung ikut berubah. Kursor bisa digerakkan di grafik untuk memilih jarak tertentu.

### Catatan teknis

Slide ini boleh dimainkan langsung. Geser slider dan lihat kurva berubah.

- β₀: daya tarik saat dua kunang-kunang berdekatan. Besar berarti langsung menempel.

- γ: peredam jarak. γ kecil, tarikan terasa dari jauh (satu kelompok besar). γ besar, tarikan hanya terasa dari dekat (banyak kelompok kecil, lebih menjelajah).

- α: lebar langkah acak. Besar berarti banyak jelajah, kecil berarti hasil rapi. Nilainya menyusut tiap iterasi dalam simulasi.

    Jarak r di sini dinormalkan ke 0 sampai 1 (lebar ruang pencarian), jadi γ berarti sama di peta 2D maupun jadwal 16 tugas.

## 6. Firefly: cara kerja

### Naskah yang diucapkan

**Beat 1.** Langkah pertama, setiap kunang-kunang dihitung nilai fungsi tujuannya. Pada kasus kita nilainya makespan, dan makin kecil berarti makin terang.

**Beat 2.** Langkah kedua, setiap kunang-kunang yang redup melihat semua yang lebih terang darinya, lalu mengincar mereka sekaligus.

**Beat 3.** Langkah ketiga, tarikan melemah karena jarak. Tebal garis di layar menunjukkan kuat tarikan beta. Yang dekat menarik kuat, yang jauh hanya samar.

**Beat 4.** Langkah terakhir, kunang-kunang terbang mengikuti tarikan lalu bergoyang sedikit secara acak. Tarikan memberi arah, sedangkan langkah acak menjaga agar pencarian tetap menjelajah.

### Catatan teknis

Ini satu kunang-kunang (i) yang paling redup dan enam rekannya di peta sederhana. Semua angka β dihitung dengan rumus yang sama dengan simulasi (γ = 2).

- Nilai kecerahan. Hitung f untuk setiap posisi. f kecil berarti terang.

- Tertarik. i melihat semua yang lebih terang darinya.

- Meredup oleh jarak. Tarikan ke yang dekat kuat, ke yang jauh lemah. Tebal garis = nilai β.

- Bergerak. i bergeser sedikit demi sedikit ke tiap yang lebih terang, lalu ditambah langkah acak kecil supaya tidak terkunci.

    Satu iterasi = tiga tahap itu untuk semua kunang-kunang. Berikutnya kita lihat langsung di simulasi.

## 7. Firefly: simulasi langsung

### Naskah yang diucapkan

Sekarang kita coba langsung. Tombol Mulai menjalankan animasi, Langkah maju satu tahap, dan Reset mengulang dari awal. Di kanan ada nilai terbaik dan grafik konvergensi. Saya bisa mengganti fungsi uji di dock bawah, dan membuka laci Parameter untuk mengubah parameter algoritma, jumlah populasi, kecepatan, sampai seed acaknya.

### Catatan teknis

Ini mesin Firefly yang sebenarnya, bukan animasi. Tekan Mulai (P), Langkah (S), atau Reset (R).

- Tiap iterasi punya tiga tahap: Ukur kecerahan, Terbang ke yang lebih terang, Langkah acak.

- Garis putus-putus saat terbang adalah tarikan, makin tebal makin kuat. Titik emas dengan mahkota adalah yang paling terang.

- Rastrigin penuh lembah palsu. Coba naikkan γ untuk melihat kunang-kunang terpecah ke beberapa kelompok, atau turunkan untuk satu kelompok besar.

    Bintang emas di peta menandai optimum global (0, 0) dengan f = 0. Hasil bergantung seed, jadi coba beberapa seed.

## 8. Bat: inspirasi

### Naskah yang diucapkan

**Beat 1.** Bat Algorithm terinspirasi dari kelelawar yang berekolokasi. Kelelawar bersuara, lalu mendengar gemanya, dan dari gema itu ia tahu seberapa jauh mangsanya.

**Beat 2.** Saat mendekati mangsa, kelelawar mengirim pulsa lebih sering tapi dengan suara yang lebih pelan. Di algoritma, laju pulsa r naik dan kenyaringan A turun.

**Beat 3.** Satu kelelawar terbaik menjadi arah tujuan. Yang lain terbang menuju dia, lalu sesekali menjelajah di sekitarnya.

### Catatan teknis

Beat 1. Kelelawar mikro memakai ekolokasi: mengeluarkan pulsa suara, lalu mendengar pantulannya untuk menebak jarak dan lokasi mangsa.

    Beat 2. Semakin dekat ke mangsa, kelelawar memancarkan pulsa lebih sering (laju pulsa r naik) dan lebih pelan (kenyaringan A turun). Dua angka inilah yang nanti jadi parameter algoritma.

    Beat 3. Dalam algoritma, kelelawar terbaik saat ini (x*) jadi arah tujuan. Yang lain terbang ke sana dengan frekuensi acak, lalu menjelajah dekat x*.

    Catatan akademik: analogi "r naik dan A turun" berasal dari Yang (2010). Pada pseudo-code aslinya, jelajah lokal dipilih saat rand lebih besar dari r. Artinya ketika r naik, jelajah lokal justru makin jarang. Sebagian literatur menyoroti ketidakselarasan analogi ini, jadi baca sumber aslinya bila dosen bertanya.

## 9. Bat: parameter pengatur

### Naskah yang diucapkan

Di Bat ada dua nilai yang berubah seiring waktu. Kenyaringan A turun dan laju pulsa r naik. Ada empat tombol pengatur, yaitu A nol, r nol, alpha A, dan gamma r. Saya geser slider-nya, dan perhatikan bentuk kurva serta lingkaran gema di sebelah kanan.

### Catatan teknis

Boleh dimainkan. Geser slider dan perhatikan dua kurva.

- A (kenyaringan) mulai dari A₀ dan dikalikan α_A setiap kali sebuah solusi diterima. A mengatur peluang menerima percobaan (rand < A) dan juga radius jelajah lokal.

- r (laju pulsa) mulai dari 0 lalu naik menuju r₀ lewat r₀(1 − e^(−γt)). Aturannya: bila rand lebih besar dari r, kelelawar menjelajah lokal di dekat x*.

    Tampak jelas bahwa A menurun cepat bila α_A kecil. Setelah A kecil, hampir tidak ada percobaan yang diterima dan jelajah lokal menyempit: algoritma "mengunci" ke solusi terbaik. Ini mengontrol konvergensi, tetapi juga bisa terlalu dini bila α_A terlalu kecil.

    Untuk jujur secara akademik: karena jelajah lokal dipilih saat rand > r, kenaikan r mengurangi jelajah lokal. Itu pembacaan literal pseudo-code Yang (2010) dan disoroti beberapa ulasan sebagai bagian yang kurang intuitif.

## 10. Bat: cara kerja

### Naskah yang diucapkan

**Beat 1.** Pertama, setiap kelelawar terbang menuju yang terbaik. Frekuensi acak f menentukan seberapa jauh ia melangkah.

**Beat 2.** Kedua, kadang kelelawar menjelajah dekat x bintang. Kalau angka acak lebih besar dari r, titik percobaan diganti titik acak di sekitar kelelawar terbaik.

**Beat 3.** Ketiga, hanya yang lolos yang berpindah. Titik baru harus lebih baik dan lolos peluang yang ditentukan kenyaringan A. Kalau diterima, A turun dan r naik.

### Catatan teknis

Peta kecil yang sama dengan Firefly, kali ini dengan empat kelelawar dan x* sebagai yang terbaik. Nilai rand dan hasil terima/tolak adalah contoh tetap agar mudah dijelaskan.

- Pulsa menuju x*. Setiap kelelawar menarik frekuensi acak f. Kecepatannya bertambah (x* − x)·f, lalu posisi percobaan = posisi + kecepatan. Perhatikan kelelawar m: kecepatan lamanya membuatnya melampaui x*.

- Jelajah lokal. Jika rand lebih besar dari r, percobaan global diganti titik acak di sekitar x*. Radius = A · 10% lebar ruang.

- Terima atau tolak. Terima hanya bila rand < A dan percobaan lebih baik. Ada kasus lebih baik tetapi tetap ditolak karena rand melebihi A. Bila diterima, A dikalikan α_A dan r naik.

    Dalam simulasi, urutan tiga tahap ini sama persis: Pulsa, Jelajah lokal, Terima.

## 11. Bat: simulasi langsung

### Naskah yang diucapkan

Kontrolnya sama dengan Firefly supaya mudah dibandingkan. Tanda centang menandai titik percobaan yang diterima dan tanda silang menandai yang ditolak. Perhatikan bagaimana kelelawar cenderung berkumpul ke satu titik terbaik.

### Catatan teknis

Mesin Bat sungguhan. Tombol sama: Mulai (P), Langkah (S), Reset (R).

- Tiga tahap per iterasi: Pulsa (belah ketupat ungu = posisi percobaan), Jelajah lokal (cincin merah muda di sekitar x*), Terima (centang hijau berpindah, silang merah ditolak).

- Di iterasi awal r masih 0, jadi hampir semua kelelawar menjelajah lokal. Seiring r naik, sebagian tetap memakai percobaan global.

- Teks di panel kanan menampilkan Ā dan r̄ yang berubah setiap iterasi.

    Anggaran evaluasi Bat sama dengan Firefly: satu evaluasi per individu per iterasi. Itu yang membuat perbandingan di slide berikutnya adil.

## 12. Model: posisi menjadi jadwal

### Naskah yang diucapkan

**Beat 1.** Sekarang model matematikanya. Satu posisi kandidat hanyalah satu daftar angka, satu angka untuk tiap tugas.

**Beat 2.** Angka itu dibulatkan ke bawah lalu ditambah satu, hasilnya nomor VM. Geser sedikit saja angkanya dan satu tugas bisa pindah mesin.

**Beat 3.** Selanjutnya tiap VM menjumlahkan waktu kerja semua tugas yang diterimanya. Waktu satu tugas adalah panjang tugas dibagi kecepatan VM.

**Beat 4.** Yang paling terlambat menentukan nilai. Makespan adalah waktu selesai VM yang paling lama bekerja, dan makespan kecil berarti jadwal bagus. Di program ini ditambahkan suku yang sangat kecil dari sebaran beban, hanya sebagai pemecah seri.

### Catatan teknis

Sekarang rumusnya, setelah gerakannya terlihat. Masalah penjadwalan kita diskrit (tugas ke VM), tetapi FA dan BA bekerja di ruang kontinu. Jembatannya sederhana.

- Posisi. Satu agen = vektor X dengan satu angka per tugas, masing-masing di rentang [0, m) dengan m = jumlah VM.

- Dekode. Nomor VM tugas i = lantai dari x_i (ditambah satu untuk penomoran). Ini yang disebut decoding.

- Waktu. Waktu eksekusi t = MI / MIPS. Beban VM j (L_j) adalah jumlah waktu semua tugas di VM itu.

- Fitness. Makespan = max L_j. Suku 0,001·σ hanya pemecah seri agar jadwal dengan makespan sama tetap bisa dibedakan.

    Fungsi yang sama dipanggil oleh FA dan BA. Itulah yang membuat perbandingannya adil. Catatan: Yousif dkk. (2011) memakai aturan SPV (smallest position value) untuk memetakan posisi ke sumber daya. Di sini dipakai pembulatan sederhana, alasannya kemudahan visualisasi.

## 13. Model: persamaan FA dan BA

### Naskah yang diucapkan

**Beat 1.** Sekarang persamaannya terasa masuk akal karena kita sudah melihat gambarnya. Kita mulai dari jarak antar kunang-kunang, yang dinormalkan ke rentang nol sampai satu supaya nilai gamma bermakna sama di peta dua dimensi maupun di jadwal enam belas tugas.

**Beat 2.** Daya tarik Firefly adalah beta nol dikali e pangkat minus gamma r kuadrat. Makin jauh makin lemah. Di Bat, frekuensi diambil acak di antara f minimum dan f maksimum.

**Beat 3.** Aturan terbang Firefly menarik yang redup ke yang terang. Pada Bat, kecepatan diperbarui menuju x bintang. Perlu saya sampaikan dengan jujur, tanda kecepatan di sini dibalik dari tulisan Yang supaya kelelawar benar-benar menuju x bintang sesuai penjelasan verbalnya.

**Beat 4.** Terakhir, Firefly menambahkan goyang acak alpha sebagai penjaga keragaman. Bat memakai seleksi, yaitu titik baru diterima hanya bila lebih baik dan lolos peluang A, lalu A turun dan r naik.

### Catatan teknis

Setiap baris persamaan sudah pernah muncul sebagai gerakan. Tekan panah kanan untuk membuka pasangan berikutnya.

    Firefly: jarak yang dinormalkan, daya tarik yang meredup, terbang ke yang lebih terang, lalu goyang acak. Sumber: Yang (2009) dan penerapannya pada penjadwalan job di grid oleh Yousif dkk. (2011).

    Bat: frekuensi acak, kecepatan menuju x*, jelajah lokal, lalu terima atau tolak dengan kenyaringan. Sumber: Yang (2010). Penerapan penjadwalan workflow di cloud oleh Raghavan dkk. (2015).

    Catatan jujur: (1) Jarak dan langkah acak pada Firefly dinormalkan oleh lebar domain agar γ dan α berarti sama pada 2D dan 16 dimensi. Itu pilihan implementasi, bukan bagian rumus asli. (2) Yang (2010) menulis kecepatan dengan (x_i − x*). Di sini dibalik menjadi (x* − x_i) agar kelelawar bergerak mendekati x*, sesuai deskripsi. Cek ke sumber asli sebelum menulis laporan.

## 14. Cloud: tugas masuk ke VM

### Naskah yang diucapkan

Sekarang kita masukkan ke kasus cloud. Alurnya, tugas masuk, penjadwal membuat banyak kandidat jadwal, tiap kandidat dihitung makespan-nya, lalu Firefly atau Bat menggeser kandidat, dan jadwal terbaik dikirim ke VM. Saya klik sebuah blok tugas untuk memindahkannya ke VM berikutnya dan makespan ikut berubah. Lalu saya tekan Hasil Firefly atau Hasil Bat untuk melihat jadwal yang ditemukan algoritma pada beban kerja yang sama.

### Catatan teknis

Alur lengkapnya, dari tugas masuk sampai dikirim ke VM:

- Tugas datang ke penjadwal (di sini 16 tugas independen).

- Penjadwal membuat banyak kandidat jadwal sekaligus. Itulah populasi kunang-kunang atau kelelawar.

- Setiap kandidat didekode menjadi penugasan tugas ke VM, lalu dinilai dengan makespan.

- FA atau BA menggeser kandidat berdasarkan nilai itu, berulang-ulang.

- Setelah iterasi habis, jadwal terbaik dikirim: tiap tugas dijalankan di VM pilihannya.

    Interaksi: klik sebuah tugas untuk memindahkannya ke VM berikutnya. Coba kalahkan Round-Robin dengan tangan, lalu tekan tombol Hasil FA atau Hasil BA untuk melihat jadwal yang ditemukan algoritma pada beban kerja yang sama.

    Penugasan manual adalah contoh bahwa ruang pencarian besar: 4 pangkat 16 kemungkinan. Algoritma mencari dengan beberapa ratus evaluasi saja.

## 15. Cloud: FA dan BA menjadwalkan bersama

### Naskah yang diucapkan

Di sini Firefly dan Bat menjadwalkan beban kerja yang sama persis, dengan populasi awal dan anggaran evaluasi yang sama. Jalur atas Firefly, jalur bawah Bat. Grafik di kanan membandingkan keduanya dengan Round-Robin, Min-Min, dan batas bawah ideal. Saya tekan Mulai, dan kita lihat blok-blok bergeser antar VM sementara makespan turun.

### Catatan teknis

Beban kerja, jumlah VM, populasi awal, dan fungsi objektif (makespan) identik untuk kedua algoritma. Yang berbeda hanya aturan geraknya. Anggaran evaluasi juga sama: satu evaluasi per individu per iterasi.

- Jalur atas Firefly, jalur bawah Bat. Blok yang bergeser antar-VM adalah jadwal terbaik saat ini, bukan seluruh populasi.

- Garis putus-putus emas = makespan terbaik, hijau = batas bawah ideal.

- Grafik di kanan: dua kurva algoritma dibandingkan Round-Robin, Min-Min, dan batas bawah. Kurva tidak pernah naik karena yang dicatat adalah nilai terbaik sejauh ini.

    Tekan Parameter untuk mengubah jumlah tugas, VM, populasi, dan iterasi. Hasil satu proses acak tidak cukup untuk menyimpulkan siapa lebih baik. Itu sebabnya ada eksperimen sepuluh beban kerja di slide hasil.

## 16. Adu: Firefly vs Bat di peta yang sama

### Naskah yang diucapkan

Sekarang adu langsung di peta dua dimensi. Posisi awal kedua algoritma sama persis, jadi perbedaannya hanya datang dari aturan geraknya. Saya bisa ganti fungsi uji ke Rastrigin, Ackley, atau Sphere, dan mengubah seed untuk menunjukkan bahwa pemenangnya bisa berganti. Satu kali jalan belum cukup untuk menarik kesimpulan, makanya slide berikutnya memakai banyak beban kerja.

### Catatan teknis

Syarat perbandingan yang adil sudah dipenuhi: fungsi sama, posisi awal sama persis, populasi sama, iterasi sama. Anggaran evaluasi juga sama (satu per individu per iterasi), terlihat dari angka evaluasi di bawah skor.

- Kedua mesin berjalan serempak: tiga tahap per iterasi untuk masing-masing.

- Ganti fungsi (Rastrigin, Ackley, Sphere) untuk melihat karakter berbeda: Sphere cepat sekali, Rastrigin penuh jebakan.

- Ubah seed lewat tombol Parameter. Pemenang dapat berganti dari seed ke seed. Satu proses acak bukan kesimpulan.

    Itu sebabnya slide berikutnya memakai banyak beban kerja sekaligus.

## 17. Eksperimen sepuluh beban kerja

### Naskah yang diucapkan

Di sini algoritma dijalankan pada sepuluh beban kerja berbeda, dan semuanya dihitung langsung di browser. Sumbu tegak adalah rasio terhadap batas bawah ideal, jadi satu kali berarti sempurna. Keduanya jauh lebih baik dari Round-Robin, tapi selisih Firefly dan Bat kecil dan berubah-ubah. Saya tekan Seed baru untuk menunjukkan hasilnya bisa bergeser. Karena itu saya tidak menyimpulkan satu algoritma selalu menang.

### Catatan teknis

Satu proses acak tidak cukup untuk menyimpulkan. Di sini algoritma dijalankan pada sepuluh beban kerja berbeda (panjang tugas diacak dengan seed berbeda), semuanya dihitung langsung di browser Anda saat tombol ditekan.

- Sumbu tegak adalah rasio terhadap batas bawah ideal: 1,0× berarti sempurna (instruksi terbagi mulus sesuai kecepatan VM, yang hampir mustahil dicapai karena tugas tidak bisa dipecah).

- Round-Robin dan Min-Min adalah pembanding klasik. Min-Min mengikuti Braun dkk. (2001), baseline yang juga dipakai paper Firefly.

- Ubah jumlah tugas atau VM, lalu jalankan lagi. Tombol "Seed baru" mengulang eksperimen dengan populasi awal berbeda untuk melihat variasi.

    Baca hasil dengan jujur: bila selisih FA dan BA kecil dan kemenangan seimbang, kesimpulannya bukan "A lebih baik dari B". Ini simulasi sederhana: tugas independen, tanpa biaya komunikasi atau antrean.

## 18. Ringkasan: dua cara berpikir

### Naskah yang diucapkan

Untuk meringkas, Firefly dipandu semua yang lebih terang sehingga bisa membentuk beberapa kelompok, sedangkan Bat dipandu satu pemimpin, yaitu x bintang. Firefly membandingkan semua pasangan sehingga lebih mahal saat populasi besar, sementara Bat lebih ringan tapi punya lebih banyak parameter. Jumlah evaluasi fungsi tujuan sama. Baris terakhir adalah angka hidup dari sepuluh beban kerja.

### Catatan teknis

Satu kalimat per baris.

- Memandu gerak. Firefly: tiap individu mengincar semua yang lebih baik, tarikan memudar dengan jarak, sehingga bisa terbentuk beberapa kelompok. Bat: semua mengincar satu pemimpin, x*, sehingga cenderung satu kelompok.

- Biaya. Firefly membandingkan semua pasangan (N kali N) per iterasi, jadi lebih mahal bila populasi besar. Bat cukup N. Jumlah evaluasi fungsi tujuan sama, yang biasanya jadi komponen mahal bila fungsinya berat.

- Parameter. Firefly: β₀, γ, α. Bat: f, A₀, r₀, α_A, γ_r. Bat memiliki lebih banyak knob, sehingga lebih repot dituning.

    Baris terakhir adalah angka hidup yang dihitung langsung di browser dari sepuluh beban kerja (16 tugas, 4 VM). Nilai bisa sedikit berbeda dengan tampilan eksperimen bila pengaturannya diubah.

## 19. Kesimpulan

### Naskah yang diucapkan

Ada tiga pesan penutup. Pertama, metaheuristik terbukti berguna karena hasilnya jauh di bawah Round-Robin. Kedua, antara Firefly dan Bat selisihnya kecil dan bergantung pada beban kerja, jadi jangan mengklaim satu pasti unggul. Ketiga, pilihan bergantung konteks, yaitu ukuran populasi, biaya evaluasi, dan waktu untuk menala parameter. Batasannya, tugas independen, VM tetap, tanpa antrean dan biaya komunikasi, dan sepuluh beban kerja belum merupakan uji statistik. Terima kasih.

### Catatan teknis

Tiga pesan, angkanya dihitung langsung saat slide dibuka.

- Metaheuristik terbukti berguna: jauh di bawah Round-Robin.

- Antara Firefly dan Bat, selisihnya kecil dan bergantung beban kerja. Jangan klaim satu pasti unggul.

- Pemilihan bergantung konteks: ukuran populasi, biaya evaluasi, dan waktu untuk menala parameter.

    Batasan yang perlu disebut jujur: tugas diasumsikan independen, VM heterogen tetap, tanpa antrean atau biaya komunikasi. Decoding memakai pembulatan, bukan SPV seperti paper Firefly. Sepuluh beban kerja bukan uji statistik. Satu-satunya metrik adalah makespan. Penelitian lanjutan: workflow dengan dependensi, biaya, dan energi (seperti yang dibahas paper Bat), serta uji signifikansi.

## 20. Sumber dan pustaka

### Naskah yang diucapkan

Ini daftar sumber. Paper Firefly dari Yousif dan kawan-kawan tahun 2011 membahas penjadwalan job di grid, sedangkan paper Bat dari Raghavan dan kawan-kawan tahun 2015 membahas workflow di cloud. Perlu saya sampaikan dengan jujur bahwa untuk paper Bat hanya abstraknya yang saya verifikasi, dan angka di aplikasi ini adalah hasil simulator sendiri, bukan angka dari paper. Terima kasih, saya buka sesi diskusi.

### Catatan teknis

Daftar sumber dan status verifikasinya. Dua paper utama: Yousif dkk. (2011) untuk Firefly dan Raghavan dkk. (2015) untuk Bat.

    Jujur soal batas verifikasi: paper Firefly dibaca penuh (rumus, aturan SPV, tabel contoh). Paper Bat hanya abstrak dan metadata yang dapat diakses saat menyusun, sehingga angka hasilnya tidak ditampilkan. Lengkapi dari PDF melalui akses kampus.

    Sitasi Yang (2009), Yang (2010), dan Braun dkk. (2001) ditulis dari ingatan bibliografi umum: cek ulang halaman, penerbit, dan daftar penulis sebelum dimasukkan ke laporan.
