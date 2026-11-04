/**
 * Pohon Teknologi & Balai Pengetahuan (Age of Empires Tech Tree & Knowledge Codex).
 * Menyediakan pohon riset interaktif peradaban optimasi dan penjelasan akademis mendalam
 * untuk menjawab kebutuhan penjelasan yang komprehensif.
 */

import { sound } from '../core/sound.js';
import { formatMath, formatMathInHtml } from './mathRenderer.js';

export const TECH_TREE_DATA = {
  dark: {
    id: 'dark',
    name: 'Bab 1 · Krisis Cloud & NP-Hard',
    icon: '🏰',
    summary: 'Fondasi matematika penjadwalan komputasi awan, ledakan ruang pencarian kombinatorial, dan kegagalan pendekatan heuristik konvensional.',
    nodes: [
      {
        id: 'nphard',
        title: 'Kompleksitas NP-Hard & Ruang Pencarian',
        badge: 'Teori Dasar',
        icon: '🌌',
        formula: '|S| = m^n \\quad \\text{(Contoh: } 4^{16} = 4.294.967.296\\text{)}',
        desc: 'Penjadwalan tugas di komputasi awan heterogen terbukti merupakan masalah optimasi kombinatorial NP-Hard (Non-deterministic Polynomial-time hard). Setiap tugas independen i memiliki panjang komputasi MI_i (Million Instructions) dan dapat dialokasikan ke salah satu dari m Mesin Virtual (VM).',
        details: [
          'Dengan 16 tugas dan 4 VM, terdapat 4 pangkat 16 = 4.294.967.296 kemungkinan jadwal yang berbeda.',
          'Jika kita menambah menjadi 30 tugas, jumlah jadwal melonjak menjadi 4 pangkat 30 ≈ 1,15 × 10¹⁸ kemungkinan.',
          'Metode pencarian membabi buta (Brute-Force) akan memakan waktu ribuan tahun bahkan dengan superkomputer tercepat.',
          'Oleh karena itu, diperlukan algoritma metaheuristik yang mampu menemukan solusi mendekati optimum dalam waktu polinomial yang realistis.'
        ]
      },
      {
        id: 'makespan',
        title: 'Formulasi Makespan & Utilisasi Server',
        badge: 'Metrik Objektif',
        icon: '⏱️',
        formula: '\\text{Makespan} = \\max_{j \\in \\{1..m\\}} \\sum_{i \\in T_j} \\frac{MI_i}{MIPS_j}',
        desc: 'Makespan adalah waktu penyelesaian tugas terakhir dari seluruh mesin virtual yang bekerja. Nilai ini menjadi ukuran utama efisiensi penjadwalan: semakin kecil makespan, semakin cepat seluruh pekerjaan selesai dan semakin hemat biaya operasional data center.',
        details: [
          'Waktu eksekusi tugas i pada VM j dihitung secara deterministik: Waktu = MI_i / MIPS_j.',
          'Beban kerja total sebuah VM adalah jumlahan waktu dari semua tugas yang dialokasikan ke VM tersebut.',
          'Batas Bawah Ideal (Lower Bound) dihitung dengan membagi total instruksi (ΣMI) dengan total kapasitas pemrosesan (ΣMIPS). Tidak ada jadwal di dunia nyata yang bisa lebih cepat dari batas bawah teoretis ini.',
          'Penjadwal yang baik berusaha mendekati garis batas ideal ini dengan mendistribusikan beban secara proporsional sesuai kecepatan masing-masing VM.'
        ]
      },
      {
        id: 'heuristics',
        title: 'Kelemahan Heuristik Klasik (RR & Min-Min)',
        badge: 'Heuristik Klasik',
        icon: '📜',
        formula: 'T_{RR} \\gg T_{Ideal} \\quad ; \\quad \\text{Min-Min: Terjebak Local Minima}',
        desc: 'Algoritma deterministik sederhana seperti Round-Robin (bergilir) dan Min-Min (greedy) umum digunakan karena cepat, namun memiliki kelemahan fatal pada lingkungan komputasi heterogen.',
        details: [
          'Round-Robin (RR) membagi jumlah tugas secara merata tanpa mempertimbangkan ukuran tugas maupun kecepatan VM. Akibatnya, VM terlambat mendapat beban yang sama beratnya dengan VM tercepat, menciptakan kemacetan parah (makespan membengkak hingga 50-70% di atas batas ideal).',
          'Min-Min memilih tugas dengan waktu selesai tercepat lalu menugaskannya ke mesin terbaik. Meskipun lebih baik dari RR, Min-Min bersifat serakah (greedy) dan deterministik tanpa eksplorasi acak, sehingga rentan terjebak dalam jebakan lokal (local optima) dan membebani VM cepat secara berlebihan.'
        ]
      }
    ]
  },
  feudal: {
    id: 'feudal',
    name: 'Bab 2 · Ordo Kunang-Kunang / Firefly',
    icon: '💡',
    summary: 'Sains di balik Firefly Algorithm: hukum penyerapan cahaya Beer-Lambert, pergerakan berbasis daya tarik berjarak, dan kemampuan klasterisasi multimodal.',
    nodes: [
      {
        id: 'fa-rules',
        title: 'Tiga Postulat Ideal Xin-She Yang (2008)',
        badge: 'Biologi Komputasi',
        icon: '✨',
        formula: 'I(x) \\propto \\frac{1}{Fitness(x)} \\quad ; \\quad \\text{Unisex Swarm}',
        desc: 'Firefly Algorithm (FA) dikembangkan oleh Dr. Xin-She Yang di Cambridge University, terinspirasi dari pola kilatan cahaya bioluminesensi kunang-kunang tropis.',
        details: [
          'Aturan 1 (Uniseks): Semua kunang-kunang bersifat uniseks, artinya setiap individu dapat tertarik pada individu mana pun tanpa memandang jenis kelamin.',
          'Aturan 2 (Daya Tarik Berbanding Lurus dengan Kecerahan): Kunang-kunang yang lebih redup akan terbang tertarik menuju kunang-kunang yang lebih terang di sekitarnya. Jika tidak ada yang lebih terang, ia akan bergerak secara acak.',
          'Aturan 3 (Kecerahan Ditentukan Fungsi Tujuan): Kecerahan sebanding dengan nilai kualitas jadwal. Pada minimasi makespan, jadwal dengan waktu lebih singkat memancarkan cahaya yang jauh lebih terang benderang.'
        ]
      },
      {
        id: 'fa-beer',
        title: 'Hukum Penyerapan Cahaya Beer-Lambert & Beta',
        badge: 'Formulasi Fisika',
        icon: '🔦',
        formula: '\\beta(r) = \\beta_0 e^{-\\gamma r^2} \\quad ; \\quad I(r) = I_0 e^{-\\gamma r^2}',
        desc: 'Di dunia nyata, intensitas cahaya yang merambat melalui medium (udara atau kabut) mengalami penyerapan eksponensial. Hal ini dimodelkan secara matematis dengan fungsi Gaussian.',
        details: [
          'β₀ (Beta Nol): Daya tarik dasar saat dua kunang-kunang berada tepat bersebelahan (jarak r = 0). Lazimnya bernilai 1,0.',
          'γ (Gamma): Koefisien absorpsi/penyerapan cahaya oleh medium. Menentukan seberapa cepat daya tarik berkurang seiring bertambahnya jarak.',
          'Batas γ → 0: Cahaya tidak terserap sama sekali di medium hampa. Setiap kunang-kunang terlihat dari mana saja, sehingga algoritma berperilaku mirip Particle Swarm Optimization (PSO) global.',
          'Batas γ → ∞: Cahaya langsung padam oleh kabut pekat. Kunang-kunang tidak dapat melihat satu sama lain, sehingga seluruh swarm bergerak secara Random Walk murni.'
        ]
      },
      {
        id: 'fa-movement',
        title: 'Persamaan Pembaruan Posisi & Klaster Multimodal',
        badge: 'Dinamika Gerak',
        icon: '🌌',
        formula: 'x_i^{t+1} = x_i^t + \\beta_0 e^{-\\gamma r_{ij}^2}(x_j^t - x_i^t) + \\alpha \\epsilon_i',
        desc: 'Pergerakan kunang-kunang i menuju kunang-kunang j yang lebih terang terdiri atas dua komponen utama: vektor daya tarik terarah dan gangguan acak stochastic.',
        details: [
          'Komponen Tarikan (Eksploitasi): β₀ e^(-γ r_ij²) (x_j - x_i) menarik kunang-kunang i mendekati j.',
          'Komponen Acak (Eksplorasi): α ε_i menambahkan langkah acak kecil (Gaussian atau seragam di [-0.5, 0.5]) untuk mencegah konvergensi dini dan meloloskan diri dari lembah dangkal.',
          'Keunggulan Multimodal yang Unik: Karena Firefly tidak dipandu oleh SATU pemimpin absolut, swarm secara alami terbagi menjadi beberapa sub-populasi (klaster). Tiap klaster mengeksplorasi puncak yang berbeda secara simultan!'
        ]
      }
    ]
  },
  castle: {
    id: 'castle',
    name: 'Bab 3 · Legiun Kelelawar / Bat',
    icon: '🦇',
    summary: 'Mekanisme Bat Algorithm: ekolokasi ultrasonik, transisi dinamis antara kelantangan (A) dan laju pulsa (r), serta penyerbuan presisi di sekitar pemimpin terbaik.',
    nodes: [
      {
        id: 'ba-echolocation',
        title: 'Prinsip Ekolokasi Ultrasonik Mikro',
        badge: 'Sensor Alam',
        icon: '📡',
        formula: '\\lambda = \\frac{v}{f} \\quad ; \\quad f_i = f_{min} + (f_{max} - f_{min})\\beta',
        desc: 'Kelelawar mikro memancarkan pulsa suara ultrasonik pendek berfrekuensi tinggi (25–150 kHz) dan menangkap pantulan gema dari mangsa atau penghalang untuk membentuk citra akustik lingkungan.',
        details: [
          'Modulasi Frekuensi: Frekuensi f_i disesuaikan secara dinamis pada rentang [f_min, f_max] dengan bilangan acak β ∈ [0, 1].',
          'Panjang Gelombang: Panjang gelombang menentukan resolusi spasial. Gelombang ultrasonik berfrekuensi tinggi memiliki panjang gelombang pendek yang mampu mendeteksi detail kecil posisi jadwal terbaik.',
          'Kecepatan Terbang: Kelelawar mengatur kecepatan terbangnya sebanding dengan perbedaan frekuensi terhadap target mangsa.'
        ]
      },
      {
        id: 'ba-velocity',
        title: 'Vektor Kecepatan & Solusi Global Terbaik (x*)',
        badge: 'Penyerbuan Terarah',
        icon: '🏹',
        formula: 'v_i^{t+1} = v_i^t + (x^* - x_i^t)f_i \\quad ; \\quad x_i^{t+1} = x_i^t + v_i^{t+1}',
        desc: 'Berbeda dari kunang-kunang yang tertarik pada banyak tetangga, seluruh kelelawar dalam koloni dipandu oleh satu solusi terbaik global saat ini (dinotasikan x*).',
        details: [
          'Vektor Gerak Menuju Target: Kecepatan v_i diperbarui dengan mengalikan selisih posisi terhadap solusi terbaik (x* - x_i) dengan faktor frekuensi f_i.',
          'Catatan Kejujuran Ilmiah: Paper asli Xin-She Yang (2010) menulis v_i + (x_i - x*) f_i. Dalam implementasi praktis standar, tanda dibalik menjadi (x* - x_i) agar kelelawar terbang MENDEKATI posisi terbaik, sesuai deskripsi verbal biologisnya.',
          'Pembaruan Posisi: Posisi baru kelelawar diperoleh dengan menambahkan kecepatan baru ke posisi saat ini: x_i^(t+1) = x_i^t + v_i^(t+1).'
        ]
      },
      {
        id: 'ba-loudness',
        title: 'Dinamika Kelantangan (A) & Laju Denyut (r)',
        badge: 'Adaptasi Stokastik',
        icon: '🔊',
        formula: 'A_i^{t+1} = \\alpha A_i^t \\quad ; \\quad r_i^{t+1} = r_i^0 [1 - e^{-\\gamma t}]',
        desc: 'Kunci kecerdasan Bat Algorithm terletak pada transisi otomatis yang mulus dari eksplorasi global luas menuju eksploitasi lokal bedah presisi.',
        details: [
          'Fase Eksplorasi Awal: Kelantangan suara A bernilai tinggi (kelelawar berteriak keras mencari ke segala penjuru), sementara laju denyut r bernilai rendah (jarang memancarkan pulsa).',
          'Penelusuran Lokal Acak: Pada setiap langkah, jika angka acak rand > r_i, kelelawar melakukan penelusuran lokal di sekitar solusi terbaik: x_new = x* + ε <A^t>.',
          'Fase Eksploitasi Akhir: Begitu mangsa/solusi yang lebih baik ditemukan, kelantangan diredam (A = α A) agar tidak berisik, dan laju denyut ditingkatkan mendekati 1 (r naik eksponensial) untuk melakukan serangan presisi tinggi!'
        ]
      }
    ]
  },
  imperial: {
    id: 'imperial',
    name: 'Bab 4 · Penerapan Komputasi Awan',
    icon: '⚔️',
    summary: 'Teknik pemetaan ruang kontinu ke diskret, fungsi penalti sebaran beban VM, dan metodologi perbandingan eksperimen 10 beban kerja.',
    nodes: [
      {
        id: 'mapping',
        title: 'Pemetaan Kontinu ke Diskret (Floor vs SPV)',
        badge: 'Encoding Solusi',
        icon: '🧮',
        formula: 'VM_i = \\lfloor x_i \\rfloor \\in \\{0..m-1\\} \\quad \\text{atau SPV Ranking}',
        desc: 'FA dan BA secara alami bekerja pada ruang vektor kontinu ℝⁿ, sedangkan penugasan tugas ke VM adalah masalah optimasi kombinatorial diskret.',
        details: [
          'Metode Floor (Lantai): Domain pencarian diatur [0, m) untuk setiap tugas. Tugas i dialokasikan ke VM bernilai floor(x_i). Mudah, cepat, dan mempertahankan gradien pergerakan halus antar VM.',
          'Metode SPV (Smallest Position Value): Mengurutkan elemen posisi kontinu dari terkecil ke terbesar untuk menghasilkan permutasi indeks urutan tugas (banyak digunakan pada penjadwalan antrean Grid/Workflow seperti pada paper Yousif dkk., 2011).',
          'Di simulator ini digunakan metode Floor langsung agar tiap perubahan posisi partikel langsung berdampak intuitif pada migrasi tugas antar mesin.'
        ]
      },
      {
        id: 'fitness-penalty',
        title: 'Fungsi Fitness Hibrida: Makespan + Penalti Deviasi',
        badge: 'Optimasi Objektif',
        icon: '⚖️',
        formula: 'Fitness = \\text{Makespan} + 0,001 \\cdot \\sigma(\\text{Beban VM})',
        desc: 'Fungsi objektif utama adalah makespan murni. Namun bila ada dua jadwal dengan makespan yang sama persis, jadwal mana yang lebih unggul?',
        details: [
          'Suku Pemecah Seri (Tie-Breaker): Ditambahkan suku bobot sangat kecil (0,001) yang dikalikan dengan deviasi standar sebaran beban antar VM.',
          'Keseimbangan Beban: Jika dua jadwal sama-sama menyelesaikan pekerjaan dalam 120 detik, jadwal yang membagi tugas lebih merata di antara semua VM akan mendapatkan skor fitness sedikit lebih rendah (lebih baik).',
          'Suku ini tidak pernah mendistorsi makespan utama karena koefisiennya yang sangat kecil, menjaga integritas pengujian ilmiah.'
        ]
      },
      {
        id: 'benchmarks',
        title: 'Metodologi Eksperimen & Perbandingan Adil',
        badge: 'Validitas Ilmiah',
        icon: '📊',
        formula: '\\text{Anggaran Evaluasi: } N \\times \\text{Iterasi} \\quad ; \\quad \\text{Populasi Awal Bersama}',
        desc: 'Perbandingan ilmiah yang jujur dan valid mewajibkan syarat keadilan yang ketat:',
        details: [
          '1. Beban Kerja Identik: Kumpulan tugas (MI) dan spesifikasi VM (MIPS) yang sama persis diberikan ke kedua algoritma.',
          '2. Populasi Awal Bersama: Firefly dan Bat diinisialisasi dari koordinat titik awal yang sama persis menggunakan PRNG ber-seed.',
          '3. Anggaran Evaluasi Sama: Keduanya dievaluasi tepat N kali per iterasi, memastikan tidak ada algoritma yang diuntungkan oleh komputasi tersembunyi.',
          '4. Verifikasi Multi-Workload: Pengujian dilakukan pada 10 beban kerja berbeda dengan variasi seed acak untuk menghindari bias kebetulan.'
        ]
      }
    ]
  },
  wonder: {
    id: 'wonder',
    name: 'Bab 5 · Sintesis & Perbandingan Ilmiah',
    icon: '🏛️',
    summary: 'Bedah komparatif komprehensif antara Firefly Algorithm dan Bat Algorithm: kompleksitas waktu, sensitivitas parameter, dan panduan pemilihan di dunia industri.',
    nodes: [
      {
        id: 'comparison-matrix',
        title: 'Matriks Perbandingan Mendalam: FA vs BA',
        badge: 'Analisis Komparatif',
        icon: '⚔️',
        formula: '\\text{FA: } O(n^2 \\cdot d) \\quad \\text{vs} \\quad \\text{BA: } O(n \\cdot d)',
        desc: 'Tabel perbandingan arsitektural antara kedua algoritma:',
        details: [
          'Kompleksitas Waktu per Iterasi: FA memerlukan O(n²) perbandingan karena setiap individu membandingkan diri dengan seluruh populasi. BA hanya memerlukan O(n) karena setiap individu hanya tertarik pada satu pemimpin global (x*).',
          'Kemampuan Multimodal: FA jauh lebih tangguh terhadap jebakan optimum lokal karena mampu membagi swarm menjadi beberapa kelompok mandiri. BA cenderung konvergen cepat ke satu titik, namun berisiko terjebak bila x* berada di lembah lokal.',
          'Jumlah Parameter: FA memiliki 3 parameter utama (β₀, γ, α). BA memiliki 4 parameter yang saling bertaut (A₀, r₀, α_A, γ_r), sehingga BA memerlukan waktu penalaan (fine-tuning) yang lebih cermat.',
          'Kecepatan Konvergensi: BA umumnya lebih cepat menemukan solusi bagus pada iterasi awal, sementara FA melakukan pencarian yang lebih menyeluruh dan halus.'
        ]
      },
      {
        id: 'no-free-lunch',
        title: 'Teorema No Free Lunch & Rekomendasi Industri',
        badge: 'Kesimpulan Filosofis',
        icon: '👑',
        formula: '\\sum_f P(d_m^y | f, m_1) = \\sum_f P(d_m^y | f, m_2) \\quad \\text{(Wolpert & Macready, 1997)}',
        desc: 'Teorema No Free Lunch (NFL) menyatakan bahwa tidak ada satu algoritma optimasi yang mutlak unggul di semua jenis permasalahan.',
        details: [
          'Kapan Memilih Firefly Algorithm: Ketika lanskap penjadwalan sangat bergelombang, memiliki banyak batasan rumit (multiconstraints), atau ketika ukuran populasi relatif kecil sehingga biaya O(n²) tidak menjadi hambatan.',
          'Kapan Memilih Bat Algorithm: Ketika sistem membutuhkan respon penjadwalan yang sangat cepat (near real-time), populasi besar, dan struktur penjadwalan relatif teratur di mana kecepatan konvergensi menuju x* sangat menguntungkan.',
          'Di komputasi awan riil, kedua algoritma secara konsisten mengalahkan heuristik tradisional seperti Round-Robin dan Min-Min dengan selisih efisiensi makespan mencapai 20–40%.'
        ]
      }
    ]
  }
};

