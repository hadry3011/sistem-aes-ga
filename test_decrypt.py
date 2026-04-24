"""
Test decrypt_info endpoint
"""
import base64
import sys

# Buat test data
test_cipher = base64.b64encode(b"test content" * 10).decode()
test_key = base64.b64encode(b"0" * 16).decode()

print("Testing decrypt_info endpoint...")
print(f"Cipher: {test_cipher[:50]}...")
print(f"Key: {test_key}")

# Test import langsung
sys.path.insert(0, 'backend')
from app.crypto import aes_engine

try:
    # Encrypt dulu
    result = aes_engine.encrypt_aes_baseline_bytes(b"test content" * 10, b"0" * 16)
    print(f"\n✅ Encrypt berhasil")
    print(f"Cipher Base64: {result.cipher_b64[:50]}...")
    print(f"Key Base64: {result.key_b64}")
    
    # Test decrypt
    decrypted = aes_engine.decrypt_aes_baseline_bytes(result.cipher_b64, result.key_b64)
    print(f"\n✅ Decrypt berhasil")
    print(f"Decrypted: {decrypted}")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
