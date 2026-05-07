const gid = (id) => document.getElementById(id);

function formatKB(bytes) {
  if (!bytes && bytes !== 0) return "-";
  return (bytes / 1024).toFixed(2) + " KB";
}

/**
 * Render progress indicator bar untuk proses enkripsi/dekripsi
 * @param {number} currentStep - Step saat ini (1-N)
 * @param {Array} stepNames - Nama-nama step
 * @param {boolean} isDecryption - Flag jika ini adalah proses dekripsi
 * @returns {string} HTML string untuk stepper
 */
function renderProcessStepper(currentStep, stepNames, isDecryption = false) {
  const isEncryption = !isDecryption && (stepNames.includes("Key Expansion") || stepNames.includes("Initial Round"));
  const title = isEncryption ? "PROSES ENKRIPSI" : "PROSES DEKRIPSI";
  
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

function setNote(msg, isError = true) {
  const note = gid("note");
  if (!note) return;
  note.textContent = msg;
  note.style.display = "block";
  note.style.color = isError ? "#dc3545" : "#28a745";
  note.style.padding = "10px";
  note.style.borderRadius = "5px";
  if (isError) {
    note.style.background = "#f8d7da";
    note.style.border = "1px solid #f5c6cb";
  } else {
    note.style.background = "#d4edda";
    note.style.border = "1px solid #c3e6cb";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Loaded - Initializing AES Baseline...");
  
  const fileIn = gid("fileIn");
  const btnGenKey = gid("btnGenKey");
  const btnEncFile = gid("btnEncFile");
  const btnEntropy = gid("btnEntropy");
  const btnNist = gid("btnNist");
  const btnBerTest = gid("btnBerTest");
  const btnDec = gid("btnDec");
  const btnSaveHistory = gid("btnSaveHistory");
  const btnBackToHome = gid("btnBackToHome");
  const cipherEl = gid("cipher_b64");
  const keyB64El = gid("key_b64");
  const keyHexEl = gid("key_hex");
  const keyInfoEl = gid("key_info");
  const entropyOut = gid("entropyOut");
  const nistFreqOut = gid("nistFreqOut");
  const nistRunsOut = gid("nistRunsOut");
  const fname = gid("fname");
  const fsize = gid("fsize");
  const fmode = gid("fmode");
  const plaintextOut = gid("plaintext_out");

  const maxFileSize = 2 * 1024 * 1024;
  const allowedExtensions = ["pdf", "docx"];

  let lastMeta = {
    mode: "AES-128-BASELINE",
    filename: "-",
    size_kb: "-",
    encrypt_ms: "-",
    decrypt_ms: "-",
    entropy_cipher: "-",
    nist_frequency: "-",
    nist_runs: "-",
    nist_freq_p: "-",
    nist_runs_p: "-",
    ber_value: "-",
    ber_percentage: "-"
  };

  let generatedKeyB64 = null;
  let generatedKeyHex = null;

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Hapus prefix "data:*/*;base64,"
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

  function setEnabled(el, enabled) {
    if (!el) return;
    el.disabled = !enabled;
  }

  function setInitialState() {
    setEnabled(btnEncFile, false);
    setEnabled(btnEntropy, false);
    setEnabled(btnNist, false);
    setEnabled(btnDec, false);
    setEnabled(btnSaveHistory, false);
  }

  function setAfterValidFilePicked() {
    setEnabled(btnGenKey, true);
    setEnabled(btnEncFile, false);
    setEnabled(btnEntropy, false);
    setEnabled(btnNist, false);
    setEnabled(btnDec, false);
    setEnabled(btnSaveHistory, false);
  }

  function setAfterEncryptSuccess() {
    setEnabled(btnEntropy, true);
    setEnabled(btnNist, true);
    setEnabled(btnDec, true);
    setEnabled(btnSaveHistory, true);
  }

  function resetFileInfo() {
    if (fname) fname.textContent = "-";
    if (fsize) fsize.textContent = "-";
    if (fmode) fmode.textContent = "AES-128-BASELINE";
    lastMeta.filename = "-";
    lastMeta.size_kb = "-";
  }

  function resetOutputs() {
    if (cipherEl) cipherEl.value = "";
    if (keyB64El) keyB64El.value = "";
    if (keyHexEl) keyHexEl.value = "";
    if (keyInfoEl) keyInfoEl.value = "16 byte / 128 bit";
    if (entropyOut) entropyOut.textContent = "-";
    if (nistFreqOut) nistFreqOut.textContent = "-";
    if (nistRunsOut) nistRunsOut.textContent = "-";
  }

  setInitialState();

  // FILE PICK
  if (fileIn) {
    fileIn.addEventListener("change", () => {
      const file = fileIn.files && fileIn.files[0];
      resetOutputs();
      setInitialState();
      if (!file) {
        resetFileInfo();
        return;
      }
      if (file.size > maxFileSize) {
        showAlert("Error", "Ukuran file terlalu besar. Maksimal 2MB.", "error");
        fileIn.value = "";
        resetFileInfo();
        return;
      }
      const ext = file.name.split(".").pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        showAlert("Error", "Hanya file PDF dan DOCX yang diperbolehkan.", "error");
        fileIn.value = "";
        resetFileInfo();
        return;
      }
      if (fname) fname.textContent = file.name;
      if (fsize) fsize.textContent = formatKB(file.size);
      lastMeta.filename = file.name;
      lastMeta.size_kb = (file.size / 1024).toFixed(2);
      setAfterValidFilePicked();
    });
  }

  if (btnBackToHome) {
    btnBackToHome.addEventListener("click", () => {
      window.location.href = "/";
    });
  }

  // GENERATE KEY
  if (btnGenKey) {
    btnGenKey.addEventListener("click", async () => {
      const f = fileIn?.files?.[0];
      if (!f) {
        showAlert("Error", "Pilih file .pdf/.docx dulu.", "error");
        return;
      }
      try {
        btnGenKey.disabled = true;
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/aes/generate_key", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          showAlert("Error", data.error || "Gagal generate key.", "error");
          setEnabled(btnGenKey, true);
          return;
        }
        generatedKeyB64 = data.key_b64;
        generatedKeyHex = data.key_hex;
        if (keyB64El) keyB64El.value = data.key_b64;
        if (keyHexEl) keyHexEl.value = data.key_hex;
        
        await Swal.fire({
          title: "Kunci Berhasil Dibuat!",
          html: `
            <div style="text-align: left; font-family: monospace; font-size: 13px;">
              <p><b>Nama File:</b> ${data.filename}</p>
              <p><b>Base64:</b><br><textarea style="width:100%; height:50px; font-size:11px;" readonly>${data.key_b64}</textarea></p>
              <p><b>Hex:</b><br><textarea style="width:100%; height:50px; font-size:11px;" readonly>${data.key_hex}</textarea></p>
            </div>
          `,
          icon: "success",
          confirmButtonText: "OK"
        });
        setEnabled(btnEncFile, true);
        setEnabled(btnGenKey, true);
        setNote("Kunci siap. Klik 'Encrypt' untuk enkripsi.", false);
      } catch (e) {
        showAlert("Error", "Terjadi error: " + String(e), "error");
        setEnabled(btnGenKey, true);
      }
    });
  }

  // ENCRYPT
  if (btnEncFile) {
    btnEncFile.addEventListener("click", async () => {
      const f = fileIn?.files?.[0];
      if (!f || !generatedKeyB64) return;

      try {
        btnEncFile.disabled = true;

        // BACA 16 BYTE PERTAMA FILE UNTUK VISUALISASI DATA ASLI
        const readSample = () => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            const blob = f.slice(0, 16);
            reader.onload = (e) => {
              const buffer = e.target.result;
              const uint8 = new Uint8Array(buffer);
              let hex = "";
              for (let b of uint8) hex += b.toString(16).padStart(2, '0');
              resolve(hex);
            };
            reader.readAsArrayBuffer(blob);
          });
        };
        const sampleHex = await readSample();

        const prepRes = await fetch("/api/aes/encrypt_prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            key_b64: generatedKeyB64,
            sample_hex: sampleHex 
          }),
        });
        const prepData = await prepRes.json();
        
        const encSteps = ["Key Expansion", "Initial Round", "Main Rounds", "Final Round"];
        let currentStep = 1;

        while (currentStep <= encSteps.length) {
          let stepContent = "";
          
          if (currentStep === 1) {
            // STEP 1: KEY EXPANSION
            const rkHtml = prepData.round_keys.map(rk => `<div style="font-size: 11px; font-family: monospace;">Round ${String(rk.round).padStart(2, '0')}: ${rk.key_hex}</div>`).join("");

            stepContent = `
              <!--
              <div class="step-info">Membangkitkan 10 putaran kunci (round keys) dari kunci utama menggunakan algoritma Key Schedule AES.</div>
              -->
              <div class="aes-card">
                <div class="aes-card-title">🔑 HASIL GENERATE KEY</div>
                <div class="hex-box" style="color: #28a745; font-weight: bold; text-align: center;">${generatedKeyHex}</div>
              </div>
              <div class="aes-card">
                <div class="aes-card-title">🔄 ROUND KEYS (0 - 10)</div>
                <div class="hex-box" style="max-height: 150px; overflow-y: auto;">${rkHtml}</div>
              </div>
              <!--
              <div class="badge-info">Digunakan pada: AddRoundKey di setiap round</div>
              -->
            `;
          } else if (currentStep === 2) {
            // STEP 2: INITIAL ROUND
            stepContent = `
              <div class="step-info">Tahap awal enkripsi di mana plaintext dilakukan operasi XOR dengan Round Key 0.</div>
              <div class="aes-card">
                <div class="aes-card-title">📄 PLAINTEXT (HEX PREVIEW)</div>
                <div class="hex-box">${prepData.steps_info.initial.plaintext_hex}</div>
              </div>
              <div class="aes-card">
                <div class="aes-card-title">🔑 ROUND KEY (ROUND 0)</div>
                <div class="hex-box">${prepData.round_keys[0].key_hex}</div>
              </div>
              <div class="aes-card" style="border-left: 4px solid #1f6feb;">
                <div class="aes-card-title">⚡ HASIL XOR (STATE AWAL)</div>
                <div class="hex-box" style="background: #eef5ff;">${prepData.steps_info.initial.state_after_hex}</div>
              </div>
            `;
          } else if (currentStep === 3) {
            // STEP 3: MAIN ROUNDS
            stepContent = `
              <div class="step-info">Melakukan 9 kali putaran utama yang terdiri dari empat transformasi standar AES.</div>
              <div class="aes-card">
                <div class="aes-card-title">⚙️ PROSES TRANSFORMASI</div>
                <div style="font-size: 12px; padding: 5px;">
                  <div style="margin-bottom:8px;">✅ <b>SubBytes:</b> Substitusi non-linear tiap byte menggunakan S-Box.</div>
                  <div style="margin-bottom:8px;">✅ <b>ShiftRows:</b> Pergeseran baris pada state secara siklik.</div>
                  <div style="margin-bottom:8px;">✅ <b>MixColumns:</b> Pengacakan data antar kolom dalam state.</div>
                  <div style="margin-bottom:8px;">✅ <b>AddRoundKey:</b> Operasi XOR state dengan Round Key.</div>
                </div>
              </div>
              <div class="badge-info">Tahap ini diulang dari Round 1 hingga Round 9</div>
            `;
          } else {
            // STEP 4: FINAL ROUND
            stepContent = `
              <div class="step-info">Putaran terakhir (Round 10) tanpa transformasi MixColumns untuk menghasilkan ciphertext final.</div>
              <div class="aes-card">
                <div class="aes-card-title">⚙️ PROSES (TANPA MIXCOLUMNS)</div>
                <div style="font-size: 12px; padding: 5px;">
                   SubBytes ⮕ ShiftRows ⮕ AddRoundKey
                </div>
              </div>
              <div class="aes-card" style="background: linear-gradient(to right, #f0fff4, #ffffff); border-left: 4px solid #28a745;">
                <div class="aes-card-title" style="color: #28a745;">🔒 CIPHERTEXT HASIL AKHIR</div>
                <div class="hex-box" style="background: transparent; font-weight: bold; color: #218838;">${prepData.steps_info.final.state_after_hex || '...'}</div>
              </div>
            `;
          }

          const result = await Swal.fire({
            html: `
              ${renderProcessStepper(currentStep, encSteps)}
              ${stepContent}
            `,
            width: "600px",
            showDenyButton: currentStep > 1,
            showCancelButton: true,
            confirmButtonText: currentStep === encSteps.length ? "SELESAI" : "LANJUT",
            denyButtonText: "KEMBALI",
            cancelButtonText: "BATAL",
            buttonsStyling: false,
            allowOutsideClick: false,
            customClass: {
              confirmButton: `custom-swal-btn ${currentStep === encSteps.length ? 'swal-btn-finish' : 'swal-btn-next'}`,
              denyButton: 'custom-swal-btn swal-btn-back',
              cancelButton: 'custom-swal-btn swal-btn-cancel'
            }
          });

          if (result.isConfirmed) {
            currentStep++;
          } else if (result.isDenied) {
            currentStep--;
          } else {
            // BATAL
            btnEncFile.disabled = false;
            return;
          }
        }

        // Jika semua step selesai
        if (currentStep > encSteps.length) {
          // BUNGKUS FILE DALAM JSON (METADATA + BASE64)
          const b64Data = await fileToBase64(f);
          const payload = {
            filename: f.name,
            type: f.type,
            data: b64Data
          };
          const jsonString = JSON.stringify(payload);
          
          // Kirim JSON sebagai Blob (Virtual File) untuk menjaga kompatibilitas backend
          const blob = new Blob([jsonString], { type: 'application/json' });
          
          const fd = new FormData();
          fd.append("file", blob, f.name); // Tetap pakai nama asli agar lolos allowed_file check
          fd.append("key_b64", generatedKeyB64);
          
          const res = await fetch("/api/aes/encrypt_file", { method: "POST", body: fd });
          const data = await res.json();
          
          if (data.ok) {
            // Masukkan ke field yang sudah ada
            cipherEl.value = data.package.cipher_b64;

            // SIMPAN KE LOCALSTORAGE UNTUK BER
            localStorage.setItem("aes_baseline_result", JSON.stringify({
              cipher_b64: data.package.cipher_b64,
              filename: f.name,
              size: f.size
            }));

            // UPDATE METADATA UNTUK HISTORI
            lastMeta.encrypt_ms = data.package.meta.encrypt_ms;
            lastMeta.key_hex = data.package.key_hex || "-";
            lastMeta.filename = data.package.filename || "-";
            lastMeta.size_kb = (f.size / 1024).toFixed(2);

            const encTime = gid("encrypt_time");
            if (encTime) encTime.value = data.package.meta.encrypt_ms;

            setAfterEncryptSuccess();
            if (typeof updateBerButtonState === "function") updateBerButtonState();
            await Swal.fire({
              title: "BERHASIL!",
              text: "Proses enkripsi AES-128 telah selesai sempurna.",
              icon: "success",
              confirmButtonText: "SELESAI",
              customClass: {
                confirmButton: 'custom-swal-btn swal-btn-finish'
              },
              buttonsStyling: false
            });
          } else {
            showAlert("Error", data.error || "Gagal mengenkripsi file.", "error");
          }
        }
      } catch (e) {
        showAlert("Error", String(e), "error");
      } finally {
        btnEncFile.disabled = false;
      }
    });
  }

  // DECRYPT
  if (btnDec) {
    btnDec.addEventListener("click", async () => {
      const cipher = cipherEl.value;
      const key = keyB64El.value;
      if (!cipher || !key) return;

      try {
        // Ambil Round Keys (sama dengan enkripsi, hanya beda urutan penggunaan)
        const prepRes = await fetch("/api/aes/encrypt_prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key_b64: key }),
        });
        const prepData = await prepRes.json();

        const decSteps = ["Key Expansion", "Initial Round", "Main Rounds", "Final Round"];
        let currentStep = 1;

        while (currentStep <= decSteps.length) {
          let stepContent = "";
          
          if (currentStep === 1) {
            // STEP 1: KEY EXPANSION
            const rkHtml = prepData.round_keys.map(rk => `<div style="font-size: 11px; font-family: monospace;">Round ${String(rk.round).padStart(2, '0')}: ${rk.key_hex}</div>`).join("");

            stepContent = `
              <!--
              <div class="step-info">Membangkitkan semua round keys yang digunakan selama proses dekripsi (sama dengan proses enkripsi).</div>
              -->
              <div class="aes-card">
                <div class="aes-card-title">🔑 KUNCI AES</div>
                <div class="hex-box" style="color: #1f6feb; font-weight: bold; text-align: center;">${generatedKeyHex || '16-byte key'}</div>
              </div>
              <div class="aes-card">
                <div class="aes-card-title">🔄 ROUND KEYS (0 - 10)</div>
                <div class="hex-box" style="max-height: 120px; overflow-y: auto;">${rkHtml}</div>
              </div>
              <div class="aes-card" style="background: #f8f9fa;">
                <div class="aes-card-title">📍 DIGUNAKAN PADA</div>
                <div style="font-size: 11px; line-height: 1.5;">
                   • <b>Initial Round:</b> Round 10<br>
                   • <b>Main Rounds:</b> Round 9 - 1<br>
                   • <b>Final Round:</b> Round 0
                </div>
              </div>
            `;
          } else if (currentStep === 2) {
            // STEP 2: INITIAL ROUND
            stepContent = `
              <div class="step-info">Memulai dekripsi dengan Round Key terakhir (Round 10) dan melakukan operasi inverse awal.</div>
              <div class="aes-card">
                <div class="aes-card-title">🔒 CIPHERTEXT (PREVIEW)</div>
                <div class="hex-box" style="max-height: 60px; overflow-y: auto;">${cipher.substring(0, 64)}...</div>
              </div>
              <div class="aes-card">
                <div class="aes-card-title">🔑 ROUND KEY (ROUND 10)</div>
                <div class="hex-box">${prepData.round_keys[10].key_hex}</div>
              </div>
              <div class="aes-card">
                <div class="aes-card-title">⚙️ PROSES INVERSE</div>
                <div style="font-size: 12px; padding: 5px;">
                   AddRoundKey ⮕ InvShiftRows ⮕ InvSubBytes
                </div>
              </div>
              <div class="badge-info">Hasil: State awal untuk putaran utama</div>
            `;
          } else if (currentStep === 3) {
            // STEP 3: MAIN ROUNDS
            stepContent = `
              <div class="step-info">Melakukan 9 putaran inverse dari Round 9 hingga Round 1 menggunakan urutan operasi dekripsi standar.</div>
              <div class="aes-card">
                <div class="aes-card-title">⚙️ PROSES INVERSE TRANSFORMASI</div>
                <div style="font-size: 12px; padding: 5px;">
                  <div style="margin-bottom:8px;">✅ <b>InvShiftRows:</b> Kebalikan pergeseran baris.</div>
                  <div style="margin-bottom:8px;">✅ <b>InvSubBytes:</b> Substitusi balik menggunakan Inverse S-Box.</div>
                  <div style="margin-bottom:8px;">✅ <b>AddRoundKey:</b> XOR state dengan Round Key.</div>
                  <div style="margin-bottom:8px;">✅ <b>InvMixColumns:</b> Kebalikan pengacakan kolom.</div>
                </div>
              </div>
              <div class="badge-info">Proses ini dilakukan berulang dari Round 9 hingga Round 1</div>
            `;
          } else {
            // STEP 4: FINAL ROUND
            stepContent = `
              <div class="step-info">Putaran terakhir (Round 0) untuk mengembalikan data asli (plaintext).</div>
              <div class="aes-card">
                <div class="aes-card-title">⚙️ PROSES AKHIR</div>
                <div style="font-size: 12px; padding: 5px;">
                   InvShiftRows ⮕ InvSubBytes ⮕ AddRoundKey
                </div>
              </div>
              <div class="aes-card">
                <div class="aes-card-title">🔑 ROUND KEY (ROUND 0)</div>
                <div class="hex-box">${prepData.round_keys[0].key_hex}</div>
              </div>
              <div class="aes-card" style="background: linear-gradient(to right, #e7f3ff, #ffffff); border-left: 4px solid #1f6feb;">
                <div class="aes-card-title" style="color: #1f6feb;">🔓 PLAINTEXT (HASIL AKHIR)</div>
                <div style="padding: 10px; font-size: 12px; font-weight: bold; color: #114ba3;">
                   Data berhasil dikembalikan ke format asli.
                </div>
              </div>
            `;
          }

          const result = await Swal.fire({
            html: `
              ${renderProcessStepper(currentStep, decSteps, true)}
              ${stepContent}
            `,
            width: "600px",
            showDenyButton: currentStep > 1,
            showCancelButton: true,
            confirmButtonText: currentStep === decSteps.length ? "SELESAI" : "LANJUT",
            denyButtonText: "KEMBALI",
            cancelButtonText: "BATAL",
            buttonsStyling: false,
            allowOutsideClick: false,
            customClass: {
              confirmButton: `custom-swal-btn ${currentStep === decSteps.length ? 'swal-btn-finish' : 'swal-btn-next'}`,
              denyButton: 'custom-swal-btn swal-btn-back',
              cancelButton: 'custom-swal-btn swal-btn-cancel'
            }
          });

          if (result.isConfirmed) {
            currentStep++;
          } else if (result.isDenied) {
            currentStep--;
          } else {
            return; // Batal
          }
        }

        // Jika semua step selesai
        if (currentStep > decSteps.length) {
          const res = await fetch("/api/aes/decrypt_file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cipher_b64: cipher, key_b64: key, filename: lastMeta.filename })
          });
          
          if (!res.ok) {
             const errData = await res.json();
             throw new Error(errData.error || "Gagal dekripsi");
          }

          const decMs = res.headers.get("X-Dec-Ms");
          const decTime = gid("decrypt_time");
          if (decMs && decTime) {
            decTime.value = decMs;
            lastMeta.decrypt_ms = decMs;
          }

          const blob = await res.blob();
          const text = await blob.text();
          
          // Tampilkan di kolom plaintext
          if (plaintextOut) plaintextOut.value = text;

          try {
            const payload = JSON.parse(text);
            if (payload.filename && payload.data) {
              // Rekonstruksi file dari Base64
              const decryptedBlob = b64ToBlob(payload.data, payload.type);
              const url = URL.createObjectURL(decryptedBlob);
              const a = document.createElement("a");
              a.href = url;
              a.download = payload.filename;
              a.click();
              URL.revokeObjectURL(url);

              await Swal.fire({
                title: "BERHASIL!",
                text: "Proses dekripsi selesai. File asli (.pdf/.docx) berhasil direkonstruksi dan diunduh.",
                icon: "success",
                confirmButtonText: "SELESAI & DOWNLOAD",
                customClass: {
                  confirmButton: 'custom-swal-btn swal-btn-finish'
                },
                buttonsStyling: false
              });
              return;
            }
          } catch (e) {
            console.log("Bukan format JSON metadata, download sebagai file mentah.");
          }

          // Fallback untuk file lama (mentah)
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = lastMeta.filename || "decrypted_file";
          a.click();
          URL.revokeObjectURL(url);

          await Swal.fire({
            title: "BERHASIL!",
            text: "Proses dekripsi selesai. File telah diunduh.",
            icon: "success",
            confirmButtonText: "SELESAI & DOWNLOAD",
            customClass: {
              confirmButton: 'custom-swal-btn swal-btn-finish'
            },
            buttonsStyling: false
          });
        }
      } catch (e) {
        showAlert("Error", String(e), "error");
      }
    });
  }

  // ENTROPY TEST
  if (btnEntropy) {
    btnEntropy.addEventListener("click", async () => {
      const cipher = cipherEl.value;
      if (!cipher) return;
      try {
        btnEntropy.disabled = true;
        const res = await fetch("/api/aes/test_entropy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cipher_b64: cipher })
        });
        const data = await res.json();
        if (data.ok) {
          if (entropyOut) entropyOut.textContent = data.entropy;
          const resEnt = gid("resultEntropy");
          if (resEnt) {
            resEnt.innerHTML = `<div style="padding:8px; background:#e7f3ff; border:1px solid #007bff; border-radius:4px; color:#007bff; font-weight:bold;">Entropy: ${data.entropy}</div>`;
          }
          lastMeta.entropy_cipher = data.entropy;
          showAlert("Entropy Test", `Hasil: ${data.entropy}`, "success");
        }
      } catch (e) {
        showAlert("Error", String(e), "error");
      } finally {
        btnEntropy.disabled = false;
      }
    });
  }

  // NIST TEST
  if (btnNist) {
    btnNist.addEventListener("click", async () => {
      const cipher = cipherEl.value;
      if (!cipher) return;
      try {
        btnNist.disabled = true;
        const res = await fetch("/api/aes/test_nist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cipher_b64: cipher })
        });
        const data = await res.json();
        if (data.ok) {
          if (nistFreqOut) nistFreqOut.textContent = `${data.frequency.pass ? "Lolos" : "Gagal"} (p=${data.frequency.p_value.toFixed(6)})`;
          if (nistRunsOut) nistRunsOut.textContent = `${data.runs.pass ? "Lolos" : "Gagal"} (p=${data.runs.p_value.toFixed(6)})`;
          
          const resNist = gid("resultNist");
          if (resNist) {
            resNist.innerHTML = `<div style="padding:8px; background:#f8f9fa; border:1px solid #dee2e6; border-radius:4px; margin-bottom:5px;"><b>Frequency Test:</b> ${data.frequency.pass ? "Lolos" : "Gagal"} (p=${data.frequency.p_value.toFixed(6)})</div>`;
          }
          const resRuns = gid("resultNistRuns");
          if (resRuns) {
            resRuns.innerHTML = `<div style="padding:8px; background:#f8f9fa; border:1px solid #dee2e6; border-radius:4px;"><b>Runs Test:</b> ${data.runs.pass ? "Lolos" : "Gagal"} (p=${data.runs.p_value.toFixed(6)})</div>`;
          }

          lastMeta.nist_frequency = data.frequency.pass ? "Lolos" : "Gagal";
          lastMeta.nist_runs = data.runs.pass ? "Lolos" : "Gagal";
          lastMeta.nist_freq_p = data.frequency.p_value;
          lastMeta.nist_runs_p = data.runs.p_value;
          showAlert("NIST Test", "Selesai dijalankan.", "success");
        }
      } catch (e) {
        showAlert("Error", String(e), "error");
      } finally {
        btnNist.disabled = false;
      }
    });
  }

  // SAVE HISTORY
  if (btnSaveHistory) {
    btnSaveHistory.addEventListener("click", async () => {
      try {
        btnSaveHistory.disabled = true;
        const res = await fetch("/api/aes/export_xlsx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lastMeta)
        });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "aes_history.xlsx";
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        showAlert("Error", String(e), "error");
      } finally {
        btnSaveHistory.disabled = false;
      }
    });
  }

  // RESET HISTORY
  const btnResetHistory = gid("btnResetHistory");
  if (btnResetHistory) {
    btnResetHistory.addEventListener("click", async () => {
      const confirm = await Swal.fire({
        title: "Konfirmasi Reset",
        text: "Semua data histori di server akan dihapus permanen. Lanjutkan?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "YA, RESET",
        cancelButtonText: "BATAL",
        buttonsStyling: false,
        customClass: {
          confirmButton: 'custom-swal-btn swal-btn-cancel', // Warna merah
          cancelButton: 'custom-swal-btn swal-btn-next'
        }
      });

      if (confirm.isConfirmed) {
        try {
          const res = await fetch("/api/history/reset", { method: "POST" });
          const data = await res.json();
          if (data.ok) {
            showAlert("Berhasil", "Histori telah dibersihkan. Pengujian berikutnya akan dimulai dari awal.", "success");
          }
        } catch (e) {
          showAlert("Error", String(e), "error");
        }
      }
    });
  }

  // BER TEST
  function updateBerButtonState() {
    if (!btnBerTest) return;
    const b = localStorage.getItem("aes_baseline_result");
    const g = localStorage.getItem("aes_ga_result");
    if (b && g) {
      // Optional: check if same file
      const bd = JSON.parse(b);
      const gd = JSON.parse(g);
      if (bd.filename === gd.filename && bd.size === gd.size) {
        btnBerTest.disabled = false;
        btnBerTest.title = "Bandingkan BER Baseline vs GA";
      } else {
        btnBerTest.disabled = true;
        btnBerTest.title = "Ciphertext berasal dari file berbeda";
      }
    } else {
      btnBerTest.disabled = true;
      btnBerTest.title = "Kedua ciphertext diperlukan (Baseline & GA)";
    }
  }
  updateBerButtonState();

  if (btnBerTest) {
    btnBerTest.addEventListener("click", async () => {
      const cipherBaseline = localStorage.getItem("aes_baseline_result");
      const cipherGA = localStorage.getItem("aes_ga_result");

      if (!cipherBaseline || !cipherGA) {
        showAlert("Informasi", "Kedua ciphertext (Baseline & GA) diperlukan. Pastikan Anda telah melakukan enkripsi di kedua halaman.", "info");
        return;
      }

      const baselineData = JSON.parse(cipherBaseline);
      const gaData = JSON.parse(cipherGA);

      // Validasi file yang sama
      if (baselineData.filename !== gaData.filename || baselineData.size !== gaData.size) {
        showAlert("Error", "Ciphertext berasal dari file yang berbeda. Harap gunakan file yang sama untuk pengujian BER.", "error");
        return;
      }

      try {
        btnBerTest.disabled = true;
        const res = await fetch("/api/ber/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cipher_baseline_b64: baselineData.cipher_b64,
            cipher_ga_b64: gaData.cipher_b64
          })
        });
        const data = await res.json();
        if (data.ok) {
          const r = data.results;
          // UPDATE METADATA UNTUK HISTORI
          lastMeta.ber_value = r.ber_value.toFixed(6);
          lastMeta.ber_percentage = r.percentage.toFixed(4) + "%";

          const html = `
            <div style="text-align: left; font-size: 14px;">
              <p><b>Different Bits:</b> ${r.different_bits}</p>
              <p><b>Total Bits:</b> ${r.total_bits}</p>
              <p><b>BER Value:</b> ${r.ber_value.toFixed(6)}</p>
              <p><b>Bit Change Percentage:</b> ${r.percentage.toFixed(4)}%</p>
              <hr>
              <p style="font-size: 12px; color: #666;">* Membandingkan ciphertext AES Baseline vs AES+GA</p>
            </div>
          `;
          Swal.fire({
            title: "Bit Error Rate (BER) Result",
            html: html,
            icon: "success",
            confirmButtonText: "Selesai"
          });
          if (gid("resultBer")) {
            gid("resultBer").innerHTML = `<div style="padding:10px; background:#f3e5f5; border:1px solid #9c27b0; border-radius:8px; color:#7b1fa2; font-weight:bold;">BER: ${r.ber_value.toFixed(6)} (${r.percentage.toFixed(2)}%)</div>`;
          }
        } else {
          showAlert("Error", data.error || "Gagal hitung BER", "error");
        }
      } catch (e) {
        showAlert("Error", String(e), "error");
      } finally {
        btnBerTest.disabled = false;
      }
    });
  }
});
