/**
 * Codex Teori & Analisis Mendalam (Deep Academic Theory Drawer & Guide).
 * Menjawab kebutuhan penjelasan ilmiah mendalam, pembuktian matematis,
 * dan perbandingan menyeluruh untuk presentasi tingkat perguruan tinggi.
 */

import { sound } from '../core/sound.js';
import { formatMathInHtml } from './mathRenderer.js';

export const CODEX_CHAPTER_CONTENT = {
  masalah: {
    title: 'Analisis Masalah Penjadwalan Komputasi Awan (Cloud Scheduling)',
    chapterNum: '1 & 2',
    eraName: 'Bab 1 · Masalah & Penjadwalan Cloud',
    icon: '🏰',
    sections: [
      {
        heading: 'Definisi Matematis Masalah',
        content: `
          <p>Diberikan himpunan $n$ tugas independen $\\mathcal{T} = \\{T_1, T_2, \\dots, T_n\\}$ di mana setiap tugas $T_i$ memiliki panjang komputasi sebesar $MI_i$ (Million Instructions). Tersedia $m$ Mesin Virtual (VM) heterogen $\\mathcal{V} = \\{VM_1, VM_2, \\dots, VM_m\\}$ dengan kecepatan pemrosesan $MIPS_j$ (Million Instructions Per Second).</p>
          <p>Waktu yang dibutuhkan oleh $VM_j$ untuk menuntaskan tugas $T_i$ dirumuskan sebagai:</p>
          <div class="formula-box">$$ET_{ij} = \\frac{MI_i}{MIPS_j}$$</div>
          <p>Tujuan utama adalah memetakan setiap tugas ke tepat satu VM sedemikian rupa sehingga waktu penyelesaian tugas paling lambat (<strong>Makespan</strong>) diminimalkan:</p>
          <div class="formula-box">$$\\min \\; \\text{Makespan} = \\max_{j \\in \\{1..m\\}} \\sum_{i \\in \\mathcal{A}_j} ET_{ij}$$</div>
          <p>di mana $\\mathcal{A}_j$ adalah himpunan tugas yang dialokasikan ke $VM_j$.</p>
        `
      },
      {
        heading: 'Mengapa Masalah Ini Tergolong NP-Hard?',
        content: `
          <p>Masalah alokasi tugas ini merupakan generalisasi dari <em>Identical Machine Scheduling Problem</em> ($P || C_{max}$), yang telah dibuktikan oleh Garey & Johnson (1979) sebagai masalah <strong>NP-Hard</strong> dalam arti kuat.</p>
          <p>Ruang pencarian berukuran $|\\mathcal{S}| = m^n$. Untuk skenario standar kita dengan 16 tugas dan 4 VM, terdapat:</p>
          <div class="formula-box">$$4^{16} = 4.294.967.296 \\text{ kemungkinan jadwal}$$</div>
          <p>Bila data center melayani 30 tugas, kombinasinya menjadi $4^{30} \\approx 1,15 \\times 10^{18}$ kombinasi. Jika satu komputer dapat memeriksa 1 miliar jadwal per detik, dibutuhkan lebih dari <strong>36 tahun</strong> untuk menemukan jadwal terbaik secara exhaustive search (brute force)!</p>
        `
      },
      {
        heading: 'Batas Bawah Teoretis (Ideal Lower Bound)',
        content: `
          <p>Untuk mengukur kualitas jadwal tanpa mengetahui solusi optimal absolutnya, kita menggunakan batas bawah teoretis ideal ($LB$):</p>
          <div class="formula-box">$$LB = \\max \\left( \\frac{\\sum_{i=1}^n MI_i}{\\sum_{j=1}^m MIPS_j}, \\; \\max_{i} \\frac{MI_i}{\\max_j MIPS_j} \\right)$$</div>
          <p>Suku pertama mewakili kondisi sempurna di mana seluruh kapasitas VM bekerja 100% tanpa ada waktu tunggu sedetik pun. Suku kedua memastikan makespan tidak mungkin lebih kecil dari waktu pengerjaan tugas terbesar di VM tercepat.</p>
        `
      }
    ]
  },
  firefly: {
    title: 'Bedah Ilmiah Algoritma Kunang-Kunang (Firefly Algorithm)',
    chapterNum: '3 & 4',
    eraName: 'Bab 2 · Algoritma Firefly',
    icon: '💡',
    sections: [
      {
        heading: 'Tiga Karakteristik Pokok Xin-She Yang (2008)',
        content: `
          <p>Algoritma Kunang-Kunang (FA) dirancang berdasarkan perilaku bioluminesensi alami:</p>
          <ol>
            <li><strong>Uniseks:</strong> Semua kunang-kunang saling tertarik tanpa memandang jenis kelamin.</li>
            <li><strong>Daya Tarik Menurun dengan Jarak:</strong> Daya tarik $\\beta$ berbanding lurus dengan kecerahan $I$ dan berkurang seiring jarak $r$ akibat absorpsi medium udara (Hukum Beer-Lambert).</li>
            <li><strong>Lanskap Fungsi Tujuan:</strong> Kecerahan kunang-kunang ditentukan oleh nilai fungsi evaluasi. Pada kasus minimasi, $I(x) \\propto -f(x)$ atau $I(x) = \\frac{1}{1 + f(x)}$.</li>
          </ol>
        `
      },
      {
        heading: 'Penurunan Rumus Daya Tarik & Penyerapan Cahaya',
        content: `
          <p>Intensitas cahaya $I(r)$ pada jarak $r$ dari sumber cahaya memenuhi persamaan diferensial penyerapan medium $\\frac{dI}{dr} = -\\gamma I$, menghasilkan:</p>
          <div class="formula-box">$$I(r) = I_0 e^{-\\gamma r^2}$$</div>
          <p>Karena daya tarik $\\beta$ sebanding dengan intensitas cahaya yang terlihat oleh kunang-kunang lain, maka daya tarik dirumuskan sebagai:</p>
          <div class="formula-box">$$\\beta(r) = \\beta_0 e^{-\\gamma r^2}$$</div>
          <p>di mana $\\beta_0$ adalah daya tarik pada jarak $r=0$, dan $\\gamma$ adalah koefisien absorpsi cahaya.</p>
          <ul>
            <li><strong>Bila $\\gamma \\to 0$:</strong> Tidak ada penyerapan cahaya sama sekali. Daya tarik konstan $\\beta(r) = \\beta_0$. Semua kunang-kunang dapat saling melihat terlepas dari jaraknya, sehingga algoritma berperilaku mirip Particle Swarm Optimization (PSO) global.</li>
            <li><strong>Bila $\\gamma \\to \\infty$:</strong> Medium sangat keruh sehingga cahaya langsung padam. Kunang-kunang tidak dapat melihat tetangga, sehingga pergerakan sepenuhnya menjadi Random Walk murni.</li>
          </ul>
        `
      },
      {
        heading: 'Pembaruan Posisi & Keunggulan Multimodal',
        content: `
          <p>Jika kunang-kunang $j$ lebih terang daripada kunang-kunang $i$, maka kunang-kunang $i$ akan terbang mendekati $j$ dengan pembaruan:</p>
          <div class="formula-box">$$x_i^{t+1} = x_i^t + \\beta_0 e^{-\\gamma r_{ij}^2}(x_j^t - x_i^t) + \\alpha \\epsilon_i$$</div>
          <p>di mana suku kedua adalah gaya tarik penarik (eksploitasi), dan suku ketiga adalah langkah acak (eksplorasi) dengan faktor peredam $\\alpha$ dan vektor acak $\\epsilon_i \\sim U(-0.5, 0.5)$.</p>
          <p><strong>Mengapa FA Unggul di Multimodal?</strong> Karena FA tidak memiliki satu pemimpin global tunggal ($g^*$). Setiap kunang-kunang ditarik oleh semua kunang-kunang yang lebih terang di sekitarnya. Hal ini menyebabkan swarm terbagi secara mandiri menjadi beberapa sub-klaster di sekitar puncak-puncak lokal yang menjanjikan.</p>
        `
      }
    ]
  },
  bat: {
    title: 'Bedah Ilmiah Algoritma Kelelawar (Bat Algorithm)',
    chapterNum: '5 & 6',
    eraName: 'Bab 3 · Algoritma Bat',
    icon: '🦇',
    sections: [
      {
        heading: 'Prinsip Ekolokasi Ultrasonik Mikro',
        content: `
          <p>Kelelawar mikro memancarkan pulsa ultrasonik berfrekuensi $f \\in [f_{min}, f_{max}]$ dengan panjang gelombang $\\lambda = v / f$ dan laju denyut $r \\in [0, 1]$. Gema dari pulsa ini memantul dari mangsa dan memungkinkan kelelawar memperkirakan jarak, kecepatan, dan orientasi mangsa dalam ruang 3 dimensi.</p>
        `
      },
      {
        heading: 'Formulasi Frekuensi, Kecepatan, dan Posisi',
        content: `
          <p>Pada setiap langkah waktu $t$, kelelawar $i$ memperbarui parameter perburuannya:</p>
          <div class="formula-box">
            $$f_i = f_{min} + (f_{max} - f_{min})\\beta \\quad ; \\quad \\beta \\in [0, 1]$$
            $$v_i^{t+1} = v_i^t + (x^* - x_i^t)f_i$$
            $$x_i^{t+1} = x_i^t + v_i^{t+1}$$
          </div>
          <p>di mana $x^*$ adalah solusi terbaik global yang ditemukan oleh seluruh koloni saat ini.</p>
          <p><em>Catatan Implementasi:</em> Dalam paper asli Yang (2010), tertulis $(x_i - x^*)f_i$. Implementasi komputasi yang tepat membalik tanda menjadi $(x^* - x_i)f_i$ agar vektor kecepatan mengarah <strong>menuju</strong> mangsa terbaik $x^*$.</p>
        `
      },
      {
        heading: 'Penelusuran Eksploitasi Lokal & Redaman Akustik',
        content: `
          <p>Jika bilangan acak $\\text{rand} > r_i$, kelelawar beralih melakukan penelusuran lokal (local walk) di sekitar solusi terbaik:</p>
          <div class="formula-box">$$x_{new} = x^* + \\epsilon \\langle A^t \\rangle$$</div>
          <p>di mana $\\langle A^t \\rangle$ adalah rata-rata kelantangan seluruh kelelawar pada iterasi tersebut.</p>
          <p>Jika solusi baru $x_{new}$ lebih baik daripada $x_i$ dan $\\text{rand} < A_i$, maka posisi baru diterima, dan parameter suara diperbarui:</p>
          <div class="formula-box">
            $$A_i^{t+1} = \\alpha A_i^t \\quad (\\alpha \\in (0, 1))$$
            $$r_i^{t+1} = r_i^0 [1 - e^{-\\gamma t}] \\quad (\\gamma > 0)$$
          </div>
          <p>Seiring berjalannya waktu, kelantangan $A$ meredam mendekati nol (kelelawar tidak berisik saat mendekati mangsa), sedangkan laju denyut $r$ meningkat mendekati 1 (kelelawar memancarkan pulsa beruntun untuk mematikan sasaran).</p>
        `
      }
    ]
  },
  cloud: {
    title: 'Model Penerapan & Perbandingan di Cloud Computing',
    chapterNum: '7, 8, 9 & 10',
    eraName: 'Bab 4 & 5 · Penerapan & Sintesis',
    icon: '⚔️',
    sections: [
      {
        heading: 'Decoding: Pemetaan Koordinat Kontinu ke Jadwal Nyata',
        content: `
          <p>FA dan BA bergerak di dalam ruang pencarian kontinu $\\mathbb{R}^n$, dengan batas domain $[0, m)$ untuk setiap dimensi tugas. Untuk mengonversi koordinat kontinu vektor $x = (x_1, x_2, \\dots, x_n)$ menjadi penugasan mesin diskret, digunakan fungsi pembulatan lantai (floor mapping):</p>
          <div class="formula-box">$$VM(T_i) = \\lfloor x_i \\rfloor \\in \\{0, 1, \\dots, m-1\\}$$</div>
          <p>Metode ini memiliki sifat deterministik, cepat, dan memungkinkan algoritma melakukan eksplorasi bertahap (gradien pergerakan kontinu mencerminkan transisi tugas antar mesin).</p>
        `
      },
      {
        heading: 'Fitness Function dengan Pemecah Seri (Tie-Breaker)',
        content: `
          <p>Untuk membedakan dua jadwal yang memiliki makespan identik, fungsi fitness dilengkapi penalti deviasi beban kerja:</p>
          <div class="formula-box">$$\\text{Fitness} = \\text{Makespan} + 0,001 \\cdot \\sigma(\\text{Beban VM})$$</div>
          <p>di mana $\\sigma$ adalah standar deviasi dari waktu kerja masing-masing VM. Jadwal yang memiliki sebaran beban lebih merata (load balanced) akan mendapatkan nilai fitness sedikit lebih rendah, sehingga terpilih sebagai solusi terbaik.</p>
        `
      },
      {
        heading: 'Sintesis Komparatif: FA vs BA',
        content: `
          <table class="aoe-codex-table">
            <thead>
              <tr>
                <th>Aspek</th>
                <th>Firefly Algorithm (FA)</th>
                <th>Bat Algorithm (BA)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Inspirasi Biologis</strong></td>
                <td>Kedipan bioluminesensi kunang-kunang</td>
                <td>Ekolokasi ultrasonik kelelawar mikro</td>
              </tr>
              <tr>
                <td><strong>Kompleksitas Komputasi</strong></td>
                <td>$O(n^2)$ perbandingan pasangan per iterasi</td>
                <td>$O(n)$ pembaruan terhadap solusi terbaik $x^*$</td>
              </tr>
              <tr>
                <td><strong>Struktur Panduan</strong></td>
                <td>Desentralisasi (tertarik ke semua yang lebih terang)</td>
                <td>Sentralisasi dipandu oleh $x^*$ dan penelusuran lokal</td>
              </tr>
              <tr>
                <td><strong>Lanskap Multimodal</strong></td>
                <td>Sangat kuat (membentuk sub-populasi mandiri)</td>
                <td>Rentan terjebak jika $x^*$ adalah lembah dangkal</td>
              </tr>
              <tr>
                <td><strong>Kecepatan Konvergensi</strong></td>
                <td>Eksploratif menyeluruh, konvergensi bertahap</td>
                <td>Sangat cepat mengeksploitasi area sekitar $x^*$</td>
              </tr>
              <tr>
                <td><strong>Jumlah Parameter</strong></td>
                <td>3 parameter: $\\beta_0, \\gamma, \\alpha$</td>
                <td>4 parameter: $A_0, r_0, \\alpha_A, \\gamma_r$</td>
              </tr>
            </tbody>
          </table>
        `
      }
    ]
  }
};

