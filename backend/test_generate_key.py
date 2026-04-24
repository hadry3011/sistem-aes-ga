"""
Test Generate Key AES Baseline
"""
import sys
sys.path.insert(0, 'app')
from crypto import aes_engine

# Buat file dummy
test_data = b"Test file content untuk generate key"

try:
    key_hex, key_b64 = aes_engine.derive_key_from_document(test_data)
    print("✅ BERHASIL")
    print(f"Key Hex: {key_hex}")
    print(f"Key Base64: {key_b64}")
    print(f"Key Length: {len(bytes.fromhex(key_hex))} bytes")
except Exception as e:
    print(f"❌ GAGAL: {e}")
    import traceback
    traceback.print_exc()
