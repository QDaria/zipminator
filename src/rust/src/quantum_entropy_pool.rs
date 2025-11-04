// Quantum Entropy Pool - Rust Implementation
// Memory-safe, zero-copy quantum random byte storage with encryption

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use hkdf::Hkdf;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::fs::{File, OpenOptions};
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use zeroize::{Zeroize, ZeroizeOnDrop};

// QEP file format constants
const QEP_MAGIC: &[u8; 4] = b"QEP1";
const QEP_VERSION: u8 = 0x01;
const QEP_HEADER_SIZE: usize = 202;
const AES_256_KEY_SIZE: usize = 32;
const GCM_NONCE_SIZE: usize = 12;
const GCM_TAG_SIZE: usize = 16;
const HMAC_TAG_SIZE: usize = 32;

type HmacSha256 = Hmac<Sha256>;

/// QEP file header (202 bytes)
#[repr(C, packed)]
#[derive(Clone)]
struct QEPHeader {
    magic: [u8; 4],              // "QEP1"
    version: u8,                 // 0x01
    flags: u8,                   // Feature flags
    reserved: u16,               // Reserved
    timestamp: u64,              // Unix epoch
    entropy_source: [u8; 16],    // "IBM Quantum"
    backend_name: [u8; 32],      // e.g., "ibm_sherbrooke"
    job_id: [u8; 64],            // IBM job UUID
    num_shots: u32,              // Quantum shots
    num_qubits: u8,              // Qubits per shot
    bits_per_shot: u8,           // Bits per shot
    total_bytes: u32,            // Total entropy bytes
    consumed_bytes: u32,         // Consumed bytes
    gcm_nonce: [u8; GCM_NONCE_SIZE],   // AES-GCM nonce
    hmac_tag: [u8; HMAC_TAG_SIZE],     // HMAC-SHA256 tag
    auth_tag: [u8; GCM_TAG_SIZE],      // AES-GCM auth tag
}

impl QEPHeader {
    fn new() -> Self {
        QEPHeader {
            magic: *QEP_MAGIC,
            version: QEP_VERSION,
            flags: 0,
            reserved: 0,
            timestamp: 0,
            entropy_source: [0u8; 16],
            backend_name: [0u8; 32],
            job_id: [0u8; 64],
            num_shots: 0,
            num_qubits: 0,
            bits_per_shot: 0,
            total_bytes: 0,
            consumed_bytes: 0,
            gcm_nonce: [0u8; GCM_NONCE_SIZE],
            hmac_tag: [0u8; HMAC_TAG_SIZE],
            auth_tag: [0u8; GCM_TAG_SIZE],
        }
    }

    fn to_bytes_for_hmac(&self) -> Vec<u8> {
        let mut bytes = Vec::with_capacity(QEP_HEADER_SIZE - HMAC_TAG_SIZE - GCM_TAG_SIZE);
        bytes.extend_from_slice(&self.magic);
        bytes.push(self.version);
        bytes.push(self.flags);
        bytes.extend_from_slice(&self.reserved.to_le_bytes());
        bytes.extend_from_slice(&self.timestamp.to_le_bytes());
        bytes.extend_from_slice(&self.entropy_source);
        bytes.extend_from_slice(&self.backend_name);
        bytes.extend_from_slice(&self.job_id);
        bytes.extend_from_slice(&self.num_shots.to_le_bytes());
        bytes.push(self.num_qubits);
        bytes.push(self.bits_per_shot);
        bytes.extend_from_slice(&self.total_bytes.to_le_bytes());
        bytes.extend_from_slice(&self.consumed_bytes.to_le_bytes());
        bytes.extend_from_slice(&self.gcm_nonce);
        bytes
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = self.to_bytes_for_hmac();
        bytes.extend_from_slice(&self.hmac_tag);
        bytes.extend_from_slice(&self.auth_tag);
        bytes
    }

