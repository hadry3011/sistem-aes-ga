import base64

def calculate_ber(cipher1_b64, cipher2_b64):
    """
    Calculate Bit Error Rate (BER) between two ciphertexts.
    BER = different_bits / total_bits
    """
    try:
        data1 = base64.b64decode(cipher1_b64)
        data2 = base64.b64decode(cipher2_b64)
    except Exception as e:
        raise ValueError(f"Invalid base64 data: {str(e)}")

    # Bit Error Rate usually compares same length sequences
    # If they come from same plaintext with same padding, they should be same length
    min_len = min(len(data1), len(data2))
    max_len = max(len(data1), len(data2))
    
    different_bits = 0
    total_bits = max_len * 8

    # Compare bytes and count differing bits
    for i in range(min_len):
        xor_res = data1[i] ^ data2[i]
        # Count set bits in xor_res
        different_bits += bin(xor_res).count('1')

    # If lengths differ, the remaining bits are all considered "different"
    if len(data1) != len(data2):
        different_bits += (max_len - min_len) * 8

    ber_value = different_bits / total_bits if total_bits > 0 else 0
    percentage = ber_value * 100

    return {
        "different_bits": different_bits,
        "total_bits": total_bits,
        "ber_value": ber_value,
        "percentage": percentage,
        "len1": len(data1),
        "len2": len(data2)
    }
