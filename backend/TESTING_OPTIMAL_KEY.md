# 📖 Dokumentasi Testing Kondisi Kunci Optimal

## 🎯 Overview

Dokumen ini menjelaskan cara testing kondisi **kunci optimal** pada sistem AES+GA (Genetic Algorithm) di CloneSistem.

---

## ⚙️ Parameter Kunci Optimal

| Parameter | Default | Keterangan |
|-----------|---------|------------|
| `fitness_threshold` | **0.95** | Minimum fitness agar kunci dianggap optimal |
| `population` | 40 | Jumlah kandidat kunci per generasi |
| `generations` | 60 | Maksimal iterasi evolusi |
| `crossover_rate` | 0.8 | Probabilitas crossover (80%) |
| `mutation_rate` | 0.02 | Probabilitas mutasi (2%) |
| `stagnation_limit` | 10 | Stop jika tidak ada improvement 10 generasi |

### Rumus Fitness
```python
fitness = (0.6 × entropy_norm) + (0.4 × balance)
```
- `entropy_norm = Shannon_Entropy / log2(len(key))` (0-1)
- `balance = 1 - abs(proportion_ones - 0.5) × 2` (0-1)

**Kunci OPTIMAL:** `fitness ≥ 0.95`  
**Kunci TIDAK OPTIMAL:** `fitness < 0.95` → **Generate GAGAL**

### 📊 Fitness Scale Interpretation

| Fitness Range | Kategori | Keterangan |
|---------------|----------|------------|
| 0.95 - 1.0 | ⭐ Optimal | Kunci dengan kualitas kriptografis terbaik |
| 0.90 - 0.95 | ✅ Sangat Baik | Kunci dengan kualitas tinggi |
| 0.85 - 0.90 | 👍 Baik | Kunci acceptable untuk penggunaan umum |
| 0.80 - 0.85 | ⚠️ Cukup | Minimum yang dapat diterima |
| < 0.80 | ❌ Buruk | Tidak direkomendasikan |

---

## 🧪 Skenario Testing

### ✅ Test 1: Generate Kunci Berhasil (Optimal)

**Kondisi:** Parameter default dengan threshold 0.95

**Cara Test:**
```bash
curl -X POST http://localhost:5000/api/aesga/generate_key \
  -F "file=@test_document.pdf"
```

**Expected Result:**
```json
{
  "ok": true,
  "key_b64": "...",
  "ga_meta": {
    "best_fitness": 1.0,
    "stop_reason": "threshold_reached",
    "fitness_threshold": 0.95,
    "final_fitness": 1.0,
    "generations": 1
  }
}
```

---

### ✅ Test 2: Generate dengan Threshold 1.0 (Sempurna)

**Kondisi:** Threshold diset ke 1.0 (sempurna)

**Cara Test:**
```bash
curl -X POST http://localhost:5000/api/aesga/generate_key \
  -F "file=@test_document.pdf" \
  -F "fitness_threshold=1.0"
```

**Expected Result:**
```json
{
  "ok": true,
  "ga_meta": {
    "best_fitness": 1.0,
    "stop_reason": "threshold_reached",
    "final_fitness": 1.0
  }
}
```

**Catatan:** GA sangat efisien dan dapat mencapai fitness 1.0 (sempurna) dengan mudah.

---

### ✅ Test 3: Generate Tanpa Mutasi

**Kondisi:** Mutation rate = 0 (hanya crossover)

**Cara Test:**
```bash
curl -X POST http://localhost:5000/api/aesga/generate_key \
  -F "file=@test_document.pdf" \
  -F "mutation_rate=0.0" \
  -F "fitness_threshold=0.99"
```

**Expected Result:**
```json
{
  "ok": true,
  "ga_meta": {
    "best_fitness": 1.0,
    "stop_reason": "threshold_reached"
  }
}
```

**Catatan:** Crossover saja cukup untuk menghasilkan kunci optimal.

---

### ❌ Test 4: Generate Gagal - Population Invalid

**Kondisi:** Population < 4 (invalid)

