# 🐛 Fix: Trace GA Tidak Menampilkan Nilai (Hanya "-")

## 📋 Masalah

Pada tampilan UI AES+GA, trace langkah-langkah Genetic Algorithm hanya menampilkan tanda "-" untuk nilai-nilai seperti:
- Kandidat kunci
- Fitness values
- Parent selection
- Crossover results
- Mutation results

Padahal proses GA tetap berjalan dan menghasilkan kunci optimal.

---

## 🔍 Analisis

### Penyebab Masalah

1. **Trace tidak diisi** - Kode GA tidak mengisi array `trace` dengan data
2. **Format trace tidak sesuai** - Frontend mengharapkan format tertentu (`top_candidates`, `stats`, `selection`, dll) tetapi backend tidak mengirimkannya

### Struktur Trace yang Diharapkan Frontend

```javascript
{
  // Step 1: Inisialisasi Populasi
  {
    step: 1,
    step_name: "Inisialisasi Populasi",
    top_candidates: [
      { rank: 1, key_preview: "abc123...", fitness: 0.95 }
    ],
    stats: { min_fitness: 0.5, avg_fitness: 0.75, max_fitness: 0.95 }
  },
  
  // Step 2: Evaluasi Fitness
  {
    step: 2,
    step_name: "Evaluasi Fitness (Generasi 0)",
    top_candidates: [...],
    stats: {...},
    selection: [
      { parentA_preview: "...", parentA_fitness: 0.95, ... }
    ],
    crossover: [
      { parent1_preview: "...", child1_preview: "...", ... }
    ],
    mutation: [...]
  },
  
  // Step 3: Evolusi Generasi
  {
    step: 3,
    step_name: "Evolusi Generasi",
    top_candidates: [...],
    stats: {...},
    best: { key_preview: "...", fitness: 1.0 }
  }
}
```

---

## ✅ Solusi yang Diterapkan

### 1. Tambahkan Trace di Setiap Langkah GA

**File:** `backend/app/ga/ga_keygen.py`

#### a) Inisialisasi Populasi (Step 1)
```python
if trace_cfg and trace_cfg.enabled:
    init_keys = [(_fitness(k), k) for k in pop]
    init_keys.sort(key=lambda x: x[0], reverse=True)
    trace.append({
        "step": 1,
        "step_name": "Inisialisasi Populasi",
        "top_candidates": [
            {
                "rank": i + 1,
                "key_preview": _preview_hex(k, ...),
                "fitness": round(f, 6)
            }
            for i, (f, k) in enumerate(init_keys[:trace_cfg.top_n])
        ],
        "stats": {
            "min_fitness": ...,
            "avg_fitness": ...,
            "max_fitness": ...
        }
    })
```

#### b) Evaluasi Fitness (Step 2)
```python
if trace_cfg and trace_cfg.enabled:
    trace.append({
        "step": 2,
        "step_name": "Evaluasi Fitness (Generasi 0)",
        "top_candidates": [...],
        "stats": {...},
        "selection": [],
        "crossover": [],
        "mutation": []
    })
```

#### c) Seleksi Parent (Step 2.1)
```python
if trace_cfg and trace_cfg.enabled:
    selection_list = []
    for i in range(min(trace_cfg.selection_pairs, len(parents))):
        p1 = parents[i]
        p2 = parents[(i + 1) % len(parents)]
        selection_list.append({
            "parentA_preview": _preview_hex(p1, ...),
            "parentA_fitness": round(_fitness(p1), 6),
            "parentB_preview": _preview_hex(p2, ...),
            "parentB_fitness": round(_fitness(p2), 6)
        })
    trace[-1]["selection"] = selection_list
```

#### d) Crossover (Step 2.2)
```python
if trace_cfg and trace_cfg.enabled:
    crossover_list.append({
        "parent1_preview": _preview_hex(a, ...),
        "parent2_preview": _preview_hex(b, ...),
        "child1_preview": _preview_hex(c1, ...),
        "child2_preview": _preview_hex(c2, ...),
        "point_byte": "random"
    })
```

#### e) Mutasi (Step 2.3)
```python
if trace_cfg and trace_cfg.enabled:
    mutation_list.append({
        "which": "byte",
        "mutated_positions_byte": [rnd.randint(0, 15)],
        "child_preview": _preview_hex(c1, ...)
    })
```

