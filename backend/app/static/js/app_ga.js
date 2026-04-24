if (typeof gid === 'undefined') {
  var gid = (id) => document.getElementById(id);
}

/**
 * Render progress indicator bar untuk proses enkripsi/dekripsi
 * @param {number} currentStep - Step saat ini (1-N)
 * @param {Array} stepNames - Nama-nama step
 * @returns {string} HTML string untuk stepper
 */
function renderProcessStepper(currentStep, stepNames) {
  const isEncryption = stepNames.includes("Key Expansion") || stepNames.includes("Initial Round");
  const title = isEncryption ? "PROSES ENKRIPSI (AES+GA)" : "PROSES DEKRIPSI (AES+GA)";
  
  let html = `
    <div style="text-align:center; margin-bottom:20px;">
      <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #1f6feb; text-transform: uppercase; letter-spacing: 1px;">${title}</h2>
      <div style="margin-top: 8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f6feb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      </div>
    </div>
    <div class="stepper-container">
  `;

  stepNames.forEach((name, i) => {
    const stepNum = i + 1;
    let statusClass = "";
    if (stepNum < currentStep) statusClass = "completed";
    else if (stepNum === currentStep) statusClass = "active";

    html += `
      <div class="stepper-item ${statusClass}">
        <div class="stepper-circle">${stepNum < currentStep ? '✔' : stepNum}</div>
        <div class="stepper-label">${name}</div>
        <div class="stepper-line"></div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

function showAlert(title, text, icon) {
  Swal.fire({ 
    title, 
    text, 
    icon, 
    confirmButtonText: "Selesai",
    customClass: {
      confirmButton: 'custom-swal-btn swal-btn-finish'
    },
    buttonsStyling: false
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const b64 = reader.result.split(',')[1];
      resolve(b64);
    };
    reader.onerror = error => reject(error);
  });
}

function b64ToBlob(b64Data, contentType = '', sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

/**
 * Render evolution stepper untuk GA key generation
 */
function renderGAEvolutionStepper(currentStep, currentGen, totalGen) {
  const steps = [
    { id: 'init', label: 'Init' },
    { id: 'eval', label: 'Eval' },
    { id: 'select', label: 'Select' },
    { id: 'cross', label: 'Cross' },
    { id: 'mutate', label: 'Mutate' },
    { id: 'result', label: 'Hasil' }
  ];

  const stepOrder = steps.map(s => s.id);
  const currentIndex = stepOrder.indexOf(currentStep);

  let html = '<div class="stepper-container" style="margin-bottom:20px;">';
  steps.forEach((step, index) => {
    let statusClass = "";
    if (index < currentIndex) statusClass = "completed";
    else if (index === currentIndex) statusClass = "active";

    html += `
      <div class="stepper-item ${statusClass}">
        <div class="stepper-circle">${index < currentIndex ? '✔' : (index + 1)}</div>
        <div class="stepper-label">${step.label}</div>
        <div class="stepper-line"></div>
      </div>
    `;
  });
  html += '</div>';

  if (currentGen > 0) {
    html += `<div style="text-align:center; font-size:12px; color:#666; margin-bottom:15px;">📊 Generasi: <b>${currentGen}</b> / ${totalGen}</div>`;
  }
  return html;
}

function renderKeysPreview(keys) {
  if (!Array.isArray(keys) || !keys.length) return "-";
  return keys.map((k) => `
    <div style="margin-bottom:4px; font-family:monospace; font-size:11px;">
      <b>#${k.rank}:</b> <code>${esc(k.key_hex || k.key_preview)}</code>
    </div>
  `).join("");
}

function renderAllCandidatesTable(candidates) {
  if (!Array.isArray(candidates) || !candidates.length) return "Data tidak tersedia.";
  return `
    <div style="max-height: 250px; overflow-y: auto; border: 1px solid #ddd; background: #fff; margin-top:10px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
        <thead style="position: sticky; top: 0; background: #1f6feb; color: white; z-index: 1;">
          <tr>
            <th style="padding: 6px; border: 1px solid #ddd; width: 40px; text-align: center;">Rank</th>
            <th style="padding: 6px; border: 1px solid #ddd;">Kunci (Hex)</th>
            <th style="padding: 6px; border: 1px solid #ddd; width: 70px; text-align: center;">Fitness</th>
          </tr>
        </thead>
        <tbody>
          ${candidates.map(c => `
            <tr>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${c.rank}</td>
              <td style="padding: 4px; border: 1px solid #ddd; font-family: monospace;">${esc(c.key_hex)}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${esc(c.fitness)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSelectionTables(selected) {
  if (!Array.isArray(selected) || !selected.length) return "Data seleksi tidak tersedia.";
  return `
    <div style="max-height: 250px; overflow-y: auto; border: 1px solid #ddd; background: #f8f9fa;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead style="position: sticky; top: 0; background: #28a745; color: white;">
          <tr>
            <th style="padding: 6px; border: 1px solid #ddd; text-align: center;">Rank</th>
            <th style="padding: 6px; border: 1px solid #ddd;">Kunci (Hex)</th>
            <th style="padding: 6px; border: 1px solid #ddd; text-align: center;">Fitness</th>
          </tr>
        </thead>
        <tbody>
          ${selected.map(s => `
            <tr>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${s.rank}</td>
              <td style="padding: 4px; border: 1px solid #ddd; font-family: monospace;">${esc(s.key_hex)}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${esc(s.fitness)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCrossoverPairs(pairs) {
  if (!Array.isArray(pairs) || !pairs.length) return "Data tidak tersedia.";
  return pairs.map((p, i) => `
    <div style="margin-bottom: 10px; padding: 10px; background: #fff; border: 1px solid #eee; border-radius: 4px; font-family: monospace; font-size: 10px;">
      <b>Pasangan ${i + 1}</b> (Point: ${p.point_byte})<br>
      P1: ${p.parent1_hex}<br>
      P2: ${p.parent2_hex}<br>
      ⮕: ${p.child_hex}
    </div>
  `).join("");
}

function renderMutationPairs(pairs) {
  if (!Array.isArray(pairs) || !pairs.length) return "Data tidak tersedia.";
  return pairs.map((m, i) => `
    <div style="margin-bottom: 10px; padding: 10px; background: #fff; border: 1px solid #eee; border-radius: 4px; font-family: monospace; font-size: 10px;">
      <b>Individu ${i + 1}</b><br>
      Sebelum: ${m.before_hex}<br>
      Sesudah: ${m.after_hex}
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const fileIn = gid("fileIn");
  if (!fileIn) {
    console.warn("fileIn tidak ditemukan di halaman ini.");
  }

  const btnGenKey = gid("btnGenKey");
  const btnEncFile = gid("btnEncFile");
  const btnEntropy = gid("btnEntropy");
  const btnNist = gid("btnNist");
  const btnDec = gid("btnDec");
  const btnSaveHistory = gid("btnSaveHistory");
  const btnBackToHome = gid("btnBackToHome");

  const cipherEl = gid("cipher_b64");
  const keyB64El = gid("key_b64");
  const keyHexEl = gid("key_hex");
  const plaintextOut = gid("plaintext_out");
  const encTimeEl = gid("encrypt_time");
  const decTimeEl = gid("decrypt_time");

  const gaKeyB64Display = gid("ga_key_b64_display");
  const gaKeyHexDisplay = gid("ga_key_hex_display");
  const gaInfoEl = gid("ga_info");
  const gaResult = gid("gaResult");

  let gaKeyB64 = null;
  let gaKeyHex = null;
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

  function setEnabled(el, enabled) { if (el) el.disabled = !enabled; }

  // FILE CHANGE
  if (fileIn) {
    fileIn.addEventListener("change", () => {
      const f = fileIn.files && fileIn.files[0];
      if (!f) return;
      gid("fname").textContent = f.name;
      gid("fsize").textContent = (f.size / 1024).toFixed(2) + " KB";
      lastMeta.filename = f.name;
      lastMeta.size_kb = (f.size / 1024).toFixed(2);
      setEnabled(btnGenKey, true);
    });
  }

  if (btnBackToHome) {
    btnBackToHome.addEventListener("click", () => window.location.href = "/");
  }

  // GENERATE KEY (GA)
  if (btnGenKey) {
    btnGenKey.addEventListener("click", async () => {
      const f = fileIn.files[0];
      const fd = new FormData();
      fd.append("file", f);
      ["population", "generations", "mutation_rate", "crossover_rate", "fitness_threshold"].forEach(id => {
        const el = gid(id);
        if (el) fd.append(id, el.value);
      });

      try {
        Swal.fire({ title: "Proses Algoritma Genetika", html: "Menjalankan optimasi...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await fetch("/api/aesga/generate_key", { method: "POST", body: fd });
        const data = await res.json();
        Swal.close();

        if (!data.ok) throw new Error(data.error);

        const trace = data.trace || [];
        const meta = data.ga_meta || {};
        let step = 1;

        while (step <= 7) {
          let content = "";
          let title = "";
          let showSkip = false;

          if (step === 1) {
            title = "Langkah 1 — Inisialisasi";
            const s = trace.find(t => t.step === 1);
            content = `${renderGAEvolutionStepper('init', 0, 0)}<div style="text-align:left"><b>Populasi Awal:</b> ${s?.population_size} kandidat<br>${renderKeysPreview(s?.keys_preview)}</div>`;
          } else if (step === 2) {
            title = "Langkah 2 — Evaluasi Fitness";
            const s = trace.find(t => t.step === 2);
            content = `${renderGAEvolutionStepper('eval', 0, 0)}<div style="text-align:left"><b>Daftar Fitness (G0):</b><br>${renderAllCandidatesTable(s?.all_candidates)}</div>`;
          } else if (step === 3) {
            title = "Langkah 3 — Seleksi Parent";
            const s = trace.find(t => t.step === 3);
            content = `${renderGAEvolutionStepper('select', 0, 0)}<div style="text-align:left"><b>Parent Terpilih:</b><br>${renderSelectionTables(s?.selected_parents)}</div>`;
          } else if (step === 4) {
            title = "Langkah 4 — Crossover";
            const s = trace.find(t => t.step === 4);
            content = `${renderGAEvolutionStepper('cross', 0, 0)}<div style="text-align:left"><b>Hasil Crossover:</b><br>${renderCrossoverPairs(s?.crossover)}</div>`;
          } else if (step === 5) {
            title = "Langkah 5 — Mutasi Bit";
            const s = trace.find(t => t.step === 5);
            content = `${renderGAEvolutionStepper('mutate', 0, 0)}<div style="text-align:left"><b>Hasil Mutasi:</b><br>${renderMutationPairs(s?.mutation)}</div>`;
          } else if (step === 6) {
            title = "Langkah 6 — Proses Evolusi";
            showSkip = true;
            content = `${renderGAEvolutionStepper('eval', meta.generations, meta.generations)}<div class="aes-card"><div class="aes-card-title">🔄 Iterasi Berjalan</div><p style="font-size:13px;">Melakukan proses seleksi, crossover, dan mutasi sebanyak <b>${meta.generations}</b> generasi secara otomatis.</p></div>`;
          } else if (step === 7) {
            title = "Langkah Final — Optimasi Selesai";
            content = `<div class="aes-card"><div class="aes-card-title">🏆 KUNCI TERBAIK</div><div class="hex-box" style="text-align:center; color:#28a745;">${data.key_hex}</div><div style="margin-top:10px; font-size:13px;">Fitness: <b>${meta.best_fitness.toFixed(6)}</b><br>Waktu: ${meta.ga_time_ms} ms</div></div>`;
          }

          const r = await Swal.fire({
            title: "Proses Algoritma Genetika",
            html: `<div style="margin-bottom:10px; font-weight:bold; color:#1f6feb;">${title}</div>${content}`,
            width: "600px",
            showDenyButton: showSkip,
            denyButtonText: "⏩ SKIP EVOLUSI",
            showCancelButton: step > 1 && step < 7,
            confirmButtonText: step === 7 ? "LANJUT ENKRIPSI" : "LANJUT",
            cancelButtonText: "KEMBALI",
            buttonsStyling: false,
            customClass: { confirmButton: 'custom-swal-btn swal-btn-next', denyButton: 'custom-swal-btn swal-btn-cancel', cancelButton: 'custom-swal-btn swal-btn-back' }
          });

          if (r.isConfirmed) step++;
          else if (r.isDenied) step = 7;
          else if (r.isDismissed && step > 1) step--;
          else break;
        }

        gaKeyB64 = data.key_b64; gaKeyHex = data.key_hex;
        if (gaKeyB64Display) gaKeyB64Display.value = gaKeyB64;
        if (gaKeyHexDisplay) gaKeyHexDisplay.value = gaKeyHex;
        if (gaInfoEl) gaInfoEl.value = `Populasi: ${meta.population}\nGenerasi: ${meta.generations}\nWaktu: ${meta.ga_time_ms} ms\nBest Fitness: ${meta.best_fitness}`;
        if (gaResult) gaResult.style.display = "block";
        setEnabled(btnEncFile, true);
      } catch (e) { showAlert("Error", e.message, "error"); }
    });
  }

  // ENCRYPT
  if (btnEncFile) {
    btnEncFile.addEventListener("click", async () => {
      const f = fileIn.files[0];
      if (!f || !gaKeyB64) return;
      try {
        setEnabled(btnEncFile, false);
        const prepRes = await fetch("/api/aesga/encrypt_prep", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key_b64: gaKeyB64 }) });
        const prepData = await prepRes.json();
        const steps = ["Key Expansion", "Initial Round", "Main Rounds", "Final Round"];
        let step = 1;

        while (step <= steps.length) {
          let html = "";
          if (step === 1) {
            const rks = prepData.round_keys.map(rk => `<div style="display:flex; justify-content:space-between; font-size:11px;"><span>Round ${rk.round}:</span><span style="color:#032f62;">${rk.key_hex}</span></div>`).join("");
            html = `<div class="step-info">Membangkitkan round keys dari kunci hasil optimasi GA.</div><div class="aes-card"><div class="aes-card-title">🔑 KUNCI GA</div><div class="hex-box">${gaKeyHex}</div></div><div class="aes-card"><div class="aes-card-title">🔄 ROUND KEYS</div><div class="hex-box" style="max-height:120px; overflow-y:auto;">${rks}</div></div>`;
          } else if (step === 2) {
            html = `<div class="step-info">Operasi XOR antara plaintext dengan Round Key 0.</div><div class="aes-card"><div class="aes-card-title">📄 PLAINTEXT PREVIEW</div><div class="hex-box">${prepData.steps_info.initial.description}</div></div>`;
          } else if (step === 3) {
            html = `<div class="step-info">9 putaran utama transformasi AES standar.</div><div class="aes-card"><div class="aes-card-title">⚙️ TRANSFORMASI</div><div style="font-size:12px; padding:5px;">SubBytes ⮕ ShiftRows ⮕ MixColumns ⮕ AddRoundKey</div></div><div class="badge-info">Pengulangan Round 1-9</div>`;
          } else {
            html = `<div class="step-info">Putaran final tanpa MixColumns.</div><div class="aes-card"><div class="aes-card-title">⚙️ FINAL STEP</div><div style="font-size:12px; padding:5px;">SubBytes ⮕ ShiftRows ⮕ AddRoundKey</div></div>`;
          }

          const r = await Swal.fire({
            html: `${renderProcessStepper(step, steps)}${html}`,
            width: "600px", showCancelButton: true, showDenyButton: step > 1,
            confirmButtonText: step === 4 ? "SELESAI" : "LANJUT", denyButtonText: "KEMBALI", cancelButtonText: "BATAL",
            buttonsStyling: false, customClass: { confirmButton: `custom-swal-btn ${step === 4 ? 'swal-btn-finish' : 'swal-btn-next'}`, denyButton: 'custom-swal-btn swal-btn-back', cancelButton: 'custom-swal-btn swal-btn-cancel' }
          });
          if (r.isConfirmed) step++; else if (r.isDenied) step--; else { setEnabled(btnEncFile, true); return; }
        }

        const b64Data = await fileToBase64(f);
        const jsonBlob = new Blob([JSON.stringify({ filename: f.name, type: f.type, data: b64Data })], { type: 'application/json' });
        const fd = new FormData(); fd.append("file", jsonBlob, f.name); fd.append("key_b64", gaKeyB64);
        const res = await fetch("/api/aesga/encrypt_file", { method: "POST", body: fd });
        const data = await res.json();
        if (data.ok) {
          cipherEl.value = data.package.cipher_b64;
          keyB64El.value = data.package.key_b64;
          keyHexEl.value = data.package.key_hex;
          encTimeEl.value = data.package.meta.encrypt_ms;
          lastMeta.encrypt_ms = data.package.meta.encrypt_ms;
          setEnabled(btnDec, true); setEnabled(btnSaveHistory, true); setEnabled(btnEntropy, true); setEnabled(btnNist, true);
          showAlert("Berhasil", "Enkripsi AES+GA Selesai.", "success");
        }
      } catch (e) { showAlert("Error", e.message, "error"); } finally { setEnabled(btnEncFile, true); }
    });
  }

  // DECRYPT
  if (btnDec) {
    btnDec.addEventListener("click", async () => {
      const cipher = cipherEl.value;
      const key = keyB64El.value;
      if (!cipher || !key) return;
      try {
        const prepRes = await fetch("/api/aesga/encrypt_prep", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key_b64: key }) });
        const prepData = await prepRes.json();
        const steps = ["Key Expansion", "Initial Round", "Main Rounds", "Final Round"];
        let step = 1;

        while (step <= steps.length) {
          let html = "";
          if (step === 1) {
            html = `<div class="step-info">Membangkitkan 11 round keys untuk proses inversi AES.</div><div class="aes-card"><div class="aes-card-title">🔑 KUNCI AES</div><div class="hex-box" style="text-align:center;">${keyHexEl.value}</div></div>`;
          } else if (step === 2) {
            html = `<div class="step-info">Inversi putaran awal menggunakan Round Key 10.</div><div class="aes-card"><div class="aes-card-title">⚙️ PROSES</div><div style="font-size:12px; padding:5px;">AddRoundKey ⮕ InvShiftRows ⮕ InvSubBytes</div></div>`;
          } else if (step === 3) {
            html = `<div class="step-info">9 putaran inversi transformasi AES (R9 - R1).</div><div class="aes-card"><div class="aes-card-title">⚙️ OPERASI</div><div style="font-size:12px; padding:5px;">InvShiftRows ⮕ InvSubBytes ⮕ AddRoundKey ⮕ InvMixColumns</div></div>`;
          } else {
            html = `<div class="step-info">Putaran akhir (R0) untuk mendapatkan kembali data asli.</div><div class="aes-card"><div class="aes-card-title">🔓 HASIL AKHIR</div><p style="font-size:13px; padding:10px; font-weight:bold; color:#1f6feb;">Plaintext siap direkonstruksi.</p></div>`;
          }

          const r = await Swal.fire({
            html: `${renderProcessStepper(step, steps)}${html}`,
            width: "600px", showCancelButton: true, showDenyButton: step > 1,
            confirmButtonText: step === 4 ? "SELESAI" : "LANJUT", denyButtonText: "KEMBALI", cancelButtonText: "BATAL",
            buttonsStyling: false, customClass: { confirmButton: `custom-swal-btn ${step === 4 ? 'swal-btn-finish' : 'swal-btn-next'}`, denyButton: 'custom-swal-btn swal-btn-back', cancelButton: 'custom-swal-btn swal-btn-cancel' }
          });
          if (r.isConfirmed) step++; else if (r.isDenied) step--; else return;
        }

        const res = await fetch("/api/aesga/decrypt_file", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cipher_b64: cipher, key_b64: key, filename: lastMeta.filename }) });
        if (!res.ok) throw new Error("Gagal dekripsi");
        const decMs = res.headers.get("X-Dec-Ms");
        if (decTimeEl) decTimeEl.value = decMs;
        lastMeta.decrypt_ms = decMs;

        const blob = await res.blob();
        const text = await blob.text();
        if (plaintextOut) plaintextOut.value = text;

        try {
          const payload = JSON.parse(text);
          if (payload.filename && payload.data) {
            const decBlob = b64ToBlob(payload.data, payload.type);
            const url = URL.createObjectURL(decBlob);
            const a = document.createElement("a"); a.href = url; a.download = payload.filename; a.click(); URL.revokeObjectURL(url);
            showAlert("Berhasil", "File asli berhasil direkonstruksi.", "success");
            return;
          }
        } catch (e) { }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = lastMeta.filename || "decrypted"; a.click(); URL.revokeObjectURL(url);
        showAlert("Berhasil", "Proses dekripsi selesai.", "success");
      } catch (e) { showAlert("Error", e.message, "error"); }
    });
  }

  // ENTROPY & NIST
  if (btnEntropy) {
    btnEntropy.addEventListener("click", async () => {
      const c = cipherEl.value; if (!c) return;
      try {
        const res = await fetch("/api/aes/test_entropy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cipher_b64: c }) });
        const data = await res.json();
        if (data.ok) {
          lastMeta.entropy_cipher = data.entropy;
          gid("resultEntropy").innerHTML = `<div style="padding:10px; background:#e7f3ff; border:1px solid #b3d9ff; border-radius:8px; color:#007bff; font-weight:bold;">Entropy: ${data.entropy}</div>`;
          showAlert("Entropy Test", `Hasil: ${data.entropy}`, "success");
        }
      } catch (e) { showAlert("Error", String(e), "error"); }
    });
  }

  if (btnNist) {
    btnNist.addEventListener("click", async () => {
      const c = cipherEl.value; if (!c) return;
      try {
        const res = await fetch("/api/aes/test_nist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cipher_b64: c }) });
        const data = await res.json();
        if (data.ok) {
          lastMeta.nist_frequency = data.frequency.pass ? "Lolos" : "Gagal";
          lastMeta.nist_runs = data.runs.pass ? "Lolos" : "Gagal";
          lastMeta.nist_freq_p = data.frequency.p_value;
          lastMeta.nist_runs_p = data.runs.p_value;
          gid("resultNist").innerHTML = `<div style="padding:8px; background:#f8f9fa; border:1px solid #dee2e6; border-radius:6px; margin-bottom:5px;"><b>Freq Test:</b> ${data.frequency.pass ? 'Lolos' : 'Gagal'} (p=${data.frequency.p_value.toFixed(6)})</div>`;
          gid("resultNistRuns").innerHTML = `<div style="padding:8px; background:#f8f9fa; border:1px solid #dee2e6; border-radius:6px;"><b>Runs Test:</b> ${data.runs.pass ? 'Lolos' : 'Gagal'} (p=${data.runs.p_value.toFixed(6)})</div>`;
          showAlert("NIST Test", "Selesai.", "success");
        }
      } catch (e) { showAlert("Error", String(e), "error"); }
    });
  }

  // SAVE HISTORY
  if (btnSaveHistory) {
    btnSaveHistory.addEventListener("click", async () => {
      const k = keyB64El.value;
      if (!k) return;
      try {
        const res = await fetch("/api/aes/export_xlsx", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...lastMeta, key: k, cipher_b64: cipherEl.value }) });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "aes_history.xlsx"; a.click(); URL.revokeObjectURL(url);
        showAlert("Sukses", "Histori berhasil diunduh.", "success");
      } catch (e) { showAlert("Error", String(e), "error"); }
    });
  }
});