**Cara Test:**
```bash
curl -X POST http://localhost:5000/api/aesga/generate_key \
  -F "file=@test_document.pdf" \
  -F "population=2"
```

**Expected Result:**
```json
{
  "ok": false,
  "error": "population minimal 4"
}
```

---

## 🔧 Testing Manual via Python Script

Jalankan dari folder `backend/`:

```bash
cd D:\Sistem\CloneSistem\backend
python test_ga_keygen.py
```

Script ini akan menjalankan 8 test scenarios:
1. ✅ Parameter default
2. ✅ Threshold 1.0 (sempurna)
3. ✅ Tanpa mutasi
4. ❌ Population invalid
5. ✅ Seed fixed (reproducibility)
6. ✅ Minimum population valid
7. ✅ Threshold lebih rendah
8. ✅ Mutation rate tinggi

---

## 📊 Matrix Hasil Testing

| Test | Population | Generations | Mutation Rate | Threshold | Expected | Keterangan |
|------|------------|-------------|---------------|-----------|----------|------------|
| 1 | 40 | 60 | 0.02 | 0.95 | ✅ SUCCESS | Parameter normal |
| 2 | 4 | 50 | 0.02 | 1.0 | ✅ SUCCESS | GA efisien |
| 3 | 20 | 50 | 0.0 | 0.99 | ✅ SUCCESS | Crossover cukup |
| 4 | 2 | 60 | 0.02 | 0.95 | ❌ FAIL | Population invalid |
| 5 | 40 | 60 | 0.02 | 0.95 | ✅ SUCCESS | Seed fixed |
| 6 | 4 | 60 | 0.02 | 0.95 | ✅ SUCCESS | Min population |
| 7 | 30 | 40 | 0.02 | 0.90 | ✅ SUCCESS | Threshold rendah |
| 8 | 40 | 60 | 0.10 | 0.95 | ✅ SUCCESS | Mutation tinggi |

---

## 🛠️ Troubleshooting

### Problem: Generate selalu gagal
**Solusi:**
1. Turunkan `fitness_threshold` ke 0.90 untuk testing
2. Naikkan `population` ke 50-100
3. Naikkan `generations` ke 100-200
4. Pastikan `mutation_rate` > 0

### Problem: Generate terlalu lama
**Solusi:**
1. Turunkan `generations` ke 30-40
2. Turunkan `population` ke 20-30
3. Gunakan `fitness_threshold` lebih rendah (0.90-0.92)

### Problem: Fitness tidak stabil
**Solusi:**
1. Set `seed` fixed untuk reproducibility
2. Naikkan `population` untuk diversitas lebih baik
3. Adjust `mutation_rate` ke 0.03-0.05

---

## 📝 Catatan Penting

1. **Fitness 1.0 adalah maksimal** - dicapai dengan entropy sempurna (4.0) + bit balance sempurna (50/50)
2. **Threshold 0.95 adalah default** - Dapat disesuaikan via parameter
3. **GA sangat efisien** - Dapat mencapai fitness 1.0 dalam 1-2 generasi
4. **GA bersifat stochastic** - Hasil bisa berbeda setiap run meskipun parameter sama (kecuali pakai seed fixed)
5. **File input tidak mempengaruhi** - GA generate key secara independen dari file
6. **Crossover lebih penting dari mutasi** - Crossover saja cukup untuk mencapai optimal

---

## 📌 Checklist Testing

- [ ] Test 1: Generate normal (parameter default)
- [ ] Test 2: Threshold 1.0 (sempurna)
- [ ] Test 3: Tanpa mutasi
- [ ] Test 4: Population invalid (< 4)
- [ ] Test 5: Seed fixed untuk reproducibility
- [ ] Test 6: Minimum population valid (4)
- [ ] Test 7: Threshold lebih rendah (0.90)
- [ ] Test 8: Mutation rate tinggi (0.10)
- [ ] Test 9: Via UI (upload file + generate)

---

**Dibuat untuk:** Skripsi CloneSistem - AES+GA Key Optimization  
**Versi:** 3.0 (GA Efisien Confirmed)  
**Last Updated:** 2 April 2026