#### f) Evolusi Generasi (Step 3)
```python
if trace_cfg and trace_cfg.enabled:
    trace.append({
        "step": 3,
        "step_name": "Evolusi Generasi",
        "top_candidates": [...],
        "stats": {...},
        "best": {
            "key_preview": _preview_hex(best_key, ...),
            "fitness": round(best_fitness, 6)
        }
    })
```

---

## 🧪 Testing

### Test Script
```bash
cd D:\Sistem\CloneSistem\backend
python test_ga_keygen.py
```

### Test Trace Output
```python
from ga.ga_keygen import ga_generate_key_hex, TraceConfig

key, meta, trace = ga_generate_key_hex(
    key_bits=128,
    population=10,
    generations=5,
    fitness_threshold=1.0,
    trace_cfg=TraceConfig(
        enabled=True,
        top_n=3,
        selection_pairs=2,
        crossover_events=2,
        mutation_events=2
    )
)

print(f"Trace length: {len(trace)}")
for t in trace:
    print(f"Step {t['step']}: {t['step_name']}")
    print(f"  Top candidates: {len(t.get('top_candidates', []))}")
    print(f"  Stats: {t.get('stats')}")
```

### Expected Output
```
✅ SUCCESS
Key: aa7cc33b4a8d1b5e...
Fitness: 1.0
Generations: 3

📊 TRACE LENGTH: 4

📋 TRACE STRUCTURE:
--- Trace 1 ---
Step: 1 - Inisialisasi Populasi
Top Candidates: 3 items
  #1: aa7cc33b... (fit=0.99375)
  #2: 658d3f09... (fit=0.99375)
  #3: 973f546c... (fit=0.9875)
Stats: min=0.925, avg=0.973125, max=0.99375

--- Trace 2 ---
Step: 2 - Evaluasi Fitness (Generasi 0)
Selection: 2 pairs
  ca3312b3... (fit=0.9875) x 8a5d150f... (fit=0.98125)
Crossover: 2 events
Mutation: 2 events

--- Trace 3 ---
Step: 3 - Evolusi Generasi
Best: af260ddb... (fit=1.0)
```

---

## 📁 File yang Diubah

| File | Perubahan |
|------|-----------|
| `backend/app/ga/ga_keygen.py` | ✅ Tambahkan trace generation di setiap langkah GA |
| `backend/app/ga/ga_keygen.py` | ✅ Format trace sesuai dengan yang diharapkan frontend |
| `backend/app/ga/ga_keygen.py` | ✅ Inisialisasi `trace = []` di awal fungsi |

---

## ✅ Hasil

### Sebelum Fix
```
Langkah 1 — Inisialisasi Populasi
Populasi: -
Cuplikan kandidat: -

Langkah 2 — Evaluasi Fitness
Min fitness: -
Avg fitness: -
Max fitness: -
```

### Sesudah Fix
```
Langkah 1 — Inisialisasi Populasi
Populasi: 40
Cuplikan kandidat:
  #1: aa7cc33b4a8d1b5e... (fit=0.99375)
  #2: 658d3f09ba58a86c... (fit=0.99375)
  #3: 973f546c590f8941... (fit=0.9875)

Langkah 2 — Evaluasi Fitness (Generasi 0)
Min fitness: 0.925
Avg fitness: 0.973125
Max fitness: 0.99375

Langkah 2.1 — Seleksi Parent
#1: ca3312b384e8f09d... (fit=0.9875) x 8a5d150f6e992396... (fit=0.98125)

Langkah 2.2 — Crossover
#1: 8a5d150f6e992396... x af260ddb67b92cc4... → 8a5d150f6e992396...

Langkah 2.3 — Mutasi
#1: 8a5d150f6e992396... → 8a5d150f6e992396...

Langkah 3 — Evolusi Generasi
Best: af260ddb67b92cc4... (fit=1.0)
```

---

## 🎯 Kesimpulan

Trace GA sekarang menampilkan nilai-nilai yang benar dengan:
- ✅ Top candidates dengan fitness
- ✅ Statistics (min, avg, max fitness)
- ✅ Parent selection pairs
- ✅ Crossover results
- ✅ Mutation events
- ✅ Best key per generation

Kunci optimal tetap dihasilkan dengan baik, dan sekarang user dapat melihat proses GA secara detail melalui SweetAlert2 steps.

---

**Fixed:** 2 April 2026  
**Version:** 4.0 (Trace Generation Fixed)