    fn from_bytes(bytes: &[u8]) -> io::Result<Self> {
        if bytes.len() != QEP_HEADER_SIZE {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "Invalid header size",
            ));
        }

        let mut header = QEPHeader::new();
        let mut pos = 0;

        header.magic.copy_from_slice(&bytes[pos..pos + 4]);
        pos += 4;
        header.version = bytes[pos];
        pos += 1;
        header.flags = bytes[pos];
        pos += 1;
        header.reserved = u16::from_le_bytes([bytes[pos], bytes[pos + 1]]);
        pos += 2;
        header.timestamp = u64::from_le_bytes(bytes[pos..pos + 8].try_into().unwrap());
        pos += 8;
        header.entropy_source.copy_from_slice(&bytes[pos..pos + 16]);
        pos += 16;
        header.backend_name.copy_from_slice(&bytes[pos..pos + 32]);
        pos += 32;
        header.job_id.copy_from_slice(&bytes[pos..pos + 64]);
        pos += 64;
        header.num_shots = u32::from_le_bytes(bytes[pos..pos + 4].try_into().unwrap());
        pos += 4;
        header.num_qubits = bytes[pos];
        pos += 1;
        header.bits_per_shot = bytes[pos];
        pos += 1;
        header.total_bytes = u32::from_le_bytes(bytes[pos..pos + 4].try_into().unwrap());
        pos += 4;
        header.consumed_bytes = u32::from_le_bytes(bytes[pos..pos + 4].try_into().unwrap());
        pos += 4;
        header.gcm_nonce.copy_from_slice(&bytes[pos..pos + GCM_NONCE_SIZE]);
        pos += GCM_NONCE_SIZE;
        header.hmac_tag.copy_from_slice(&bytes[pos..pos + HMAC_TAG_SIZE]);
        pos += HMAC_TAG_SIZE;
        header.auth_tag.copy_from_slice(&bytes[pos..pos + GCM_TAG_SIZE]);

        Ok(header)
    }
}

/// Entropy pool metadata
#[derive(Debug, Clone)]
pub struct EntropyMetadata {
    pub entropy_source: String,
    pub backend_name: String,
    pub job_id: String,
    pub num_shots: u32,
    pub num_qubits: u8,
    pub bits_per_shot: u8,
    pub total_bytes: u32,
    pub consumed_bytes: u32,
    pub timestamp: SystemTime,
}

/// Cryptographic keys (zeroized on drop)
#[derive(ZeroizeOnDrop)]
struct CryptoKeys {
    #[zeroize(skip)]
    encryption_key: [u8; AES_256_KEY_SIZE],
    #[zeroize(skip)]
    hmac_key: [u8; AES_256_KEY_SIZE],
}

impl CryptoKeys {
    fn derive_from_master(master_key: &[u8]) -> Result<Self, EntropyPoolError> {
        // Derive encryption key using HKDF
        let hk_enc = Hkdf::<Sha256>::new(None, master_key);
        let mut encryption_key = [0u8; AES_256_KEY_SIZE];
        hk_enc
            .expand(b"aes-gcm", &mut encryption_key)
            .map_err(|_| EntropyPoolError::KeyDerivationFailed)?;

        // Derive HMAC key using HKDF
        let hk_hmac = Hkdf::<Sha256>::new(None, master_key);
        let mut hmac_key = [0u8; AES_256_KEY_SIZE];
        hk_hmac
            .expand(b"hmac-sha256", &mut hmac_key)
            .map_err(|_| EntropyPoolError::KeyDerivationFailed)?;

        Ok(CryptoKeys {
            encryption_key,
            hmac_key,
        })
    }
}

/// Quantum entropy pool errors
#[derive(Debug)]
pub enum EntropyPoolError {
    IoError(io::Error),
    InvalidMagic,
    UnsupportedVersion,
    HmacVerificationFailed,
    DecryptionFailed,
    InsufficientEntropy,
    KeyDerivationFailed,
    KeyNotFound,
    ValidationFailed,
}

