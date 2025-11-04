# Zipminator Encryption Features - Complete Technical Specification

**Analysis Date:** 2025-10-30
**Repository:** https://github.com/MoHoushmand/zipminator

---

## 1. PRIMARY ENCRYPTION: AES-256

### 1.1 Implementation Details

**File:** `/zipminator/zipit.py`
**Lines:** 45-48

```python
with pyzipper.AESZipFile(df_zip, 'w',
                         compression=pyzipper.ZIP_DEFLATED,
                         encryption=getattr(pyzipper, f'WZ_{self.encryption_algorithm}')) as zf:
    zf.setpassword(self.password.encode('utf-8'))
    zf.write(self.file_name)
```

### 1.2 Technical Specifications

| Parameter | Value | Standard |
|-----------|-------|----------|
| **Algorithm** | AES (Advanced Encryption Standard) | FIPS 197 |
| **Mode** | WinZip AES | WZ_AES specification |
| **Key Lengths** | 128-bit, 192-bit, 256-bit | Configurable |
| **Default** | 256-bit | Highest security |
| **Block Size** | 128 bits | AES standard |
| **Library** | pyzipper v0.3.6 | Python package |
| **Compression** | DEFLATE | ZIP standard |

### 1.3 Encryption Strength

**AES-256 Security Level:**
- **Key Space:** 2^256 possible keys (115,792,089,237,316,195,423,570,985,008,687,907,853,269,984,665,640,564,039,457,584,007,913,129,639,936)
- **Brute Force Time:** Estimated billions of years with current technology
- **NSA Classification:** Approved for TOP SECRET information
- **Quantum Resistance:** Reduces to ~128-bit security under Grover's algorithm (still strong)

**Industry Standards:**
- NIST FIPS 197 compliant
- ISO/IEC 18033-3 approved
- Used by governments, militaries, and financial institutions worldwide

### 1.4 WinZip AES Specification

The `WZ_AES` encryption mode follows WinZip's AES implementation:

**Components:**
1. **Encryption:** AES in CTR mode (Counter mode)
2. **Key Derivation:** PBKDF2 (Password-Based Key Derivation Function 2)
3. **Hash Function:** HMAC-SHA1
4. **Salt:** Random salt generated per archive
5. **Iterations:** 1000 rounds (WinZip standard)
6. **Authentication:** HMAC-SHA1 authentication code

**Archive Structure:**
```
ZIP Archive (AES Encrypted)
├── Salt (random, varies by key length)
├── Password Verification Value (2 bytes)
├── Encrypted Data (AES-CTR)
└── Authentication Code (HMAC-SHA1, 10 bytes)
```

### 1.5 Key Derivation Process

**Algorithm:** PBKDF2 (RFC 2898)

```
Key = PBKDF2(password, salt, iterations, key_length)

Where:
- password: User-provided password (UTF-8 encoded)
- salt: Random bytes (8 bytes for AES-128, 12 for AES-192, 16 for AES-256)
- iterations: 1000 (WinZip standard)
- key_length: Derived key size based on AES mode
```

**Derived Key Components:**
- Encryption key (16/24/32 bytes for AES-128/192/256)
- Authentication key (for HMAC)
- Password verification value

---

## 2. PASSWORD HANDLING

### 2.1 Secure Input

**File:** `/zipminator/zipit.py:32-33`

```python
if self.password is None:
    self.password = getpass.getpass('Enter password: ')
```

**Features:**
- Uses Python's `getpass` module
- Password not echoed to terminal
- Prevents shoulder-surfing attacks
- Cross-platform compatible (Unix, Windows)

### 2.2 Password Encoding

```python
zf.setpassword(self.password.encode('utf-8'))
```

**Encoding:** UTF-8 (Unicode Transformation Format - 8 bit)
- Supports international characters
- Allows emojis and special symbols
- Standard web encoding format

### 2.3 Password Security Analysis

**Current Implementation:**
- ✅ Secure input (no echo)
- ✅ UTF-8 encoding
- ❌ No strength validation
- ❌ No complexity requirements
- ❌ No minimum length enforcement
- ❌ Memory not securely cleared after use

**Recommended Password Policy:**
```python
import re

def validate_password(password):
    """
    Enforce strong password requirements
    """
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters")

    if not re.search(r'[A-Z]', password):
        raise ValueError("Password must contain uppercase letter")

    if not re.search(r'[a-z]', password):
        raise ValueError("Password must contain lowercase letter")

    if not re.search(r'\d', password):
        raise ValueError("Password must contain digit")

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValueError("Password must contain special character")

    return True
```

---

## 3. ENCRYPTION ALGORITHM CONFIGURATION

### 3.1 Constructor Parameter

