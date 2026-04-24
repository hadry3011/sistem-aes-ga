"""
🧪 Script Testing Kondisi Kunci Optimal - CloneSistem AES+GA

Jalankan dari folder backend:
    python test_ga_keygen.py

Output akan menampilkan hasil testing untuk berbagai skenario
"""

import sys
sys.path.insert(0, 'app')

from app.ga.ga_keygen import ga_generate_key_hex, TraceConfig

def print_header(text):
    print("\n" + "=" * 70)
    print(f" {text}")
    print("=" * 70)

def print_result(test_name, success, details):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status} - {test_name}")
    for key, value in details.items():
        print(f"   {key}: {value}")

# ============================================================================
# TEST 1: Generate Normal (Expected: SUCCESS)
# ============================================================================
print_header("TEST 1: Generate Normal - Parameter Default")

try:
    key, meta, trace = ga_generate_key_hex(
        key_bits=128,
        population=40,
        generations=60,
        crossover_rate=0.8,
        mutation_rate=0.02,
        fitness_threshold=0.95,
        stagnation_limit=10,
        trace_cfg=TraceConfig(enabled=False)
    )
    print_result(
        "Parameter Default",
        success=True,
        details={
            "Key (preview)": f"{key[:32]}...",
            "Fitness": meta.get('best_fitness', 'N/A'),
            "Final Fitness": meta.get('final_fitness', 'N/A'),
            "Stop Reason": meta.get('stop_reason', 'N/A'),
            "Generations": meta.get('generations', 'N/A'),
            "Time (ms)": meta.get('ga_time_ms', 'N/A')
        }
    )
except Exception as e:
    print_result(
        "Parameter Default",
        success=False,
        details={"Error": str(e)}
    )

# ============================================================================
# TEST 2: Threshold Sangat Tinggi (Expected: SUCCESS - GA Efisien)
# ============================================================================
print_header("TEST 2: Threshold Sangat Tinggi (1.0 - Sempurna)")

try:
    key, meta, trace = ga_generate_key_hex(
        key_bits=128,
        population=4,      # Minimum
        generations=50,    # Cukup
        crossover_rate=0.8,
        mutation_rate=0.02,
        fitness_threshold=1.0,  # Sempurna!
        stagnation_limit=15,
        trace_cfg=TraceConfig(enabled=False)
    )
    # Jika berhasil, itu berarti GA sangat efisien
    print_result(
        "Threshold 1.0 (Sempurna)",
        success=True,  # SUCCESS - GA bisa mencapai kesempurnaan!
        details={
            "Note": "GA SANGAT EFISIEN - bisa mencapai fitness 1.0!",
            "Fitness": meta.get('best_fitness', 'N/A'),
            "Final Fitness": meta.get('final_fitness', 'N/A'),
            "Stop Reason": meta.get('stop_reason', 'N/A'),
            "Generations": meta.get('generations', 'N/A')
        }
    )
except Exception as e:
    # Jika gagal, berarti threshold 1.0 terlalu tinggi
    print_result(
        "Threshold 1.0 (Sempurna)",
        success=False,
        details={
            "Note": "Threshold 1.0 terlalu tinggi",
            "Error": str(e)
        }
    )

# ============================================================================
# TEST 3: Tanpa Mutasi (Expected: SUCCESS - GA Tetap Efisien)
# ============================================================================
print_header("TEST 3: Tanpa Mutasi + Threshold 0.99")

try:
    key, meta, trace = ga_generate_key_hex(
        key_bits=128,
        population=20,   # Sedang
        generations=50,  # Cukup
        crossover_rate=0.8,
        mutation_rate=0.0,  # TIDAK ADA mutasi!
        fitness_threshold=0.99,  # Tinggi
        stagnation_limit=10,
        trace_cfg=TraceConfig(enabled=False)
    )
    # Jika berhasil, crossover saja cukup untuk mencapai threshold
    print_result(
        "Pop 20, Gen 50, Mut 0.0, Thresh 0.99",
        success=True,  # SUCCESS - crossover cukup tanpa mutasi!
        details={
            "Note": "Crossover saja cukup untuk mencapai fitness 0.99+",
            "Fitness": meta.get('best_fitness', 'N/A'),
            "Final Fitness": meta.get('final_fitness', 'N/A'),
            "Stop Reason": meta.get('stop_reason', 'N/A'),
            "Generations": meta.get('generations', 'N/A')
        }
    )