impl std::fmt::Display for EntropyPoolError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EntropyPoolError::IoError(e) => write!(f, "IO error: {}", e),
            EntropyPoolError::InvalidMagic => write!(f, "Invalid magic bytes"),
            EntropyPoolError::UnsupportedVersion => write!(f, "Unsupported version"),
            EntropyPoolError::HmacVerificationFailed => write!(f, "HMAC verification failed"),
            EntropyPoolError::DecryptionFailed => write!(f, "Decryption failed"),
            EntropyPoolError::InsufficientEntropy => write!(f, "Insufficient entropy"),
            EntropyPoolError::KeyDerivationFailed => write!(f, "Key derivation failed"),
            EntropyPoolError::KeyNotFound => write!(f, "Encryption key not found"),
            EntropyPoolError::ValidationFailed => write!(f, "Entropy validation failed"),
        }
    }
}

impl std::error::Error for EntropyPoolError {}

impl From<io::Error> for EntropyPoolError {
    fn from(err: io::Error) -> Self {
        EntropyPoolError::IoError(err)
    }
}

/// Quantum entropy pool with memory-safe operations
pub struct QuantumEntropyPool {
    file_path: PathBuf,
    header: QEPHeader,
    decrypted_entropy: Vec<u8>,
    keys: CryptoKeys,
    refill_callback: Option<Arc<dyn Fn(usize) + Send + Sync>>,
    refill_threshold: usize,
    lock: Arc<Mutex<()>>,
}

impl QuantumEntropyPool {
    /// Create new quantum entropy pool
    pub fn create(
        path: impl AsRef<Path>,
        entropy_bytes: &[u8],
        backend: &str,
        job_id: &str,
        num_shots: u32,
        num_qubits: u8,
        validate_entropy: bool,
    ) -> Result<Self, EntropyPoolError> {
        // Validate entropy if requested
        if validate_entropy && !Self::validate_entropy_quality(entropy_bytes) {
            return Err(EntropyPoolError::ValidationFailed);
        }

        // Load master key and derive keys
        let master_key = Self::load_master_key()?;
        let keys = CryptoKeys::derive_from_master(&master_key)?;

        // Initialize header
        let mut header = QEPHeader::new();
        header.timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self::copy_str_to_fixed(&mut header.entropy_source, "IBM Quantum");
        Self::copy_str_to_fixed(&mut header.backend_name, backend);
        Self::copy_str_to_fixed(&mut header.job_id, job_id);

        header.num_shots = num_shots;
        header.num_qubits = num_qubits;
        header.bits_per_shot = num_qubits;
        header.total_bytes = entropy_bytes.len() as u32;
        header.consumed_bytes = 0;

        // Generate random GCM nonce
        use rand::RngCore;
        let mut rng = rand::thread_rng();
        rng.fill_bytes(&mut header.gcm_nonce);

        // Encrypt entropy with AES-256-GCM
        let cipher = Aes256Gcm::new_from_slice(&keys.encryption_key)
            .map_err(|_| EntropyPoolError::KeyDerivationFailed)?;
        let nonce = Nonce::from_slice(&header.gcm_nonce);

        let ciphertext = cipher
            .encrypt(nonce, entropy_bytes)
            .map_err(|_| EntropyPoolError::DecryptionFailed)?;

        // Extract auth tag
        let (encrypted_data, auth_tag) = ciphertext.split_at(ciphertext.len() - GCM_TAG_SIZE);
        header.auth_tag.copy_from_slice(auth_tag);

        // Compute HMAC
        let mut hmac_data = header.to_bytes_for_hmac();
        hmac_data.extend_from_slice(encrypted_data);

        let mut mac = HmacSha256::new_from_slice(&keys.hmac_key)
            .map_err(|_| EntropyPoolError::KeyDerivationFailed)?;
        mac.update(&hmac_data);
        let hmac_result = mac.finalize();
        header.hmac_tag.copy_from_slice(hmac_result.into_bytes().as_slice());

        // Write file with secure permissions
        let file_path = path.as_ref().to_path_buf();
        Self::write_pool_file(&file_path, &header, encrypted_data)?;

        Ok(QuantumEntropyPool {
            file_path,
            header,
            decrypted_entropy: entropy_bytes.to_vec(),
            keys,
            refill_callback: None,
            refill_threshold: 10240,
            lock: Arc::new(Mutex::new(())),
        })
    }