**File:** `/zipminator/zipit.py:15-16`

```python
def __init__(self, file_name='df', file_format='csv',
             self_destruct_time=(672, 0, 0),
             password=None,
             encryption_algorithm='AES',  # <-- Configurable
             mask_columns=None,
             anonymize_columns=None,
             compliance_check=False,
             audit_trail=False):
    self.encryption_algorithm = encryption_algorithm
```

### 3.2 Dynamic Encryption Selection

```python
encryption=getattr(pyzipper, f'WZ_{self.encryption_algorithm}')
```

**This allows:**
```python
# Use AES-256 (default)
z = Zipndel(encryption_algorithm='AES')

# Theoretically supports other algorithms via attribute lookup
z = Zipndel(encryption_algorithm='CUSTOM')  # Would look for pyzipper.WZ_CUSTOM
```

### 3.3 Documented vs Actual Algorithms

| Algorithm | Documented | Implemented | Available in pyzipper |
|-----------|-----------|-------------|----------------------|
| AES | ✅ Yes | ✅ Yes | ✅ Yes |
| Blowfish | ✅ Yes | ❌ No | ❌ No |
| RSA | ✅ Yes | ❌ No | ❌ No |

**Note:** Documentation claims Blowfish and RSA support, but:
1. pyzipper does not support these algorithms
2. No implementation found in Zipminator code
3. `getattr(pyzipper, 'WZ_BLOWFISH')` would raise AttributeError

---

## 4. COMPRESSION METHODS

### 4.1 Default Compression

```python
compression=pyzipper.ZIP_DEFLATED
```

**DEFLATE Algorithm:**
- Industry standard compression (ZIP, gzip)
- Lossless compression
- Good balance of speed and compression ratio
- Widely supported

### 4.2 Alternative Compression Options

**Available in pyzipper (not exposed by Zipminator):**

```python
pyzipper.ZIP_STORED    # No compression (store only)
pyzipper.ZIP_DEFLATED  # DEFLATE algorithm (default)
pyzipper.ZIP_BZIP2     # BZIP2 compression
pyzipper.ZIP_LZMA      # LZMA compression
```

**Comparison:**

| Method | Speed | Ratio | CPU | Use Case |
|--------|-------|-------|-----|----------|
| ZIP_STORED | Fastest | 0% | Minimal | Already compressed data |
| ZIP_DEFLATED | Fast | Good | Low | General purpose (default) |
| ZIP_BZIP2 | Moderate | Better | Medium | Text files |
| ZIP_LZMA | Slow | Best | High | Maximum compression |

---

## 5. DECRYPTION PROCESS

### 5.1 Archive Extraction

**File:** `/zipminator/unzipit.py:18-21`

```python
password = getpass.getpass('Password: ')
with pyzipper.AESZipFile(f"{self.file_name}.zip") as zf:
    zf.setpassword(password.encode())
    zf.extract(self.file_name)
```

### 5.2 Decryption Flow

```
User Input Password
        ↓
    UTF-8 Encode
        ↓
Extract Salt from Archive
        ↓
    PBKDF2 Key Derivation
        ↓
Verify Password (2-byte check)
        ↓
    Decrypt Data (AES-CTR)
        ↓
Verify HMAC-SHA1 Authentication
        ↓
    Extract File
```

### 5.3 Security Considerations

**Authentication Before Decryption:**
1. Password verification value checked first
2. Prevents oracle attacks on encrypted data
3. HMAC verification ensures integrity
4. Detects tampering before extraction

**Potential Vulnerabilities:**
- No attempt limiting (brute force possible offline)
- No rate limiting on password attempts
- Extracted files remain unencrypted on disk
- No secure cleanup of temporary data

---

## 6. CRYPTOGRAPHIC LIBRARIES

### 6.1 Primary Dependency: pyzipper

**Package:** pyzipper v0.3.6
**Released:** July 2022
**Status:** Beta
**License:** MIT

**Source:**
```python
import pyzipper
```

**Capabilities:**
- AES-128, AES-192, AES-256 encryption
- WinZip AES format support
- Password-protected archives
- Compatible with standard ZIP tools

**Security Audit Status:**
- No formal security audit found
- Beta development status
- Limited recent updates (potential concerns)
- Forked from Python 3.7 zipfile module

### 6.2 Underlying Cryptography

**pyzipper relies on:**
1. **PyCryptodome** or **cryptography** library
2. Standard Python `zipfile` module
3. HMAC implementation from Python standard library

**Verification:**
```bash
pip show pyzipper
# Requires: PyCryptodome>=3.6.6
```

### 6.3 Alternative Libraries (Recommendations)

For enhanced security, consider:

