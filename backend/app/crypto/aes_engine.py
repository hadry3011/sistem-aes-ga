import base64
import hashlib
from dataclasses import dataclass
from Crypto.Cipher import AES

@dataclass
class AesResult:
    mode: str
    key_b64: str
    key_hex: str
    cipher_b64: str

# -------------------------
# AES Constants & Key Expansion
# -------------------------
SBOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
]

RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36]

def aes_key_expansion(key_bytes: bytes) -> list:
    """
    Generate 11 round keys (Round 0 - 10) dari AES-128 key.
    Return list of hex strings.
    """
    if len(key_bytes) != 16:
        raise ValueError("Key harus 16 byte untuk AES-128")

    nk = 4
    nr = 10
    nb = 4

    w = []
    for i in range(nk):
        w.append([key_bytes[4*i], key_bytes[4*i+1], key_bytes[4*i+2], key_bytes[4*i+3]])

    for i in range(nk, nb * (nr + 1)):
        temp = list(w[i - 1])
        if i % nk == 0:
            temp = temp[1:] + temp[:1]
            temp = [SBOX[b] for b in temp]
            temp[0] ^= RCON[i // nk]
        w.append([w[i - nk][j] ^ temp[j] for j in range(4)])

    round_keys = []
    for rnd in range(nr + 1):
        start_idx = rnd * nb
        rk_bytes = []
        for word_idx in range(nb):
            rk_bytes.extend(w[start_idx + word_idx])
        round_keys.append(bytes(rk_bytes).hex().upper())

    return round_keys

# -------------------------
# PKCS7 padding helpers
# -------------------------
def _pkcs7_pad(data: bytes, block_size: int = 16) -> bytes:
    pad_len = block_size - (len(data) % block_size)
    return data + bytes([pad_len]) * pad_len


def _pkcs7_unpad(data: bytes, block_size: int = 16) -> bytes:
    if not data:
        raise ValueError("Invalid padding: empty data")
    pad_len = data[-1]
    if pad_len < 1 or pad_len > block_size:
        raise ValueError("Invalid padding length")
    if data[-pad_len:] != bytes([pad_len]) * pad_len:
        raise ValueError("Invalid padding bytes")
    return data[:-pad_len]


# =========================================================
# Key Derivation (Deterministik)
# =========================================================
def derive_key_aes128_from_data(data: bytes) -> bytes:
    """
    Membentuk kunci AES-128 (16 byte) secara deterministik
    dari seluruh isi data menggunakan SHA-256.
    """
    digest = hashlib.sha256(data).digest()
    return digest[:16]  # 128 bit


def _ensure_key_16(key: bytes) -> bytes:
    if not isinstance(key, (bytes, bytearray)):
        raise TypeError("Key harus bertipe bytes.")
    if len(key) != 16:
        raise ValueError("Panjang key AES-128 harus 16 byte.")
    return bytes(key)


# =========================================================
# AES Baseline - BYTES (MODE_CBC)
# =========================================================
def encrypt_aes_baseline_bytes(data: bytes, key: bytes) -> AesResult:
    key = _ensure_key_16(key)
    
    # Gunakan mode CBC agar lolos NIST (Pola data disembunyikan)
    # IV harus acak setiap kali enkripsi dilakukan
    import os
    iv = os.urandom(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ct = cipher.encrypt(_pkcs7_pad(data, 16))
    
    # Gabungkan IV + Ciphertext agar bisa didekripsi nantinya
    final_ct = iv + ct

    return AesResult(
        mode="AES-128-CBC",
        key_b64=base64.b64encode(key).decode("ascii"),
        key_hex=key.hex(),
        cipher_b64=base64.b64encode(final_ct).decode("ascii"),
    )


def decrypt_aes_baseline_bytes(cipher_b64: str, key: str) -> bytes:
    key_bytes = base64.b64decode(key)
    key_bytes = _ensure_key_16(key_bytes)

    full_ct = base64.b64decode(cipher_b64)
    if len(full_ct) < 32:
        raise ValueError("Ciphertext terlalu pendek (minimal IV + 1 blok data)")
    
    # Ekstrak IV (16 byte pertama) dan ciphertext aslinya
    iv = full_ct[:16]
    ct = full_ct[16:]
    
    cipher = AES.new(key_bytes, AES.MODE_CBC, iv)
    pt_padded = cipher.decrypt(ct)
    return _pkcs7_unpad(pt_padded, 16)


def encrypt_document_bytes_with_derived_key(data: bytes) -> AesResult:
    key = derive_key_aes128_from_data(data)
    return encrypt_aes_baseline_bytes(data, key)


def derive_key_from_document(data: bytes) -> tuple:
    """
    Menghasilkan kunci AES-128 dari dokumen tanpa melakukan enkripsi.
    Mengembalikan tuple: (key_hex, key_b64)
    """
    key = derive_key_aes128_from_data(data)
    key_hex = key.hex()
    key_b64 = base64.b64encode(key).decode("ascii")
    return key_hex, key_b64