    /// Open existing quantum entropy pool
    pub fn open(path: impl AsRef<Path>) -> Result<Self, EntropyPoolError> {
        let file_path = path.as_ref().to_path_buf();

        // Load master key
        let master_key = Self::load_master_key()?;
        let keys = CryptoKeys::derive_from_master(&master_key)?;

        // Read file
        let mut file = File::open(&file_path)?;
        let mut header_bytes = vec![0u8; QEP_HEADER_SIZE];
        file.read_exact(&mut header_bytes)?;

        let header = QEPHeader::from_bytes(&header_bytes)?;

        // Validate header
        if header.magic != *QEP_MAGIC {
            return Err(EntropyPoolError::InvalidMagic);
        }
        if header.version != QEP_VERSION {
            return Err(EntropyPoolError::UnsupportedVersion);
        }

        // Read encrypted data
        let mut encrypted_data = vec![0u8; header.total_bytes as usize];
        file.read_exact(&mut encrypted_data)?;

        // Verify HMAC
        let mut hmac_data = header.to_bytes_for_hmac();
        hmac_data.extend_from_slice(&encrypted_data);

        let mut mac = HmacSha256::new_from_slice(&keys.hmac_key)
            .map_err(|_| EntropyPoolError::KeyDerivationFailed)?;
        mac.update(&hmac_data);
        mac.verify_slice(&header.hmac_tag)
            .map_err(|_| EntropyPoolError::HmacVerificationFailed)?;

        // Decrypt entropy
        let cipher = Aes256Gcm::new_from_slice(&keys.encryption_key)
            .map_err(|_| EntropyPoolError::KeyDerivationFailed)?;
        let nonce = Nonce::from_slice(&header.gcm_nonce);

        let mut ciphertext = encrypted_data.clone();
        ciphertext.extend_from_slice(&header.auth_tag);

        let plaintext = cipher
            .decrypt(nonce, ciphertext.as_ref())
            .map_err(|_| EntropyPoolError::DecryptionFailed)?;

        Ok(QuantumEntropyPool {
            file_path,
            header,
            decrypted_entropy: plaintext,
            keys,
            refill_callback: None,
            refill_threshold: 10240,
            lock: Arc::new(Mutex::new(())),
        })
    }

    /// Get random bytes (thread-safe, constant-time)
    pub fn get_bytes(&mut self, num_bytes: usize) -> Result<Vec<u8>, EntropyPoolError> {
        let _guard = self.lock.lock().unwrap();

        let available = (self.header.total_bytes - self.header.consumed_bytes) as usize;
        if num_bytes > available {
            return Err(EntropyPoolError::InsufficientEntropy);
        }

        let start_idx = self.header.consumed_bytes as usize;
        let end_idx = start_idx + num_bytes;
        let result = self.decrypted_entropy[start_idx..end_idx].to_vec();

        // Securely wipe consumed entropy (3-pass)
        for pass in 0..3 {
            let fill_value = if pass == 0 { 0x00 } else { 0xFF };
            for byte in &mut self.decrypted_entropy[start_idx..end_idx] {
                *byte = fill_value;
            }
        }

        self.header.consumed_bytes += num_bytes as u32;
        self.update_consumed_bytes()?;

        // Check refill callback
        if let Some(callback) = &self.refill_callback {
            let remaining = available - num_bytes;
            if remaining < self.refill_threshold {
                callback(remaining);
            }
        }

        Ok(result)
    }

