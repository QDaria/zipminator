# NIST Test Vectors for Kyber-768

## Overview

This directory should contain official NIST FIPS 203 (ML-KEM) test vectors for CRYSTALS-Kyber-768.

## Required Files

- `kyber768.rsp` - Official NIST Known Answer Test vectors
- Or: `PQCkemKAT_3168.rsp` - Alternative filename from NIST

## Download Instructions

### Official NIST Source

1. Visit the NIST Post-Quantum Cryptography Project:
   https://csrc.nist.gov/projects/post-quantum-cryptography

2. Or download directly from the reference repository:
   https://github.com/post-quantum-cryptography/KAT

3. Locate Kyber-768 (ML-KEM-768) test vectors:
   ```bash
   wget https://github.com/post-quantum-cryptography/KAT/raw/main/CRYSTALS-Kyber/PQCkemKAT_3168.rsp
   ```

4. Rename to expected filename:
   ```bash
   mv PQCkemKAT_3168.rsp kyber768.rsp
   ```

### CRYSTALS-Kyber Reference

Alternative source from official CRYSTALS-Kyber repository:

```bash
git clone https://github.com/pq-crystals/kyber.git
cp kyber/ref/kat/* .
```

## File Format

NIST KAT files follow this format:

```
# CRYSTALS-Kyber-768 Known Answer Test

count = 0
seed = 7c9935a0b07694aa0c6d10e4db6b1add2fd81a25ccb14803...
pk = 3a4f92e15b6d8f0c...
sk = a7b3e9c8d5f1a6...
ct = 8d9e2f4a7b1c...
ss = f4e7a2b9c8d3...

count = 1
seed = 8f3a1c2b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5...
...
```

### Field Descriptions

- **count**: Test vector number (sequential)
- **seed**: 48-byte entropy input (hex-encoded)
- **pk**: Expected public key (1184 bytes, hex-encoded)
- **sk**: Expected secret key (2400 bytes, hex-encoded)
- **ct**: Expected ciphertext (1088 bytes, hex-encoded)
- **ss**: Expected shared secret (32 bytes, hex-encoded)

## Validation

To verify you have the correct test vectors:

```bash
# Check file exists
ls -lh kyber768.rsp

# Count test vectors (look for "count =" lines)
grep -c "^count" kyber768.rsp

# Verify format
head -20 kyber768.rsp
```

Expected output should show:
- Multiple test vectors (typically 100+)
- Hex-encoded values for all fields
- Consistent formatting

## Size Reference

Kyber-768 (NIST Level 3) sizes:
- Public Key: 1184 bytes (2368 hex chars)
- Secret Key: 2400 bytes (4800 hex chars)
- Ciphertext: 1088 bytes (2176 hex chars)
- Shared Secret: 32 bytes (64 hex chars)
- Seed: 48 bytes (96 hex chars)

## Troubleshooting

### "File not found" Error

```bash
# Ensure you're in the correct directory
pwd
# Should be: .../compliance/nist-kat/test_vectors

# Check if file exists with different name
ls -la
```

### "Invalid format" Error

Ensure the file:
1. Uses correct field names (seed, pk, sk, ct, ss)
2. Has hex-encoded values (no spaces in hex strings)
3. Follows NIST format exactly

### Sample Vector Generation

If official vectors are unavailable, the test suite can generate sample vectors:

```bash
cd ..
make test
# Will generate and use sample vectors automatically
```

**Note**: Sample vectors are for development/testing only. They **do not** substitute for official NIST vectors for certification purposes.

## Important Notes

### For Development
- Sample vectors are sufficient for basic validation
- Useful for catching obvious bugs
- Enable rapid iteration

### For Certification
- **Must** use official NIST test vectors
- Sample vectors are **not acceptable** for FIPS submission
- Document vector source in certification package

## Security Considerations

Test vectors are **public data** and contain:
- ✓ Seeds (public)
- ✓ Public keys (public)
- ✓ Ciphertexts (public)
- ✗ Secret keys (test only - **never use in production**)

**Never** use keys or secrets from test vectors in production systems!

## License

NIST test vectors are in the **public domain** (U.S. Government work).

Reference implementation test vectors follow the CC0 or public domain dedication.

## Support

For questions about:
- **Test vector format**: See NIST CAVP documentation
- **Missing vectors**: Check NIST PQC project status
- **Certification**: Contact CMVP (NIST/CSE)

## References

- [NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST PQC Project](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [CRYSTALS-Kyber](https://pq-crystals.org/kyber/)
- [CAVP](https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program)