export class DeepCodexModal {
  constructor() {
    this.modal = null;
    this.currentChapterKey = 'masalah';
  }

  mount(root) {
    if (this.modal) return;
    const el = document.createElement('div');
    el.id = 'aoe-deep-codex-modal';
    el.className = 'aoe-modal-backdrop hidden';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Buku Strategi & Analisis Mendalam');
    root.appendChild(el);
    this.modal = el;
    this.#render();
    this.#bind();
  }

  open(chapterKey = 'masalah') {
    if (!this.modal) return;
    if (['masalah', 'metaheuristik'].includes(chapterKey)) this.currentChapterKey = 'masalah';
    else if (['firefly'].includes(chapterKey)) this.currentChapterKey = 'firefly';
    else if (['bat'].includes(chapterKey)) this.currentChapterKey = 'bat';
    else this.currentChapterKey = 'cloud';

    this.modal.classList.remove('hidden');
    sound.playHorn();
    this.#render();
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    sound.playClick();
  }

  toggle(chapterKey = 'masalah') {
    if (this.modal?.classList.contains('hidden')) this.open(chapterKey);
    else this.close();
  }

  #bind() {
    this.modal.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('#aoe-codex-close');
      if (closeBtn || e.target === this.modal) {
        this.close();
        return;
      }