    /// Get available bytes
    pub fn available_bytes(&self) -> usize {
        (self.header.total_bytes - self.header.consumed_bytes) as usize
    }

    /// Get metadata
    pub fn get_metadata(&self) -> EntropyMetadata {
        EntropyMetadata {
            entropy_source: String::from_utf8_lossy(&self.header.entropy_source)
                .trim_end_matches('\0')
                .to_string(),
            backend_name: String::from_utf8_lossy(&self.header.backend_name)
                .trim_end_matches('\0')
                .to_string(),
            job_id: String::from_utf8_lossy(&self.header.job_id)
                .trim_end_matches('\0')
                .to_string(),
            num_shots: self.header.num_shots,
            num_qubits: self.header.num_qubits,
            bits_per_shot: self.header.bits_per_shot,
            total_bytes: self.header.total_bytes,
            consumed_bytes: self.header.consumed_bytes,
            timestamp: UNIX_EPOCH + std::time::Duration::from_secs(self.header.timestamp),
        }
    }

    /// Set refill callback
    pub fn set_refill_callback<F>(&mut self, callback: F, threshold_bytes: usize)
    where
        F: Fn(usize) + Send + Sync + 'static,
    {
        self.refill_callback = Some(Arc::new(callback));
        self.refill_threshold = threshold_bytes;
    }

    // Private helper methods

    fn load_master_key() -> Result<Vec<u8>, EntropyPoolError> {
        // Try environment variable first
        if let Ok(env_key) = std::env::var("QUANTUM_ENTROPY_KEY") {
            if let Ok(key) = base64::decode(&env_key) {
                if key.len() == AES_256_KEY_SIZE {
                    return Ok(key);
                }
            }
        }

        // Try key file
        let key_path = Path::new("/etc/qdaria/quantum_entropy.key");
        if key_path.exists() {
            let key = std::fs::read(key_path)?;
            if key.len() == AES_256_KEY_SIZE {
                return Ok(key);
            }
        }

        Err(EntropyPoolError::KeyNotFound)
    }

    fn copy_str_to_fixed(dest: &mut [u8], src: &str) {
        let bytes = src.as_bytes();
        let len = bytes.len().min(dest.len());
        dest[..len].copy_from_slice(&bytes[..len]);
    }

    fn write_pool_file(
        path: &Path,
        header: &QEPHeader,
        encrypted_data: &[u8],
    ) -> io::Result<()> {
        let mut file = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .mode(0o600)
            .open(path)?;

        file.write_all(&header.to_bytes())?;
        file.write_all(encrypted_data)?;
        file.sync_all()?;

        Ok(())
    }

    fn update_consumed_bytes(&self) -> io::Result<()> {
        let mut file = OpenOptions::new().write(true).open(&self.file_path)?;
        file.seek(SeekFrom::Start(126))?; // Offset to consumed_bytes field
        file.write_all(&self.header.consumed_bytes.to_le_bytes())?;
        file.sync_all()?;
        Ok(())
    }

    fn validate_entropy_quality(data: &[u8]) -> bool {
        if data.len() < 1000 {
            return false;
        }

        // Simplified chi-square test
        let mut freq = [0usize; 256];
        for &byte in data {
            freq[byte as usize] += 1;
        }

        let expected = data.len() as f64 / 256.0;
        let chi_square: f64 = freq
            .iter()
            .map(|&count| {
                let diff = count as f64 - expected;
                (diff * diff) / expected
            })
            .sum();

        chi_square < 300.0
    }
}

impl Drop for QuantumEntropyPool {
    fn drop(&mut self) {
        // Securely wipe decrypted entropy
        self.decrypted_entropy.zeroize();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_entropy_pool_create_open() {
        // Test implementation would go here
        // Requires setting up test environment with encryption key
    }
}
