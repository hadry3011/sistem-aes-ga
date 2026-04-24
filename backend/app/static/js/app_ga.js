if (typeof gid === 'undefined') {
  var gid = (id) => document.getElementById(id);
}

// SweetAlert2 helper
function showAlert(title, text, icon) {
  Swal.fire({ title, text, icon, confirmButtonText: "OK" });
}

/**
 * Render progress indicator bar untuk proses enkripsi/dekripsi
 * @param {number} currentStep - Step saat ini (1-N)
 * @param {Array} stepNames - Nama-nama step
 * @returns {string} HTML string untuk stepper
 */
function renderProcessStepper(currentStep, stepNames) {
  const totalSteps = stepNames.length;
  const isEncryption = stepNames[0] === "Key Expansion";
  const title = isEncryption ? "Proses Enkripsi" : "Proses Dekripsi";

  let html = `<div style="margin-bottom:20px;">`;
  
  // Ikon informasi lingkaran biru dan judul teks
  html += `
    <div style="text-align:center; margin-bottom:15px; display: flex; align-items: center; justify-content: center; gap: 12px;">
      <span style="font-size: 20px; font-weight: bold; color: #333;">${title}</span>
      <div style="display:inline-flex; align-items:center; justify-content:center; width:45px; height:45px; border-radius:50%; background:#e7f3ff; color:#007bff; border:2px solid #007bff; font-size:24px; font-weight:bold; font-family:serif;">
        i
      </div>
    </div>`;

  html += `<div style="display:flex; justify-content:space-between; align-items:center; gap:5px; flex-wrap:nowrap; background:#f8f9fa; padding:12px; border-radius:10px; border:1px solid #dee2e6;">`;

  for (let i = 1; i <= totalSteps; i++) {
    let bgColor, textColor, icon, boxShadow;
    if (i < currentStep) {
      bgColor = '#28a745'; textColor = '#fff'; icon = '✓ '; boxShadow = '0 2px 4px rgba(40, 167, 69, 0.3)';
    } else if (i === currentStep) {
      bgColor = '#007bff'; textColor = '#fff'; icon = '● '; boxShadow = '0 2px 8px rgba(0, 123, 255, 0.4)';
    } else {
      bgColor = '#e9ecef'; textColor = '#6c757d'; icon = ''; boxShadow = 'none';
    }

    if (i > 1) {
      const lineColor = i <= currentStep ? '#28a745' : '#dee2e6';
      html += `<div style="flex:1; height:3px; background:${lineColor}; min-width:5px;"></div>`;
    }

    html += `<div style="flex:0 0 auto; padding:6px 10px; background:${bgColor}; color:${textColor}; border-radius:12px; font-size:10px; font-weight:600; text-align:center; box-shadow:${boxShadow};">
        ${icon}${stepNames[i-1]}
      </div>`;
  }
  html += `</div></div>`;
  return html;
}

/**
 * Render evolution stepper untuk GA key generation
 * @param {string} currentStep - Step saat ini ('init', 'eval', 'select', 'crossover', 'offspring', 'mutation', 'result')
 * @param {number} currentGen - Generasi saat ini (0-60)
 * @param {number} totalGen - Total generasi (60)
 * @returns {string} HTML string untuk stepper
 */
function renderGAEvolutionStepper(currentStep, currentGen, totalGen) {
  const steps = [
    { id: 'init', label: 'Init', full: 'Inisialisasi' },
    { id: 'eval', label: 'Eval', full: 'Evaluasi Fitness' },
    { id: 'select', label: 'Select', full: 'Seleksi Parent' },
    { id: 'cross', label: 'Cross', full: 'Crossover' },
    { id: 'mutate', label: 'Mutate', full: 'Mutasi Bit' },
    { id: 'result', label: 'Hasil', full: 'Hasil Generasi' }
  ];

  const stepOrder = steps.map(s => s.id);
  const currentIndex = stepOrder.indexOf(currentStep);

  let html = '<div style="margin-bottom:15px;">';
  html += '<div style="padding:12px; background:#f8f9fa; border-radius:8px;">';
  html += '<div style="display:flex; justify-content:space-between; align-items:center; gap:4px; flex-wrap:wrap;">';

  steps.forEach((step, index) => {
    // Line connector
    if (index > 0) {
      const lineColor = index <= currentIndex ? '#28a745' : '#dee2e6';
      html += `<div style="flex:1; height:3px; background:${lineColor}; min-width:10px; border-radius:2px;"></div>`;
    }

    // Step bubble
    let bgColor, textColor, icon, shadow;
    if (index < currentIndex) {
      // Selesai
      bgColor = '#28a745';
      textColor = '#fff';
      icon = '✓';
      shadow = '0 2px 4px rgba(40,167,69,0.3)';
    } else if (index === currentIndex) {
      // Aktif
      bgColor = '#007bff';
      textColor = '#fff';
      icon = '●';
      shadow = '0 2px 8px rgba(0, 123, 255, 0.4)';
    } else {
      // Belum
      bgColor = '#e9ecef';
      textColor = '#6c757d';
      icon = '';
      shadow = 'none';
    }

    html += `
      <div style="
        flex:0 0 auto;
        padding:4px 8px;
        background:${bgColor};
        color:${textColor};
        border-radius:12px;
        font-size:10px;
        font-weight:600;
        text-align:center;
        box-shadow:${shadow};
        min-width:45px;
      " title="${step.full}">
        ${icon} ${step.label}
      </div>
    `;
  });

  html += '</div>';

  // Progress info
  if (currentGen > 0) {
    const progressPercent = totalGen > 0 ? Math.round((currentGen / totalGen) * 100) : 0;
    html += '<div style="margin-top:10px; font-size:11px; color:#6c757d; text-align:center;">';
    html += `📊 Generasi: ${currentGen}/${totalGen} (${progressPercent}%)`;
    html += '</div>';
  }
  html += '</div></div>';

  return html;
}