| Library | Pros | Cons |
|---------|------|------|
| **cryptography** | Well-audited, actively maintained | More complex API |
| **PyCryptodome** | Drop-in for PyCrypto, comprehensive | Large dependency |
| **NaCl (libsodium)** | Modern, secure-by-default | No ZIP integration |
| **pyzipper** (current) | Simple ZIP integration | Beta status, limited updates |

---

## 7. ENCRYPTION USAGE EXAMPLES

### 7.1 Basic Encryption

```python
from zipminator.zipit import Zipndel
import pandas as pd

# Create sample DataFrame
df = pd.DataFrame({'data': [1, 2, 3]})

# Save to CSV
df.to_csv('sensitive_data.csv', index=False)

# Encrypt with password
z = Zipndel(
    file_name='sensitive_data.csv',
    file_format='csv',
    password='YourStrongPassword123!',
    encryption_algorithm='AES'  # AES-256 default
)

z.zipit(df)
# Result: sensitive_data.csv.zip (encrypted)
# Original: sensitive_data.csv (deleted)
```

### 7.2 Encryption with Interactive Password

```python
# Password prompted securely (no echo)
z = Zipndel(
    file_name='data.csv',
    file_format='csv'
    # password=None triggers getpass prompt
)

z.zipit(df)
# User prompted: "Enter password: " (input hidden)
```

### 7.3 Decryption

```python
from zipminator.unzipit import Unzipndel

# Extract encrypted archive
u = Unzipndel(
    file_name='sensitive_data.csv',
    file_format='csv'
)

df = u.unzipit()
# User prompted: "Password: " (input hidden)
# Returns decrypted DataFrame
```

### 7.4 Command-Line Usage

```python
# Encryption
python -c "
from zipminator.zipit import Zipndel
import pandas as pd

df = pd.DataFrame({'secret': ['classified']})
df.to_csv('data.csv', index=False)

z = Zipndel('data.csv', 'csv')
z.zipit(df)
"
# Enter password: ********

# Decryption
python -c "
from zipminator.unzipit import Unzipndel

u = Unzipndel('data.csv', 'csv')
df = u.unzipit()
print(df)
"
# Password: ********
```

---

## 8. ENCRYPTION VERIFICATION

### 8.1 Testing Archive Encryption

```python
import zipfile

# Verify encryption (will fail on AES archives without password)
try:
    with zipfile.ZipFile('data.csv.zip', 'r') as z:
        z.extractall()  # Should raise error
except RuntimeError as e:
    print("Encryption verified:", e)
    # Output: "Bad password for file..."
```

### 8.2 Compatibility Testing

```bash
# Test with standard tools
unzip data.csv.zip  # Prompts for password
7z x data.csv.zip   # 7-Zip supports WinZip AES
```

### 8.3 Encryption Strength Verification

```python
import os

# Check encrypted archive size
original_size = os.path.getsize('data.csv')
encrypted_size = os.path.getsize('data.csv.zip')

# Encrypted should be slightly larger (overhead)
overhead = encrypted_size - original_size
print(f"Encryption overhead: {overhead} bytes")
# Includes: salt, password verification, HMAC, ZIP headers
```

---

## 9. SECURITY BEST PRACTICES

### 9.1 Password Management

**DO:**
- ✅ Use passwords ≥12 characters
- ✅ Mix uppercase, lowercase, digits, symbols
- ✅ Use password managers
- ✅ Unique passwords per archive
- ✅ Store passwords separately from archives

**DON'T:**
- ❌ Hardcode passwords in source code
- ❌ Email passwords with archives
- ❌ Reuse passwords across archives
- ❌ Use dictionary words or personal info

### 9.2 File Handling

**Secure Workflow:**
```python
import os
import secrets

# 1. Create encrypted archive
z = Zipndel('sensitive.csv', 'csv', password='SecurePass123!')
z.zipit(df)

# 2. Verify archive created
assert os.path.exists('sensitive.csv.zip')

# 3. Securely delete original (improved)
def secure_delete(filepath, passes=3):
    """Overwrite file before deletion"""
    file_size = os.path.getsize(filepath)
    with open(filepath, 'r+b') as f:
        for _ in range(passes):
            f.seek(0)
            f.write(secrets.token_bytes(file_size))
    os.remove(filepath)

secure_delete('sensitive.csv')
```

### 9.3 Key Management

**For Automated Workflows:**
```python
import os
from cryptography.fernet import Fernet

# Store encrypted password in environment
# Generate master key once
master_key = Fernet.generate_key()
cipher = Fernet(master_key)

# Encrypt archive password
archive_password = 'YourArchivePassword123!'
encrypted_password = cipher.encrypt(archive_password.encode())

# Store encrypted password in environment or config
os.environ['ENCRYPTED_PASSWORD'] = encrypted_password.decode()

# Later, retrieve and decrypt
encrypted = os.environ['ENCRYPTED_PASSWORD'].encode()
decrypted_password = cipher.decrypt(encrypted).decode()

# Use with Zipminator
z = Zipndel('data.csv', 'csv', password=decrypted_password)
```