      const navBtn = e.target.closest('[data-codex-chapter]');
      if (navBtn) {
        sound.playClick();
        this.currentChapterKey = navBtn.dataset.codexChapter;
        this.#render();
      }
    });
  }

  #render() {
    const data = CODEX_CHAPTER_CONTENT[this.currentChapterKey];

    this.modal.innerHTML = `
      <div class="aoe-tech-window aoe-codex-window">
        <header class="aoe-tech-header">
          <div class="aoe-tech-title-wrap">
            <span class="aoe-crest">📖</span>
            <div>
              <h2>BUKU STRATEGI & ANALISIS TEORI MENDALAM</h2>
              <p>Rujukan Akademis Komprehensif: Formulasi Matematis, Bukti Teorema, dan Implikasi Cloud</p>
            </div>
          </div>
          <button type="button" id="aoe-codex-close" class="aoe-stone-btn close-btn" title="Tutup Buku Strategi">&times;</button>
        </header>

        <nav class="aoe-era-tabs" aria-label="Bab Penjelasan">
          ${Object.keys(CODEX_CHAPTER_CONTENT)
            .map((k) => {
              const item = CODEX_CHAPTER_CONTENT[k];
              const active = k === this.currentChapterKey ? 'active' : '';
              return `
              <button type="button" class="aoe-era-tab ${active}" data-codex-chapter="${k}">
                <span class="era-icon">${item.icon}</span>
                <span class="era-name">${item.eraName}</span>
              </button>`;
            })
            .join('')}
        </nav>

        <div class="aoe-codex-body">
          <article class="aoe-codex-article">
            <div class="codex-title-card">
              <span class="codex-badge">Bab ${data.chapterNum}</span>
              <h3>${data.icon} ${data.title}</h3>
            </div>

            <div class="codex-sections">
              ${data.sections
                .map(
                  (s) => `
                <section class="codex-section-card">
                  <h4>${s.heading}</h4>
                  <div class="codex-section-content">${formatMathInHtml(s.content)}</div>
                </section>`
                )
                .join('')}
            </div>
          </article>
        </div>

        <footer class="aoe-tech-footer">
          <span class="hint">Buku strategi ini mencakup seluruh landasan teori untuk kebutuhan ujian, laporan, dan presentasi akademis.</span>
          <button type="button" class="aoe-stone-btn" onclick="document.getElementById('aoe-codex-close').click()">Kembali ke Panggung</button>
        </footer>
      </div>
    `;
  }
}