// Helper to render full candidate table with fitness
function renderAllCandidatesTable(candidates) {
  if (!Array.isArray(candidates) || !candidates.length) return "Data tidak tersedia.";
  const selectCount = 30; 
  return `
    <div style="max-height: 350px; overflow-y: auto; border: 1px solid #ddd; background: #fff; margin-top:10px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
        <thead style="position: sticky; top: 0; background: #007bff; color: white; z-index: 1;">
          <tr>
            <th style="padding: 6px; border: 1px solid #ddd; width: 40px; text-align: center;">Rank</th>
            <th style="padding: 6px; border: 1px solid #ddd;">Kunci (Hex)</th>
            <th style="padding: 6px; border: 1px solid #ddd; width: 70px; text-align: center;">Fitness</th>
          </tr>
        </thead>
        <tbody>
          ${candidates.map(c => `
            <tr style="background: ${c.rank <= selectCount ? '#e8f5e9' : 'white'};">
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${c.rank}</td>
              <td style="padding: 4px; border: 1px solid #ddd; font-family: monospace; letter-spacing: 0.5px;">${esc(c.key_hex)}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${esc(c.fitness)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function formatKB(bytes) {
  if (!bytes && bytes !== 0) return "-";
  return (bytes / 1024).toFixed(2) + " KB";
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function renderSelection(selectionArr) {
  if (!Array.isArray(selectionArr) || !selectionArr.length) return "-";
  return selectionArr.map((s, i) => `
    <div style="margin-bottom:8px;">
      <b>${i + 1})</b><br>
      A (fit=${esc(s.parentA_fitness)}): <code>${esc(s.parentA_preview)}</code><br>
      B (fit=${esc(s.parentB_fitness)}): <code>${esc(s.parentB_preview)}</code>
    </div>
  `).join("");
}

function renderCrossover(crossArr) {
  if (!Array.isArray(crossArr) || !crossArr.length) return "-";
  return crossArr.map((c, i) => `
    <div style="margin-bottom:8px;">
      <b>${i + 1})</b><br>
      Parent 1: <code>${esc(c.parent1_preview)}</code><br>
      Parent 2: <code>${esc(c.parent2_preview)}</code><br>
      → Child 1: <code>${esc(c.child1_preview)}</code><br>
      → Child 2: <code>${esc(c.child2_preview)}</code>
    </div>
  `).join("");
}

function renderMutation(mutArr) {
  if (!Array.isArray(mutArr) || !mutArr.length) return "-";
  return mutArr.map((m, i) => `
    <div style="margin-bottom:8px;">
      <b>${i + 1})</b><br>
      Child: <code>${esc(m.child_preview)}</code>
    </div>
  `).join("");
}

function renderTopCandidates(candidates) {
  if (!Array.isArray(candidates) || !candidates.length) return "-";
  return candidates.map((c, i) => `
    <div style="margin-bottom:4px;">
      <b>#${c.rank}:</b> <code>${esc(c.key_hex || c.key_preview)}</code> (fit=${esc(c.fitness)})
    </div>
  `).join("");
}

// FUNGSI BARU: Render tabel seleksi hanya untuk parent terpilih
function renderSelectionTables(selected, eliminated) {
  if (!Array.isArray(selected) || !selected.length) return "Data seleksi tidak tersedia.";

  const selectedHtml = `
    <div style="margin-bottom: 15px;">
      <b style="font-size: 14px; color: #28a745;">✓ Parent Terpilih (Fitness Tinggi)</b><br>
      <small>Jumlah: ${selected.length} kandidat</small>
      <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; margin-top: 8px; background: #f8f9fa;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead style="position: sticky; top: 0; background: #007bff; color: white; z-index: 1;">
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; width: 50px; text-align: center;">No</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Kunci (Hex)</th>
              <th style="padding: 8px; border: 1px solid #ddd; width: 80px; text-align: center;">Fitness</th>
            </tr>
          </thead>
          <tbody>
            ${selected.map(s => `
              <tr>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${s.rank}</td>
                <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace; letter-spacing: 1px;">${esc(s.key_hex)}</td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${esc(s.fitness)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <small style="color: #28a745; display: block; margin-top: 5px;">→ Kandidat dengan fitness tertinggi dipilih sebagai parent untuk proses crossover</small>
    </div>
  `;

  return `
    <div style="text-align: left;">
      ${selectedHtml}
    </div>
  `;
}

// FUNGSI BARU: Render pasangan crossover dengan titik crossover visual
function renderCrossoverPairs(pairs) {
  if (!Array.isArray(pairs) || !pairs.length) return "Data crossover tidak tersedia.";

  return pairs.map((p, i) => {
    const pointStr = p.point_byte; // Format "X&Y"
    const isCrossover = pointStr !== "none" && pointStr !== null;

    const formatKeyWithBrackets = (hexSpaced) => {
      if (!hexSpaced) return "";
      const bytes = hexSpaced.split(" ");
      return bytes.map(b => `[${b}]`).join(" ");
    };

    // Helper untuk menyisipkan separator di antara bracket
    const insertSeparatorVisual = (hexSpaced, pStr) => {
      const bytes = hexSpaced.split(" ");
      if (!pStr || pStr === "none") return bytes.map(b => `[${b}]`).join(" ");
      
      const points = pStr.split("&").map(Number);
      let result = "";
      bytes.forEach((b, idx) => {
        result += `[${b}] `;
        if (points.includes(idx + 1)) {
          result += "| ";
        }
      });
      return result.trim();
    };

    const p1WithSep = insertSeparatorVisual(p.parent1_hex, pointStr);
    const p2WithSep = insertSeparatorVisual(p.parent2_hex, pointStr);
    const childFormatted = formatKeyWithBrackets(p.child_hex);

    // Build arrow line
    const buildArrowLine = (pStr) => {
      if (!pStr || pStr === "none") return "";
      const points = pStr.split("&").map(Number);
      
      // Hitung posisi karakter untuk panah
      // Setiap byte [XX] = 4 karakter + 1 spasi = 5 karakter
      // Separator | menambah 2 karakter ("| ")
      
      let line = "    "; // Offset untuk "P1: " atau "P2: "
      let currentPos = 0;
      let arrows = Array(100).fill(" ");
      
      let visualIdx = 0;
      for(let i=1; i<=16; i++) {
          visualIdx += 5; // [XX] + spasi
          if (points.includes(i)) {
              arrows[visualIdx - 2] = "↑";
              visualIdx += 2; // | + spasi
          }
      }
      return "    " + arrows.join("").trimEnd();
    };

    const arrowLine = isCrossover ? buildArrowLine(pointStr) : "";

    return `
      <div style="margin-bottom: 20px; padding: 12px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; overflow-x: auto;">
        <b style="font-size: 14px; color: #007bff;">Pasangan ${i + 1}</b><br><br>
        <div style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 12px; line-height: 1.5; white-space: pre; background: #fff; padding: 10px; border: 1px solid #eee;">
P1: ${p1WithSep}
P2: ${p2WithSep}
${arrowLine ? `<span style="color: #dc3545; font-weight: bold;">${arrowLine}</span>` : ""}
${isCrossover ? `<span style="color: #28a745; font-style: italic;">Titik Crossover (Byte ke-${pointStr})</span>` : ""}

<b>Hasil:</b>
${childFormatted}
        </div>
      </div>
    `;
  }).join("");
}

// FUNGSI BARU: Render pasangan mutasi dengan before/after comparison
function renderMutationPairs(pairs) {
  if (!Array.isArray(pairs) || !pairs.length) return "Data mutasi tidak tersedia.";

  return pairs.map((m, i) => {
    const formatKeyWithBrackets = (hexSpaced) => {
      if (!hexSpaced) return "";
      const bytes = hexSpaced.split(" ");
      return bytes.map(b => `[${b}]`).join(" ");
    };

    const beforeFormatted = formatKeyWithBrackets(m.before_hex);
    const afterFormatted = formatKeyWithBrackets(m.after_hex);
    const mPoints = m.mutation_points || [];

    // Build arrow line for mutation
    const buildMutationArrowLine = (points) => {
        let arrows = Array(100).fill(" ");
        points.forEach(p => {
            // Setiap [XX] spasi = 5 karakter. Panah di tengah [XX] yaitu index ke-1 atau 2.
            // Posisi: p*5 + 1
            arrows[p * 5 + 1] = "↑";
        });
        return "         " + arrows.join("").trimEnd(); // Offset untuk "Sebelum: "
    };

    const arrowLine = buildMutationArrowLine(mPoints);

    return `
      <div style="margin-bottom: 20px; padding: 12px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; overflow-x: auto;">
        <b style="font-size: 14px; color: #007bff;">Kandidat ${i + 1}</b><br><br>
        <div style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 12px; line-height: 1.5; white-space: pre; background: #fff; padding: 10px; border: 1px solid #eee;">
<b>Sebelum:</b>
${beforeFormatted}

${arrowLine ? `<span style="color: #dc3545; font-weight: bold;">${arrowLine}</span>` : ""}
<span style="color: #28a745; font-style: italic;">Titik Mutasi (Byte ke-${mPoints.map(p => p+1).join(", ")})</span>

<b>Sesudah:</b>
${afterFormatted}
        </div>
      </div>
    `;
  }).join("");
}

// FUNGSI BARU: Render tabel hasil mutasi (40 populasi)
function renderMutationResults(results) {
  if (!Array.isArray(results) || !results.length) return "Data hasil mutasi tidak tersedia.";

  return `
    <div style="text-align: left;">
      <b style="font-size: 14px;">Jumlah Populasi:</b> ${results.length} kandidat<br><br>
      <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; margin-top: 8px; background: #f8f9fa;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead style="position: sticky; top: 0; background: #28a745; color: white; z-index: 1;">
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd; width: 50px; text-align: center;">No</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Kunci Hasil (Hex)</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(r => `
              <tr>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${r.rank}</td>
                <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace; letter-spacing: 1px;">${esc(r.key_hex)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <small style="color: #6c757d; display: block; margin-top: 10px;">
        → Populasi tetap ${results.length} kandidat<br>
        → Digunakan untuk proses evaluasi fitness
      </small>
    </div>
  `;
}

// FUNGSI BARU: Render keys preview tanpa fitness (untuk Step 1 - Initialization)
function renderKeysPreview(keys) {
  if (!Array.isArray(keys) || !keys.length) return "-";
  return keys.map((k, i) => `
    <div style="margin-bottom:4px;">
      <b>#${k.rank}:</b> <code>${esc(k.key_hex || k.key_preview)}</code>
    </div>
  `).join("");
}

function explainStopReason(reason) {
  switch (reason) {
    case "threshold_reached":
      return "Fitness optimal tercapai";
    case "stagnation":
      return "Tidak ada peningkatan signifikan";
    case "max_generations":
      return "Mencapai batas maksimum";
    default:
      return reason || "-";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const fileIn = gid("fileIn");

  const btnGenKey = gid("btnGenKey");
  const btnEncFile = gid("btnEncFile");
  const btnEntropy = gid("btnEntropy");
  const btnNist = gid("btnNist");
  const btnDec = gid("btnDec");
  const btnSaveHistory = gid("btnSaveHistory");
  const btnBackToHome = gid("btnBackToHome");

  const note = gid("note");

  const fname = gid("fname");
  const fsize = gid("fsize");
  const fmode = gid("fmode");

  // Guard: Check if we're on GA page
  if (fmode && fmode.textContent !== "AES-128-GA") {
    console.log("[app_ga.js] Not on GA page (fmode =", fmode.textContent, "), skipping initialization");
    return;
  }
  console.log("[app_ga.js] GA mode detected, initializing...");

  const gaResult = gid("gaResult");
  const gaKeyEl = gid("ga_key");
  const gaKeyHexEl = gid("ga_key_hex");
  const gaInfoEl = gid("ga_info");

  const cipherEl = gid("cipher_b64");
  const keyEl = gid("key");
  const keyHexEl = gid("key_hex");
  const encmsEl = gid("encms");
  const decmsEl = gid("decms");

  const testOut = gid("testOut");


  const MAX_SIZE = 2 * 1024 * 1024;
  const ALLOWED = ["pdf", "docx"];

  let gaKeyB64 = null;            // key hasil GA (base64)
  let lastPackage = null;         // package enkripsi AES+GA
  let lastMeta = {
    mode: "AES-128-GA",
    filename: "-",
    size_kb: "-",
    encrypt_ms: "-",
    decrypt_ms: "-",
    entropy_cipher: "-",
    nist_frequency: "-",
    nist_runs: "-",
    nist_freq_p: "-",
    nist_runs_p: "-"
  };

  function setNote(msg, isError = true) {
    if (!note) return;
    note.textContent = msg || "";
    note.style.color = isError ? "#b42318" : "#067647";
  }

  function resetAll() {
    gaKeyB64 = null;
    lastPackage = null;

    if (gaResult) gaResult.style.display = "none";
    if (gaKeyEl) gaKeyEl.value = "";
    if (gaKeyHexEl) gaKeyHexEl.value = "";
    if (gaInfoEl) gaInfoEl.value = "";

    if (cipherEl) cipherEl.value = "";
    if (keyEl) keyEl.value = "";
    if (keyHexEl) keyHexEl.value = "";
    if (encmsEl) encmsEl.value = "";
    if (decmsEl) decmsEl.value = "";
    if (testOut) testOut.value = "";

    lastMeta.encrypt_ms = "-";
    lastMeta.decrypt_ms = "-";
    lastMeta.entropy_cipher = "-";
    lastMeta.nist_frequency = "-";
    lastMeta.nist_runs = "-";
    lastMeta.nist_freq_p = "-";
    lastMeta.nist_runs_p = "-";

    btnGenKey.disabled = true;
    btnEncFile.disabled = true;
    btnEntropy.disabled = true;
    btnNist.disabled = true;
    btnDec.disabled = true;
    btnSaveHistory.disabled = true;
  }

  resetAll();


  // =========================
  // FILE CHANGE
  // =========================
  fileIn.addEventListener("change", () => {
    setNote("");
    resetAll();

    const f = fileIn.files && fileIn.files[0];
    if (!f) {
      fname.textContent = "-";
      fsize.textContent = "-";
      fmode.textContent = "AES-128-GA";
      return;
    }

    const ext = f.name.split(".").pop().toLowerCase();
    if (!ALLOWED.includes(ext)) {
      showAlert("Error", "Format file harus PDF atau DOCX.", "error");
      fileIn.value = "";
      return;
    }
    if (f.size > MAX_SIZE) {
      showAlert("Error", "Ukuran file maksimal 2MB.", "error");
      fileIn.value = "";
      return;
    }

    fname.textContent = f.name;
    fsize.textContent = formatKB(f.size);
    fmode.textContent = "AES-128-GA";

    lastMeta.filename = f.name;
    lastMeta.size_kb = (f.size / 1024).toFixed(2);

    btnGenKey.disabled = false;
    setNote("File valid. Klik 'Generate Key (GA)' dulu.", false);
  });

  if (btnBackToHome) {
    btnBackToHome.addEventListener("click", () => {
      window.location.href = "http://127.0.0.1:5000/";
    });
  }

  // =========================
  // GENERATE KEY (GA) - kirim file ke backend
  // =========================
  btnGenKey.addEventListener("click", async () => {
    const f = fileIn.files && fileIn.files[0];
    if (!f) {
      showAlert("Error", "Pilih file dulu.", "error");
      return;
    }

    try {
      btnGenKey.disabled = true;
      btnEncFile.disabled = true;

      await Swal.fire({
        title: "Generate Key (GA)",
        text: "Memulai proses Algoritma Genetika...",
        icon: "info",
        confirmButtonText: "Mulai"
      });

      const fd = new FormData();
      fd.append("file", f);

      // Advanced GA settings
      const population = document.getElementById("population");
      const generations = document.getElementById("generations");
      const mutationRate = document.getElementById("mutation_rate");
      const crossoverRate = document.getElementById("crossover_rate");
      const fitnessThreshold = document.getElementById("fitness_threshold");

      if (population) fd.append("population", population.value);
      if (generations) fd.append("generations", generations.value);
      if (mutationRate) fd.append("mutation_rate", mutationRate.value);
      if (crossoverRate) fd.append("crossover_rate", crossoverRate.value);
      if (fitnessThreshold) fd.append("fitness_threshold", fitnessThreshold.value);

      Swal.fire({
        title: "Proses GA...",
        html: "Sedang menjalankan algoritma genetika...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const res = await fetch("/api/aesga/generate_key", {
        method: "POST",
        body: fd
      });

      const data = await res.json();
      Swal.close();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Gagal generate key");
      }

      const meta = data.ga_meta || {};
      const keyB64 = data.key_b64;
      const trace = data.trace || [];

      // =========================
      // TAMPILKAN LANGKAH-LANGKAH GA
      // =========================

      let step = 1;

      while (true) {
        // ================= STEP 1: INISIALISASI =================
        if (step === 1) {
          const s1 = trace.find(t => t.step === 1);
          if (!s1) { step = 7; continue; }
          const html = `
            ${renderGAEvolutionStepper('init', 0, 0)}
            <div style="text-align:left">
              <b>Populasi Awal:</b> ${s1.population_size || 60} kandidat<br><br>
              <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 5px; background: #fff;">
                ${renderKeysPreview(s1.keys_preview)}
              </div>
            </div>
          `;
          const res = await Swal.fire({ 
            title: "Langkah 1 — Inisialisasi", 
            html, 
            icon: "info", 
            confirmButtonText: "Evaluasi Fitness →",
            showDenyButton: true,
            denyButtonText: "⏩ Skip",
            denyButtonColor: "#6c757d"
          });
          if (res.isDenied) { step = 7; continue; }
          if (res.isConfirmed) step = 2; else break;
        }

        // ================= STEP 2: EVALUASI (G0) =================
        else if (step === 2) {
          const s2 = trace.find(t => t.step === 2);
          if (!s2) { step = 3; continue; }
          const html = `
            ${renderGAEvolutionStepper('eval', 0, 0)}
            <div style="text-align:left">
              <div style="background:#f8f9fa; padding:8px; border-radius:8px; margin-bottom:10px; border:1px solid #ddd; font-size:12px;">
                <b>Statistik G0:</b> Max: ${s2.stats?.max_fitness || "-"} | Avg: ${s2.stats?.avg_fitness || "-"}
              </div>
              <b>Daftar Fitness (Seluruh Populasi):</b><br>
              ${renderAllCandidatesTable(s2.all_candidates)}
              <small style="color: #666; margin-top:5px; display:block;">Menampilkan seluruh kandidat beserta nilai fitness masing-masing.</small>
            </div>
          `;
          const res = await Swal.fire({ 
            title: "Langkah 2 — Evaluasi Fitness", 
            html, 
            icon: "info", 
            confirmButtonText: "Seleksi Parent →", 
            showCancelButton: true, 
            cancelButtonText: "← Kembali", 
            width: "700px",
            showDenyButton: true,
            denyButtonText: "⏩ Skip",
            denyButtonColor: "#6c757d"
          });
          if (res.isDenied) { step = 7; continue; }
          if (res.isConfirmed) step = 3; else step = 1;
        }

        // ================= STEP 3: SELEKSI (G0) =================
        else if (step === 3) {
          const s3 = trace.find(t => t.step === 3);
          if (!s3) { step = 4; continue; }
          const html = `
            ${renderGAEvolutionStepper('select', 0, 0)}
            <div style="text-align:left">
              <b>Parent Terpilih:</b><br>
              ${renderSelectionTables(s3.selected_parents || s3.selected)}
              <p style="font-size:12px; color:#666;">Individu terbaik dipilih untuk proses reproduksi.</p>
            </div>
          `;
          const res = await Swal.fire({ 
            title: "Langkah 3 — Seleksi Parent", 
            html, 
            icon: "info", 
            confirmButtonText: "Crossover →", 
            showCancelButton: true, 
            cancelButtonText: "← Kembali", 
            width: "700px",
            showDenyButton: true,
            denyButtonText: "⏩ Skip",
            denyButtonColor: "#6c757d"
          });
          if (res.isDenied) { step = 7; continue; }
          if (res.isConfirmed) step = 4; else step = 2;
        }

        // ================= STEP 4: CROSSOVER (G0) =================
        else if (step === 4) {
          const s4 = trace.find(t => t.step === 4);
          if (!s4) { step = 5; continue; }
          const html = `
            ${renderGAEvolutionStepper('cross', 0, 0)}
            <div style="text-align: left;">
              <b>Proses Crossover:</b> ${s4.crossover_count} pasangan menghasilkan anak baru.<br><br>
              <div style="max-height: 350px; overflow-y: auto; border: 1px solid #ddd; padding:5px; background: #fff;">
                ${renderCrossoverPairs(s4.crossover)}
              </div>
            </div>
          `;
          const res = await Swal.fire({ 
            title: "Langkah 4 — Crossover", 
            html, 
            icon: "info", 
            confirmButtonText: "Mutasi →", 
            showCancelButton: true, 
            cancelButtonText: "← Kembali", 
            width: "800px",
            showDenyButton: true,
            denyButtonText: "⏩ Skip",
            denyButtonColor: "#6c757d"
          });
          if (res.isDenied) { step = 7; continue; }
          if (res.isConfirmed) step = 5; else step = 3;
        }

        // ================= STEP 5: MUTASI (G0) =================
        else if (step === 5) {
          const s5 = trace.find(t => t.step === 5);
          if (!s5) { step = 6; continue; }
          const html = `
            ${renderGAEvolutionStepper('mutate', 0, 0)}
            <div style="text-align: left;">
              <b>Hasil Mutasi:</b> ${s5.mutation_count} individu mengalami perubahan.<br><br>
              <div style="max-height: 350px; overflow-y: auto; border: 1px solid #ddd; padding:5px; background: #fff;">
                ${renderMutationPairs(s5.mutation)}
              </div>
            </div>
          `;
          const res = await Swal.fire({ 
            title: "Langkah 5 — Mutasi Bit", 
            html, 
            icon: "info", 
            confirmButtonText: "Mulai Evolusi →", 
            showCancelButton: true, 
            cancelButtonText: "← Kembali", 
            width: "800px",
            showDenyButton: true,
            denyButtonText: "⏩ Skip",
            denyButtonColor: "#6c757d"
          });
          if (res.isDenied) { step = 7; continue; }
          if (res.isConfirmed) step = 6; else step = 4;
        }

        // ================= STEP 6: EVOLUSI GENERASI =================
        else if (step === 6) {
          const genTrace = trace.filter(t => t.step === 6);
          if (genTrace.length === 0) { step = 7; continue; }

          const maxGen = Math.max(...genTrace.map(t => t.gen));
          let currentGenNum = 1;
          let subStep = 'eval'; // eval -> select -> cross -> mutate -> result

          while (currentGenNum <= maxGen) {
            const data = genTrace.find(t => t.gen === currentGenNum && t.sub_step === subStep);
            if (!data) { 
              const order = ['eval', 'select', 'cross', 'mutate', 'result'];
              const nextIdx = order.indexOf(subStep) + 1;
              if (nextIdx < order.length) { subStep = order[nextIdx]; continue; }
              else { currentGenNum++; subStep = 'eval'; continue; }
            }

            let stepHtml = "";
            if (subStep === 'eval') stepHtml = `<b>Evaluasi:</b><br>${renderAllCandidatesTable(data.all_candidates)}`;
            else if (subStep === 'select') stepHtml = `<b>Seleksi:</b><br>${renderSelectionTables(data.selected_parents)}`;
            else if (subStep === 'cross') stepHtml = `<b>Crossover:</b><br><div style="max-height:300px;overflow-y:auto;">${renderCrossoverPairs(data.crossover)}</div>`;
            else if (subStep === 'mutate') stepHtml = `<b>Mutasi:</b><br><div style="max-height:300px;overflow-y:auto;">${renderMutationPairs(data.mutation)}</div>`;
            else if (subStep === 'result') stepHtml = `
              <div style="background:#e7f3ff; padding:15px; border-radius:8px; border:1px solid #b3d9ff; text-align:center;">
                <h4 style="margin-top:0;">Ringkasan Generasi ${currentGenNum}</h4>
                <div style="font-size:18px; font-weight:bold; color:#28a745; margin:10px 0;">Fitness: ${data.best?.fitness}</div>
                <code>${data.best?.key_preview}</code>
              </div>
            `;

            const res = await Swal.fire({
              title: `Langkah 6 — Evolusi Gen ${currentGenNum}`,
              html: `${renderGAEvolutionStepper(subStep, currentGenNum, maxGen)}${stepHtml}`,
              icon: "info",
              confirmButtonText: (subStep === 'result' && currentGenNum === maxGen) ? "Selesai ✓" : "Lanjut →",
              showCancelButton: true,
              cancelButtonText: "← Kembali",
              width: subStep === 'result' ? "500px" : "700px"
            });

            if (res.isConfirmed) {
              const order = ['eval', 'select', 'cross', 'mutate', 'result'];
              const nextIdx = order.indexOf(subStep) + 1;
              if (nextIdx < order.length) { subStep = order[nextIdx]; }
              else if (currentGenNum < maxGen) { currentGenNum++; subStep = 'eval'; }
              else { break; }
            } else {
              const order = ['eval', 'select', 'cross', 'mutate', 'result'];
              const prevIdx = order.indexOf(subStep) - 1;
              if (prevIdx >= 0) { subStep = order[prevIdx]; }
              else if (currentGenNum > 1) { currentGenNum--; subStep = 'result'; }
              else { step = 5; break; }
            }
          }
          if (step === 6) step = 7;
        }

        // ================= STEP 7: HASIL FINAL =================
        else if (step === 7) {
          const finalFitness = meta.best_fitness || 0;
          const res = await Swal.fire({
            title: "Langkah Final — Optimasi Selesai",
            html: `
              <div style="text-align:left; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 15px;">
                  <b style="color: #6c757d; font-size: 14px;">Kandidat Terbaik:</b><br>
                  <div style="font-family: monospace; background: #fff; padding: 8px; border: 1px solid #eee; margin: 5px 0; font-size: 13px; word-break: break-all;">
                    ${data.key_hex}
                  </div>
                  <div style="font-size: 18px; font-weight: bold; color: #28a745;">
                    Fitness: ${finalFitness.toFixed(6)}
                  </div>
                </div>

                <div style="margin-bottom: 15px;">
                  <b style="color: #6c757d;">Statistik:</b>
                  <ul style="margin: 5px 0; padding-left: 20px; font-size: 14px;">
                    <li><b>Crossover:</b> ${meta.total_crossover || 0} events</li>
                    <li><b>Mutation:</b> ${meta.total_mutation || 0} events</li>
                    <li><b>Total Generasi:</b> ${meta.generations}</li>
                    <li><b>Waktu Total:</b> ${meta.ga_time_ms} ms</li>
                  </ul>
                </div>

                <hr style="border: 0; border-top: 1px solid #eee;">
                <div style="text-align: center; margin-top: 10px;">
                  <b>Status:</b> ${finalFitness >= (meta.fitness_threshold || 0.95) ? '<b style="color:green; font-size: 16px;">OPTIMAL ✓</b>' : '<b style="color:red; font-size: 16px;">BELUM OPTIMAL</b>'}
                </div>
              </div>
            `,
            icon: "success",
            confirmButtonText: "Lanjut Proses Enkripsi →",
            width: "500px"
          });
          break;
        }
      }

      // =========================
      // TAMPILKAN HASIL DI UI
      // =========================
      if (gaResult) gaResult.style.display = "block";

      if (gaKeyEl) gaKeyEl.value = keyB64;
      if (gaKeyHexEl) gaKeyHexEl.value = data.key_hex;

      if (gaInfoEl) {
        gaInfoEl.value =
          `Populasi: ${meta.population || "-"}\n` +
          `Generasi: ${meta.generations || "-"}\n` +
          `Waktu: ${meta.ga_time_ms || "-"} ms`;
      }

      const fitnessEl = document.getElementById("ga_fitness");
      const stopEl = document.getElementById("ga_stop");

      if (fitnessEl) fitnessEl.value = meta.best_fitness;
      if (stopEl) stopEl.value = explainStopReason(meta.stop_reason);

      gaKeyB64 = keyB64;
      btnEncFile.disabled = false;

      setNote("Key siap digunakan untuk enkripsi AES.", false);

    } catch (e) {
      console.error(e);
      showAlert("Error", e.message, "error");
      btnGenKey.disabled = false;
    }
  });

  // =========================
  // ENCRYPT FILE (AES + GA) - FIXED
  // =========================
  btnEncFile.addEventListener("click", async () => {
    const f = fileIn.files && fileIn.files[0];
    if (!f || !gaKeyB64) return;

    try {
      btnEncFile.disabled = true;
      const prepRes = await fetch("/api/aesga/encrypt_prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key_b64: gaKeyB64 }),
      });
      const prepData = await prepRes.json();
      
      const encSteps = ["Key Expansion", "Initial Round", "Main Rounds", "Final Round"];
      let currentStep = 1;

      while (currentStep <= encSteps.length) {
        let stepHtml = "";
        if (currentStep === 1) {
          const rkHtml = prepData.round_keys.map(rk => `<div>Round ${rk.round}: ${rk.key_hex}</div>`).join("");
          stepHtml = `<b>Key Expansion:</b><div style="text-align:left; font-family:monospace; font-size:11px; max-height:200px; overflow-y:auto; border:1px solid #ddd; padding:10px; margin-top:5px;">${rkHtml}</div>`;
        } else if (currentStep === 2) {
          stepHtml = `<p>${prepData.steps_info.initial.description}</p>`;
        } else if (currentStep === 3) {
          stepHtml = `<p>${prepData.steps_info.main.description}</p>`;
        } else {
          stepHtml = `<p>${prepData.steps_info.final.description}</p>`;
        }

        const result = await Swal.fire({
          title: "",
          html: `${renderProcessStepper(currentStep, encSteps)}<div style="text-align:left;"><b>${encSteps[currentStep-1]}:</b>${stepHtml}</div>`,
          showCancelButton: true,
          confirmButtonText: currentStep === encSteps.length ? "Selesai" : "Lanjut",
          cancelButtonText: "Batal",
          width: "600px"
        });

        if (result.isConfirmed) currentStep++;
        else break;
      }

      if (currentStep > encSteps.length) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("key_b64", gaKeyB64);
        const res = await fetch("/api/aesga/encrypt_file", { method: "POST", body: fd });
        const data = await res.json();
        
        if (data.ok) {
          cipherEl.value = data.package.cipher_b64;
          lastMeta.encrypt_ms = data.package.meta.encrypt_ms;
          
          if (gid("encms")) {
            gid("encms").value = data.package.meta.encrypt_ms;
          }

          gid("btnDec").disabled = false;
          gid("btnSaveHistory").disabled = false;
          gid("btnEntropy").disabled = false;
          gid("btnNist").disabled = false;

          showAlert("Sukses", "Enkripsi Selesai!", "success");
        }
      }
    } catch (e) {
      showAlert("Error", String(e), "error");
    } finally {
      btnEncFile.disabled = false;
    }
  });

  // =========================
  // ENTROPY TEST (backend baseline endpoint reused)
  // =========================

  btnEntropy.addEventListener("click", async () => {
    const cipher_b64 = (cipherEl.value || "").trim();
    if (!cipher_b64) return;

    try {
      btnEntropy.disabled = true;
      const res = await fetch("/api/aes/test_entropy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cipher_b64 })
      });
      const data = await res.json();
      if (data.ok) {
        lastMeta.entropy_cipher = data.entropy;
        const testOut = gid("testOut");
        if (testOut) testOut.value += `Entropy Cipher: ${data.entropy}\n`;
        
        if (gid("resultEntropy")) {
          gid("resultEntropy").innerHTML = `<div style="padding:10px; background:#e7f3ff; border-radius:8px; border:1px solid #b3d9ff; color:#007bff; font-weight:bold;">Entropy: ${data.entropy}</div>`;
        }
        showAlert("Entropy Test", `Hasil: ${data.entropy}`, "success");
      }
    } catch (e) {
      showAlert("Error", String(e), "error");
    } finally {
      btnEntropy.disabled = false;
    }
  });

  // =========================
  // RUNS / NIST TEST (backend baseline endpoint reused)
  // =========================
  btnNist.addEventListener("click", async () => {
    const cipher_b64 = (cipherEl.value || "").trim();
    if (!cipher_b64) return;

    try {
      btnNist.disabled = true;
      const res = await fetch("/api/aes/test_nist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cipher_b64 })
      });
      const data = await res.json();
      if (data.ok) {
        lastMeta.nist_frequency = data.frequency.pass ? "Lolos" : "Gagal";
        lastMeta.nist_runs = data.runs.pass ? "Lolos" : "Gagal";
        lastMeta.nist_freq_p = data.frequency.p_value;
        lastMeta.nist_runs_p = data.runs.p_value;
        const testOut = gid("testOut");
        if (testOut) testOut.value += `NIST Freq: ${lastMeta.nist_frequency}, Runs: ${lastMeta.nist_runs}\n`;
        
        if (gid("resultNist")) {
          gid("resultNist").innerHTML = `<div style="padding:8px; background:#f8f9fa; border-radius:6px; border:1px solid #dee2e6; margin-bottom:5px;"><b>Frequency Test:</b> ${data.frequency.pass ? '<span style="color:green">Lolos</span>' : '<span style="color:red">Gagal</span>'} (p=${data.frequency.p_value.toFixed(6)})</div>`;
        }
        if (gid("resultNistRuns")) {
          gid("resultNistRuns").innerHTML = `<div style="padding:8px; background:#f8f9fa; border-radius:6px; border:1px solid #dee2e6;"><b>Runs Test:</b> ${data.runs.pass ? '<span style="color:green">Lolos</span>' : '<span style="color:red">Gagal</span>'} (p=${data.runs.p_value.toFixed(6)})</div>`;
        }
        
        showAlert("NIST Test", "Selesai dijalankan.", "success");
      }
    } catch (e) {
      showAlert("Error", String(e), "error");
    } finally {
      btnNist.disabled = false;
    }
  });

  // =========================
  // DECRYPT & DOWNLOAD (AES+GA) - STEP-BY-STEP WITH SWEETALERT
  // =========================
  btnDec.addEventListener("click", async () => {
    const cipher = cipherEl.value;
    const key = keyEl.value;
    if (!cipher || !key) return;

    const decSteps = ["Base64 Decode", "AES Decrypt", "Unpadding", "Reconstruct"];
    let currentStep = 1;

    try {
      const infoRes = await fetch("/api/aesga/decrypt_info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cipher_b64: cipher, key_b64: key, filename: lastMeta.filename })
      });
      const infoData = await infoRes.json();

      while (currentStep <= decSteps.length) {
        const stepData = infoData.steps[currentStep-1];
        const result = await Swal.fire({
          title: "",
          html: `${renderProcessStepper(currentStep, decSteps)}<div style="text-align:left;"><b>${stepData.name}:</b><p>${stepData.details}</p></div>`,
          showCancelButton: true,
          confirmButtonText: currentStep === decSteps.length ? "Download" : "Lanjut",
          cancelButtonText: "Batal",
          width: "600px"
        });
        if (result.isConfirmed) currentStep++;
        else break;
      }

      if (currentStep > decSteps.length) {
        const res = await fetch("/api/aesga/decrypt_file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cipher_b64: cipher, key_b64: key, filename: lastMeta.filename })
        });

        if (gid("decms")) {
          gid("decms").value = res.headers.get("X-Dec-Ms");
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = lastMeta.filename || "decrypted_file";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      showAlert("Error", String(e), "error");
    } finally {
      btnDec.disabled = false;
    }
  });

  // =========================
  // SAVE HISTORY (XLSX) -> gabung file yg sama, bedakan via mode
  // =========================
  btnSaveHistory.addEventListener("click", async () => {
    const key = (keyEl.value || "").trim();
    const cipher_b64 = (cipherEl.value || "").trim();
    if (!key) return;

    const payload = {
      ...lastMeta,
      key: key,
      cipher_b64: cipher_b64
    };

    try {
      btnSaveHistory.disabled = true;
      const res = await fetch("/api/aes/export_xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aes_history.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showAlert("Sukses", "Histori berhasil diunduh.", "success");
    } catch (e) {
      showAlert("Error", String(e), "error");
    } finally {
      btnSaveHistory.disabled = false;
    }
  });
});
