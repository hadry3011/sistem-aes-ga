const gid = (id) => document.getElementById(id);

function formatKB(bytes) {
  if (!bytes && bytes !== 0) return "-";
  return (bytes / 1024).toFixed(2) + " KB";
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
  
  // Judul teks dan Ikon informasi lingkaran biru
  html += `
    <div style="text-align:center; margin-bottom:15px; display: flex; align-items: center; justify-content: center; gap: 12px;">
      <h3 style="margin: 0; font-size: 20px; font-weight: bold; color: #333;">${title}</h3>
      <div style="display:inline-flex; align-items:center; justify-content:center; width:35px; height:35px; border-radius:50%; background:#e7f3ff; color:#007bff; border:2px solid #007bff; font-size:18px; font-weight:bold; font-family:serif;">
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

function showAlert(title, text, icon) {
  Swal.fire({ title, text, icon, confirmButtonText: "OK" });
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
    nist_runs_p: "-"
  };

  let generatedKeyB64 = null;
  let generatedKeyHex = null;

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
          html: `Kunci diturunkan dari isi file secara deterministik.`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false
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
        const prepRes = await fetch("/api/aes/encrypt_prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key_b64: generatedKeyB64 }),
        });
        const prepData = await prepRes.json();
        
        const encSteps = ["Key Expansion", "Initial Round", "Main Rounds", "Final Round"];
        let currentStep = 1;

        while (currentStep <= encSteps.length) {
          let stepHtml = "";
          if (currentStep === 1) {
            const rkHtml = prepData.round_keys.map(rk => `<div>Round ${rk.round}: ${rk.key_hex}</div>`).join("");
            stepHtml = `<b>Key Expansion:</b><div style="text-align:left; font-family:monospace; font-size:11px; max-height:200px; overflow-y:auto; border:1px solid #ddd; padding:10px;">${rkHtml}</div>`;
          } else if (currentStep === 2) {
            stepHtml = `<p>${prepData.steps_info.initial.description}</p>`;
          } else if (currentStep === 3) {
            stepHtml = `<p>${prepData.steps_info.main.description}</p>`;
          } else {
            stepHtml = `<p>${prepData.steps_info.final.description}</p>`;
          }

          const result = await Swal.fire({
            title: "",
            html: `${renderProcessStepper(currentStep, encSteps)}<div style="text-align:left;">${stepHtml}</div>`,
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
          fd.append("key_b64", generatedKeyB64);
          const res = await fetch("/api/aes/encrypt_file", { method: "POST", body: fd });
          const data = await res.json();
          
          if (data.ok) {
            cipherEl.value = data.package.cipher_b64;
            lastMeta.encrypt_ms = data.package.meta.encrypt_ms;
            
            // Tampilkan waktu enkripsi
            if (gid("encrypt_time")) gid("encrypt_time").value = data.package.meta.encrypt_ms;
            
            // Explicitly enable buttons
            if (btnDec) btnDec.disabled = false;
            if (btnSaveHistory) btnSaveHistory.disabled = false;
            if (btnEntropy) btnEntropy.disabled = false;
            if (btnNist) btnNist.disabled = false;

            setAfterEncryptSuccess();
            showAlert("Sukses", "Enkripsi Selesai!", "success");
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

      const decSteps = ["Base64 Decode", "AES Decrypt", "Unpadding", "Reconstruct"];
      let currentStep = 1;

      try {
        const infoRes = await fetch("/api/aes/decrypt_info", {
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
          const res = await fetch("/api/aes/decrypt_file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cipher_b64: cipher, key_b64: key, filename: lastMeta.filename })
          });
          
          const decMs = res.headers.get("X-Dec-Ms");
          if (decMs && gid("decrypt_time")) {
            gid("decrypt_time").value = decMs;
            lastMeta.decrypt_ms = decMs;
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
          entropyOut.textContent = data.entropy;
          if (gid("resultEntropy")) {
            gid("resultEntropy").innerHTML = `<div style="padding:8px; background:#e7f3ff; border:1px solid #007bff; border-radius:4px; color:#007bff; font-weight:bold;">Entropy: ${data.entropy}</div>`;
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
          nistFreqOut.textContent = `${data.frequency.pass ? "Lolos" : "Gagal"} (p=${data.frequency.p_value.toFixed(6)})`;
          nistRunsOut.textContent = `${data.runs.pass ? "Lolos" : "Gagal"} (p=${data.runs.p_value.toFixed(6)})`;
          
          if (gid("resultNist")) {
            gid("resultNist").innerHTML = `<div style="padding:8px; background:#f8f9fa; border:1px solid #dee2e6; border-radius:4px; margin-bottom:5px;"><b>Frequency Test:</b> ${data.frequency.pass ? "Lolos" : "Gagal"} (p=${data.frequency.p_value.toFixed(6)})</div>`;
          }
          if (gid("resultNistRuns")) {
            gid("resultNistRuns").innerHTML = `<div style="padding:8px; background:#f8f9fa; border:1px solid #dee2e6; border-radius:4px;"><b>Runs Test:</b> ${data.runs.pass ? "Lolos" : "Gagal"} (p=${data.runs.p_value.toFixed(6)})</div>`;
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
});