export class TechTreeModal {
  constructor() {
    this.modal = null;
    this.activeEra = 'dark';
    this.selectedNode = TECH_TREE_DATA.dark.nodes[0];
  }

  mount(root) {
    if (this.modal) return;
    const el = document.createElement('div');
    el.id = 'aoe-tech-tree-modal';
    el.className = 'aoe-modal-backdrop hidden';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Pohon Teknologi & Balai Pengetahuan');
    root.appendChild(el);
    this.modal = el;
    this.#render();
    this.#bind();
  }

  open(nodeId = null) {
    if (!this.modal) return;
    if (nodeId) {
      for (const eraKey of Object.keys(TECH_TREE_DATA)) {
        const found = TECH_TREE_DATA[eraKey].nodes.find((n) => n.id === nodeId);
        if (found) {
          this.activeEra = eraKey;
          this.selectedNode = found;
          break;
        }
      }
    }
    this.modal.classList.remove('hidden');
    sound.playHorn();
    this.#render();
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    sound.playClick();
  }

  toggle() {
    if (this.modal?.classList.contains('hidden')) this.open();
    else this.close();
  }

  #bind() {
    this.modal.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('#aoe-tech-close');
      if (closeBtn || e.target === this.modal) {
        this.close();
        return;
      }

      const eraTab = e.target.closest('[data-era]');
      if (eraTab) {
        sound.playClick();
        this.activeEra = eraTab.dataset.era;
        this.selectedNode = TECH_TREE_DATA[this.activeEra].nodes[0];
        this.#render();
        return;
      }