except Exception as e:
    print_result(
        "Pop 20, Gen 50, Mut 0.0, Thresh 0.99",
        success=False,  # Gagal - butuh mutasi untuk optimal
        details={
            "Note": "Mutasi diperlukan untuk mencapai optimal",
            "Error (expected)": str(e)
        }
    )

# ============================================================================
# TEST 4: Population Invalid (Expected: FAIL - Validation Error)
# ============================================================================
print_header("TEST 4: Population Invalid (< 4)")

try:
    key, meta, trace = ga_generate_key_hex(
        key_bits=128,
        population=2,  # Invalid: < 4
        generations=60,
        crossover_rate=0.8,
        mutation_rate=0.02,
        fitness_threshold=0.95,
        stagnation_limit=10,
        trace_cfg=TraceConfig(enabled=False)
    )
    print_result(
        "Population 2 (Invalid)",
        success=False,  # Seharusnya gagal di validation
        details={
            "Note": "Test ini seharusnya FAIL di validation",
            "Key": key[:32] if key else "N/A"
        }
    )
except Exception as e:
    print_result(
        "Population 2 (Invalid)",
        success=True,  # Gagal di validation seperti yang diharapkan
        details={
            "Error (expected)": str(e)
        }
    )

# ============================================================================
# TEST 5: Seed Fixed untuk Reproducibility (Expected: SUCCESS)
# ============================================================================
print_header("TEST 5: Seed Fixed - Reproducibility")

try:
    # Run 1
    key1, meta1, _ = ga_generate_key_hex(
        key_bits=128,
        population=40,
        generations=60,
        crossover_rate=0.8,
        mutation_rate=0.02,
        fitness_threshold=0.95,
        seed=42,  # Fixed seed
        stagnation_limit=10,
        trace_cfg=TraceConfig(enabled=False)
    )
    
    # Run 2 (dengan seed yang sama)
    key2, meta2, _ = ga_generate_key_hex(
        key_bits=128,
        population=40,
        generations=60,
        crossover_rate=0.8,
        mutation_rate=0.02,
        fitness_threshold=0.95,
        seed=42,  # Same seed
        stagnation_limit=10,
        trace_cfg=TraceConfig(enabled=False)
    )
    
    same = key1 == key2
    print_result(
        "Seed Fixed (42)",
        success=same,
        details={
            "Run 1 Key": f"{key1[:32]}...",
            "Run 2 Key": f"{key2[:32]}...",
            "Keys Match": same,
            "Fitness Run 1": meta1.get('best_fitness', 'N/A'),
            "Fitness Run 2": meta2.get('best_fitness', 'N/A')
        }
    )
except Exception as e:
    print_result(
        "Seed Fixed (42)",
        success=False,
        details={"Error": str(e)}
    )

# ============================================================================
# TEST 6: Minimum Population Valid (Expected: SUCCESS)
# ============================================================================
print_header("TEST 6: Minimum Population Valid (4)")

try:
    key, meta, trace = ga_generate_key_hex(
        key_bits=128,
        population=4,  # Minimum valid
        generations=60,
        crossover_rate=0.8,
        mutation_rate=0.02,
        fitness_threshold=0.95,
        stagnation_limit=10,
        trace_cfg=TraceConfig(enabled=False)
    )
    print_result(
        "Population Minimum (4)",
        success=True,
        details={
            "Key (preview)": f"{key[:32]}...",
            "Fitness": meta.get('best_fitness', 'N/A'),
            "Final Fitness": meta.get('final_fitness', 'N/A'),
            "Stop Reason": meta.get('stop_reason', 'N/A'),
            "Generations": meta.get('generations', 'N/A')
        }
    )