---

## 10. PERFORMANCE CONSIDERATIONS

### 10.1 Encryption Speed

**Factors:**
- File size (larger = longer)
- CPU capabilities (AES-NI acceleration)
- Compression ratio
- Disk I/O speed

**Typical Performance (AES-256):**
- Small files (<1 MB): <1 second
- Medium files (1-100 MB): 1-10 seconds
- Large files (100+ MB): 10+ seconds

### 10.2 CPU Optimization

**Modern CPUs with AES-NI:**
- Hardware-accelerated AES
- 4-8x faster than software implementation
- Automatically used by cryptography libraries

**Check AES-NI Support:**
```bash
# Linux
grep -o 'aes' /proc/cpuinfo

# macOS
sysctl -a | grep aes

# Windows
wmic cpu get caption, name, virtualizationfirmwareenabled
```

### 10.3 Memory Usage

**Memory Profile:**
- Small overhead for encryption context
- Buffered file I/O
- Peak usage ~2-3x file size (temporary buffers)

**Optimization:**
```python
# For very large files, consider streaming encryption
# (Not currently supported by pyzipper)
```

---

## 11. LIMITATIONS AND CAVEATS

### 11.1 Current Limitations

1. **No Streaming Encryption**
   - Entire file loaded into memory
   - Not suitable for very large files (>1 GB)

2. **Limited Algorithm Choice**
   - Only AES supported (despite docs claiming Blowfish/RSA)
   - No ChaCha20-Poly1305 option

3. **No Public Key Encryption**
   - Only symmetric (password-based) encryption
   - Cannot encrypt to recipient's public key

4. **No Key Rotation**
   - Cannot re-encrypt with new password without full decompression

5. **Beta Library Status**
   - pyzipper is beta software
   - Limited security audits

### 11.2 Not Suitable For

- ❌ Classified government information (use FIPS 140-2 certified tools)
- ❌ Long-term archival (quantum computers may break in 20+ years)
- ❌ Extremely large files (>5 GB)
- ❌ High-throughput encryption (use hardware acceleration)
- ❌ Multi-recipient encryption (use PGP/GPG instead)

### 11.3 Recommended Use Cases

- ✅ Personal file encryption
- ✅ Temporary data protection
- ✅ Email attachments
- ✅ Development/testing
- ✅ Non-critical business data
- ✅ Pandas DataFrame serialization

---

## 12. FUTURE ENHANCEMENTS

### 12.1 Suggested Improvements

1. **Post-Quantum Cryptography**
   ```python
   # Hybrid encryption (classical + post-quantum)
   from oqs import KeyEncapsulation

   kem = KeyEncapsulation("Kyber768")
   public_key = kem.generate_keypair()
   ```

2. **Multi-Recipient Encryption**
   ```python
   # Encrypt to multiple public keys
   z = Zipndel('data.csv', recipients=[key1, key2, key3])
   ```

3. **Hardware Security Module (HSM) Integration**
   ```python
   # Store keys in hardware
   z = Zipndel('data.csv', key_storage='hsm')
   ```

4. **Streaming Encryption**
   ```python
   # Handle files larger than memory
   z.zipit_stream(df, chunk_size=1024*1024)
   ```

---

## 13. CONCLUSION

### 13.1 Encryption Strengths

✅ **Robust AES-256 encryption** meeting industry standards
✅ **WinZip AES compatibility** for broad tool support
✅ **Secure password input** preventing shoulder surfing
✅ **Simple API** for easy integration
✅ **PBKDF2 key derivation** following best practices

### 13.2 Areas for Improvement

⚠️ **Password strength validation** needed
⚠️ **Secure memory clearing** for password data
⚠️ **Integrity verification** (HMAC already present in WinZip AES)
⚠️ **Better documentation** (remove incorrect algorithm claims)
⚠️ **Security audits** for pyzipper dependency

### 13.3 Overall Assessment

**Encryption Rating:** ⭐⭐⭐⭐ (4/5)

Zipminator implements **strong, industry-standard AES-256 encryption** that is suitable for most general-purpose file protection needs. The encryption implementation itself is solid, though surrounding features (password validation, secure deletion, etc.) need enhancement for production use with sensitive data.

**Recommended for:** Personal use, development, non-critical business data
**Use with caution for:** Regulated industries, classified data, long-term archival

---

**Analysis Completed:** 2025-10-30
**Technical Specification Version:** 1.0
**Next Review Date:** 2026-10-30