      const nodeBtn = e.target.closest('[data-node-id]');
      if (nodeBtn) {
        sound.playClick();
        const id = nodeBtn.dataset.nodeId;
        const era = TECH_TREE_DATA[this.activeEra];
        this.selectedNode = era.nodes.find((n) => n.id === id) || era.nodes[0];
        this.#render();
      }
    });
  }

  #render() {
    const era = TECH_TREE_DATA[this.activeEra];
    const node = this.selectedNode;

    this.modal.innerHTML = `
      <div class="aoe-tech-window">
        <header class="aoe-tech-header">
          <div class="aoe-tech-title-wrap">
            <span class="aoe-crest">🏛️</span>
            <div>
              <h2>POHON TEKNOLOGI & BALAI PENGETAHUAN</h2>
              <p>Ensiklopedia Komparatif Algoritma Metaheuristik Penjadwalan Komputasi Awan</p>
            </div>
          </div>
          <button type="button" id="aoe-tech-close" class="aoe-stone-btn close-btn" title="Tutup Balai Pengetahuan">&times;</button>
        </header>

        <nav class="aoe-era-tabs" aria-label="Pilihan Zaman">
          ${Object.keys(TECH_TREE_DATA)
            .map((k) => {
              const d = TECH_TREE_DATA[k];
              const active = k === this.activeEra ? 'active' : '';
              return `
              <button type="button" class="aoe-era-tab ${active}" data-era="${k}">
                <span class="era-icon">${d.icon}</span>
                <span class="era-name">${d.name.split('(')[0].trim()}</span>
              </button>`;
            })
            .join('')}
        </nav>

        <div class="aoe-tech-body">
          <aside class="aoe-tech-tree-col">
            <div class="aoe-era-summary">
              <h3>${era.name}</h3>
              <p>${era.summary}</p>
            </div>
            <div class="aoe-node-branch">
              ${era.nodes
                .map((n) => {
                  const sel = n.id === node.id ? 'selected' : '';
                  return `
                  <button type="button" class="aoe-tech-node-btn ${sel}" data-node-id="${n.id}">
                    <span class="node-icon">${n.icon}</span>
                    <div class="node-text">
                      <b class="node-title">${n.title}</b>
                      <small class="node-badge">${n.badge}</small>
                    </div>
                  </button>`;
                })
                .join('')}
            </div>
          </aside>

          <main class="aoe-tech-detail-col">
            <article class="aoe-parchment-card">
              <div class="parchment-header">
                <span class="parchment-badge">${node.badge}</span>
                <h3 class="parchment-title">${node.icon} ${node.title}</h3>
              </div>

              ${node.formula ? `<div class="aoe-formula-box">${formatMath(node.formula)}</div>` : ''}

              <p class="aoe-main-desc">${formatMathInHtml(node.desc)}</p>

              <div class="aoe-deep-points">
                <h4>📜 Penjelasan Mendalam & Implikasi Ilmiah:</h4>
                <ul>
                  ${node.details.map((d) => `<li>${formatMathInHtml(d)}</li>`).join('')}
                </ul>
              </div>
            </article>
          </main>
        </div>

        <footer class="aoe-tech-footer">
          <span class="hint">Gunakan tombol Era di atas untuk menelusuri perkembangan konsep dari dasar hingga sintesis akhir.</span>
          <button type="button" class="aoe-stone-btn" onclick="document.getElementById('aoe-tech-close').click()">Kembali ke Simulasi</button>
        </footer>
      </div>
    `;
  }
}
