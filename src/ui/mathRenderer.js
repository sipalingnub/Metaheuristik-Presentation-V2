/**
 * MathRenderer: Pemformat rumus matematis bergaya LaTeX murni di peramban.
 * Mengubah notasi LaTeX (seperti \frac, \sum, \max, eksponen, indeks bawah, simbol Yunani)
 * menjadi struktur HTML + CSS tipografi matematika yang elegan (tanpa ketergantungan CDN eksternal).
 */

const GREEK = {
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\delta': 'δ',
  '\\epsilon': 'ε',
  '\\varepsilon': 'ε',
  '\\theta': 'θ',
  '\\lambda': 'λ',
  '\\mu': 'μ',
  '\\sigma': 'σ',
  '\\tau': 'τ',
  '\\Delta': 'Δ',
  '\\Sigma': 'Σ',
  '\\Omega': 'Ω'
};

const SYMBOLS = {
  '\\times': '×',
  '\\cdot': '·',
  '\\in': '∈',
  '\\notin': '∉',
  '\\approx': '≈',
  '\\leq': '≤',
  '\\le': '≤',
  '\\geq': '≥',
  '\\ge': '≥',
  '\\neq': '≠',
  '\\ne': '≠',
  '\\to': '→',
  '\\gg': '≫',
  '\\ll': '≪',
  '\\infty': '∞',
  '\\forall': '∀',
  '\\exists': '∃',
  '\\pm': '±',
  '\\quad': '&nbsp;&nbsp;&nbsp;&nbsp;',
  '\\qquad': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
  '\\dots': '…',
  '\\ldots': '…',
  '\\mathcal{T}': '𝒯',
  '\\mathcal{V}': '𝒱',
  '\\mathcal{S}': '𝒮',
  '\\mathcal{A}': '𝒜',
  '\\mathbb{R}': 'ℝ',
  '\\mathbb{N}': 'ℕ'
};

/**
 * Format string LaTeX menjadi HTML berformat matematika indah.
 * @param {string} raw
 * @returns {string}
 */
export function formatMath(raw) {
  if (!raw) return '';
  let str = String(raw).trim();

  // Hapus tanda penutup $$ atau $ bila ada
  str = str.replace(/^\$\$(.*)\$\$$/s, '$1').replace(/^\$(.*)\$$/s, '$1').trim();

  // 1. Pecahan \frac{num}{denom}
  let prev;
  do {
    prev = str;
    str = str.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_, num, denom) => {
      return `<span class="m-frac"><span class="m-num">${formatMath(num)}</span><span class="m-denom">${formatMath(denom)}</span></span>`;
    });
  } while (str !== prev);

  // 2. Notasi Akar \sqrt{expr}
  str = str.replace(/\\sqrt\{([^{}]+)\}/g, (_, inner) => {
    return `<span class="m-sqrt"><span class="m-rad">√</span><span class="m-radicand">${formatMath(inner)}</span></span>`;
  });

  // 3. Notasi Summasi \sum_{sub}^{sup} atau \sum_{sub}
  str = str.replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, (_, sub, sup) => {
    return `<span class="m-op-wrap"><span class="m-sup">${formatMath(sup)}</span><span class="m-op">∑</span><span class="m-sub">${formatMath(sub)}</span></span>`;
  });
  str = str.replace(/\\sum_\{([^{}]+)\}/g, (_, sub) => {
    return `<span class="m-op-wrap"><span class="m-op">∑</span><span class="m-sub">${formatMath(sub)}</span></span>`;
  });

  // 4. Notasi Max / Min dengan indeks bawah
  str = str.replace(/\\max_\{([^{}]+)\}/g, (_, sub) => {
    return `<span class="m-op-wrap"><span class="m-text">max</span><span class="m-sub">${formatMath(sub)}</span></span>`;
  });
  str = str.replace(/\\min_\{([^{}]+)\}/g, (_, sub) => {
    return `<span class="m-op-wrap"><span class="m-text">min</span><span class="m-sub">${formatMath(sub)}</span></span>`;
  });

  // 5. Teks normal \text{...}
  str = str.replace(/\\text\{([^{}]+)\}/g, (_, txt) => `<span class="m-txt">${txt}</span>`);

  // 6. Tanda kurung lantai \lfloor ... \rfloor
  str = str.replace(/\\lfloor\s*(.*?)\s*\\rfloor/g, '⌊$1⌋');

  // 7. Simbol Yunani & Simbol Matematika
  for (const [k, v] of Object.entries(GREEK)) {
    str = str.replaceAll(k, `<span class="m-greek">${v}</span>`);
  }
  for (const [k, v] of Object.entries(SYMBOLS)) {
    str = str.replaceAll(k, `<span class="m-sym">${v}</span>`);
  }

  // 8. Superscript / Pangkat: ^2 atau ^{abc}
  str = str.replace(/\^\{([^{}]+)\}/g, (_, exp) => `<sup>${formatMath(exp)}</sup>`);
  str = str.replace(/\^([a-zA-Z0-9α-ωΑ-Ω*+-])/g, (_, exp) => `<sup>${exp}</sup>`);

  // 9. Subscript / Indeks Bawah: _{abc} atau _i
  str = str.replace(/_\{([^{}]+)\}/g, (_, sub) => `<sub>${formatMath(sub)}</sub>`);
  str = str.replace(/_([a-zA-Z0-9α-ωΑ-Ω*+-])/g, (_, sub) => `<sub>${sub}</sub>`);

  // 10. Variabel miring (italic math identifier)
  str = str.replace(/\b([a-zA-Z])\b(?![^<]*>)/g, '<i class="m-var">$1</i>');

  return `<span class="latex-math">${str}</span>`;
}

/**
 * Format paragraf atau blok teks yang mungkin berisi $...$ atau $$...$$ di dalamnya.
 * @param {string} text
 * @returns {string}
 */
export function formatMathInHtml(text) {
  if (!text) return '';
  // Format blok $$...$$
  let res = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, eq) => {
    return `<div class="math-display-card">${formatMath(eq)}</div>`;
  });
  // Format inline $...$
  res = res.replace(/\$([^$\n]+?)\$/g, (_, eq) => {
    return formatMath(eq);
  });
  return res;
}