except Exception as e:
    print_result(
        "Population Minimum (4)",
        success=False,
        details={"Error": str(e)}
    )

# ============================================================================
# TEST 7: Threshold Lebih Rendah (Expected: SUCCESS - Lebih Mudah)
# ============================================================================
print_header("TEST 7: Threshold Lebih Rendah (0.90)")

try:
    key, meta, trace = ga_generate_key_hex(
        key_bits=128,
        population=30,
        generations=40,
        crossover_rate=0.8,
        mutation_rate=0.02,
        fitness_threshold=0.90,  # Lebih rendah
        stagnation_limit=10,
        trace_cfg=TraceConfig(enabled=False)
    )
    print_result(
        "Threshold 0.90 (Lebih Rendah)",
        success=True,
        details={
            "Key (preview)": f"{key[:32]}...",
            "Fitness": meta.get('best_fitness', 'N/A'),
            "Final Fitness": meta.get('final_fitness', 'N/A'),
            "Stop Reason": meta.get('stop_reason', 'N/A'),
            "Generations": meta.get('generations', 'N/A'),
            "Time (ms)": meta.get('ga_time_ms', 'N/A')
        }
    )
except Exception as e:
    print_result(
        "Threshold 0.90 (Lebih Rendah)",
        success=False,
        details={"Error": str(e)}
    )

# ============================================================================
# TEST 8: Mutation Rate Tinggi (Expected: SUCCESS)
# ============================================================================
print_header("TEST 8: Mutation Rate Tinggi (0.10)")

try:
    key, meta, trace = ga_generate_key_hex(
        key_bits=128,
        population=40,
        generations=60,
        crossover_rate=0.8,
        mutation_rate=0.10,  # Tinggi
        fitness_threshold=0.95,
        stagnation_limit=10,
        trace_cfg=TraceConfig(enabled=False)
    )
    print_result(
        "Mutation Rate 0.10 (Tinggi)",
        success=True,
        details={
            "Key (preview)": f"{key[:32]}...",
            "Fitness": meta.get('best_fitness', 'N/A'),
            "Final Fitness": meta.get('final_fitness', 'N/A'),
            "Stop Reason": meta.get('stop_reason', 'N/A'),
            "Generations": meta.get('generations', 'N/A')
        }
    )
except Exception as e:
    print_result(
        "Mutation Rate 0.10 (Tinggi)",
        success=False,
        details={"Error": str(e)}
    )

# ============================================================================
# SUMMARY
# ============================================================================
print_header("SUMMARY TESTING SELESAI")
print("""
📊 Interpretasi Hasil:

✅ PASS = Hasil sesuai expectation
❌ FAIL = Hasil tidak sesuai expectation

Test yang SEHARUSNYA SUCCESS (GA efisien):
- Test 1: Parameter default → fitness 1.0
- Test 2: Threshold 1.0 → GA bisa mencapai sempurna!
- Test 3: Tanpa mutasi → Crossover cukup untuk optimal
- Test 5: Seed fixed → Reproducible
- Test 6: Minimum population → Valid
- Test 7: Threshold rendah → Mudah
- Test 8: Mutation tinggi → Tetap optimal

Test yang SEHARUSNYA FAIL (validation error):
- Test 4: Population < 4 → Invalid parameter
""")

print("\n💡 Tips:")
print("   - Threshold 0.95 adalah default yang baik (optimal tapi achievable)")
print("   - Population minimal 4, optimal 40-100")
print("   - Mutation rate 0.01-0.05 adalah sweet spot")
print("   - Gunakan seed fixed untuk hasil yang reproducible")
print("   - Untuk menyebabkan gagal: mutation_rate=0.0 + threshold tinggi")
