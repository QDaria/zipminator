//! Email transport module for PQC-encrypted email sending and receiving.
//!
//! Provides SMTP sending and self-destruct timers for encrypted emails.
//! The `smtp` feature enables actual SMTP transport via the `lettre` crate;
//! without it, only message construction and self-destruct logic are available.

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use std::fmt;
use std::io::Write;

use crate::email_crypto::EmailEnvelope;

// ── Error types ──────────────────────────────────────────────────────────────

/// Errors from email transport operations.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TransportError {
    /// Invalid configuration (missing or bad field).
    InvalidConfig(&'static str),
    /// SMTP send failure.
    SmtpError(String),
    /// Message construction failure.
    MessageBuild(&'static str),
    /// Self-destruct wipe failure.
    WipeError(String),
}

impl fmt::Display for TransportError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidConfig(m) => write!(f, "InvalidConfig: {m}"),
            Self::SmtpError(m) => write!(f, "SmtpError: {m}"),
            Self::MessageBuild(m) => write!(f, "MessageBuild: {m}"),
            Self::WipeError(m) => write!(f, "WipeError: {m}"),
        }
    }
}

impl std::error::Error for TransportError {}

// ── Configuration ────────────────────────────────────────────────────────────

/// SMTP server configuration.
#[derive(Debug, Clone)]
pub struct SmtpConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub use_tls: bool,
    pub from_address: String,
}

impl SmtpConfig {
    /// Validate that all required fields are populated.
    pub fn validate(&self) -> Result<(), TransportError> {
        if self.host.is_empty() {
            return Err(TransportError::InvalidConfig("host must not be empty"));
        }
        if self.port == 0 {
            return Err(TransportError::InvalidConfig("port must be > 0"));
        }
        if self.from_address.is_empty() || !self.from_address.contains('@') {
            return Err(TransportError::InvalidConfig(
                "from_address must be a valid email",
            ));
        }
        Ok(())
    }
}

/// IMAP server configuration.
#[derive(Debug, Clone)]
pub struct ImapConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub use_tls: bool,
    pub mailbox: String,
}

// ── PQC email message builder ────────────────────────────────────────────────

/// A fully-constructed RFC 5322 email with PQC headers and encrypted body.
#[derive(Debug, Clone)]
pub struct PqcEmailMessage {
    /// Raw RFC 5322 message bytes, ready for SMTP submission.
    pub raw: Vec<u8>,
}

/// Builds RFC 5322 compliant emails with PQC envelope encryption.
pub struct PqcSmtpClient;

impl PqcSmtpClient {
    /// Construct an RFC 5322 email message carrying an encrypted envelope.
    ///
    /// The encrypted body is base64-encoded and placed in the message body.
    /// PQC discovery headers are injected for recipient key exchange.
    pub fn build_message(
        from: &str,
        to: &str,
        subject: &str,
        envelope: &EmailEnvelope,
        sender_pk: &[u8],
    ) -> Result<PqcEmailMessage, TransportError> {
        if from.is_empty() || !from.contains('@') {
            return Err(TransportError::MessageBuild("invalid from address"));
        }
        if to.is_empty() || !to.contains('@') {
            return Err(TransportError::MessageBuild("invalid to address"));
        }

        let envelope_b64 = B64.encode(envelope.to_bytes());
        let sender_pk_b64 = B64.encode(sender_pk);

        let mut raw = Vec::with_capacity(1024 + envelope_b64.len());
        writeln!(raw, "From: <{from}>").unwrap();
        writeln!(raw, "To: <{to}>").unwrap();
        writeln!(raw, "Subject: {subject}").unwrap();
        writeln!(raw, "MIME-Version: 1.0").unwrap();
        writeln!(
            raw,
            "Content-Type: application/x-pqc-envelope; charset=utf-8"
        )
        .unwrap();
        writeln!(raw, "Content-Transfer-Encoding: base64").unwrap();
        writeln!(raw, "X-PQC-Version: ML-KEM-768").unwrap();
        writeln!(raw, "X-PQC-Sender-Key: {sender_pk_b64}").unwrap();
        writeln!(raw).unwrap(); // blank line separates headers from body
        // Write base64 in 76-char folded lines per RFC 2045
        for chunk in envelope_b64.as_bytes().chunks(76) {
            raw.extend_from_slice(chunk);
            raw.push(b'\n');
        }

        Ok(PqcEmailMessage { raw })
    }

    /// Send a pre-built message via SMTP. Requires the `smtp` feature.
    #[cfg(feature = "smtp")]
    pub fn send(
        config: &SmtpConfig,
        message: &PqcEmailMessage,
    ) -> Result<(), TransportError> {
        use lettre::transport::smtp::authentication::Credentials;
        use lettre::{SmtpTransport, Transport};

        config.validate()?;

        let creds = Credentials::new(config.username.clone(), config.password.clone());

        let transport = if config.use_tls {
            SmtpTransport::relay(&config.host)
        } else {
            SmtpTransport::builder_dangerous(&config.host).port(config.port).build()
                .map(|_| ()) // dummy to align types
                .and_then(|_| SmtpTransport::relay(&config.host))
        }
        .map_err(|e| TransportError::SmtpError(e.to_string()))?
        .credentials(creds)
        .port(config.port)
        .build();

        let email = lettre::message::Message::builder()
            .from(config.from_address.parse().map_err(|_| {
                TransportError::SmtpError("invalid from address".into())
            })?)
            .body(message.raw.clone())
            .map_err(|e| TransportError::SmtpError(e.to_string()))?;

        transport
            .send(&email)
            .map_err(|e| TransportError::SmtpError(e.to_string()))?;

        Ok(())
    }
}

// ── Self-destruct timer ──────────────────────────────────────────────────────

/// Wipe method for self-destructing messages.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WipeMethod {
    /// Simple file deletion.
    Delete,
    /// DoD 5220.22-M 3-pass overwrite (zeros, ones, random).
    Overwrite3Pass,
    /// Single-pass random overwrite then delete.
    OverwriteRandom,
}

/// Timer-based self-destruct for a stored encrypted message.
#[derive(Debug, Clone)]
pub struct SelfDestructTimer {
    /// Identifier for the message to destroy.
    pub message_id: String,
    /// Unix timestamp (seconds) when the message expires.
    pub expire_at: u64,
    /// How to wipe the message data.
    pub wipe_method: WipeMethod,
}

impl SelfDestructTimer {
    /// Create a new self-destruct timer.
    pub fn new(message_id: String, expire_at: u64, wipe_method: WipeMethod) -> Self {
        Self {
            message_id,
            expire_at,
            wipe_method,
        }
    }

    /// Check whether the timer has expired relative to `now` (unix seconds).
    pub fn is_expired(&self, now: u64) -> bool {
        now >= self.expire_at
    }

    /// Execute the wipe on a given file path.
    ///
    /// Returns `Ok(())` if the wipe completed or the file did not exist.
    pub fn execute_wipe(&self, path: &std::path::Path) -> Result<(), TransportError> {
        if !path.exists() {
            return Ok(());
        }

        match self.wipe_method {
            WipeMethod::Delete => {
                std::fs::remove_file(path)
                    .map_err(|e| TransportError::WipeError(e.to_string()))?;
            }
            WipeMethod::Overwrite3Pass => {
                let len = std::fs::metadata(path)
                    .map_err(|e| TransportError::WipeError(e.to_string()))?
                    .len() as usize;

                // Pass 1: zeros
                Self::overwrite_file(path, len, 0x00)?;
                // Pass 2: ones
                Self::overwrite_file(path, len, 0xFF)?;
                // Pass 3: random
                let mut random_buf = vec![0u8; len];
                getrandom::getrandom(&mut random_buf)
                    .map_err(|e| TransportError::WipeError(e.to_string()))?;
                std::fs::write(path, &random_buf)
                    .map_err(|e| TransportError::WipeError(e.to_string()))?;

                std::fs::remove_file(path)
                    .map_err(|e| TransportError::WipeError(e.to_string()))?;
            }
            WipeMethod::OverwriteRandom => {
                let len = std::fs::metadata(path)
                    .map_err(|e| TransportError::WipeError(e.to_string()))?
                    .len() as usize;

                let mut random_buf = vec![0u8; len];
                getrandom::getrandom(&mut random_buf)
                    .map_err(|e| TransportError::WipeError(e.to_string()))?;
                std::fs::write(path, &random_buf)
                    .map_err(|e| TransportError::WipeError(e.to_string()))?;

                std::fs::remove_file(path)
                    .map_err(|e| TransportError::WipeError(e.to_string()))?;
            }
        }

        Ok(())
    }

    fn overwrite_file(
        path: &std::path::Path,
        len: usize,
        byte: u8,
    ) -> Result<(), TransportError> {
        let buf = vec![byte; len];
        std::fs::write(path, &buf)
            .map_err(|e| TransportError::WipeError(e.to_string()))
    }
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::email_crypto::EmailCrypto;
    use pqcrypto_kyber::kyber768;
    use pqcrypto_traits::kem::PublicKey as KemPublicKey;

    #[test]
    fn test_smtp_config_validation() {
        let valid = SmtpConfig {
            host: "smtp.example.com".into(),
            port: 587,
            username: "user".into(),
            password: "pass".into(),
            use_tls: true,
            from_address: "alice@example.com".into(),
        };
        assert!(valid.validate().is_ok());

        let no_host = SmtpConfig {
            host: "".into(),
            ..valid.clone()
        };
        assert!(matches!(
            no_host.validate(),
            Err(TransportError::InvalidConfig(_))
        ));

        let bad_port = SmtpConfig {
            port: 0,
            ..valid.clone()
        };
        assert!(matches!(
            bad_port.validate(),
            Err(TransportError::InvalidConfig(_))
        ));

        let bad_email = SmtpConfig {
            from_address: "not-an-email".into(),
            ..valid
        };
        assert!(matches!(
            bad_email.validate(),
            Err(TransportError::InvalidConfig(_))
        ));
    }

    #[test]
    fn test_rfc5322_message_building() {
        let (pk, _sk) = kyber768::keypair();
        let pk_bytes = pk.as_bytes();

        let envelope =
            EmailCrypto::encrypt(pk_bytes, b"Hello PQC world", b"test-headers")
                .expect("encrypt");

        let msg = PqcSmtpClient::build_message(
            "alice@qdaria.com",
            "bob@qdaria.com",
            "Test Subject",
            &envelope,
            pk_bytes,
        )
        .expect("build");

        let raw_str = String::from_utf8_lossy(&msg.raw);
        assert!(raw_str.contains("From: <alice@qdaria.com>"));
        assert!(raw_str.contains("To: <bob@qdaria.com>"));
        assert!(raw_str.contains("Subject: Test Subject"));
        assert!(raw_str.contains("MIME-Version: 1.0"));
        assert!(raw_str.contains("Content-Transfer-Encoding: base64"));
    }

    #[test]
    fn test_pqc_headers_injected() {
        let (pk, _sk) = kyber768::keypair();
        let pk_bytes = pk.as_bytes();

        let envelope =
            EmailCrypto::encrypt(pk_bytes, b"secret", b"aad").expect("encrypt");

        let msg = PqcSmtpClient::build_message(
            "a@b.com",
            "c@d.com",
            "PQC",
            &envelope,
            pk_bytes,
        )
        .expect("build");

        let raw_str = String::from_utf8_lossy(&msg.raw);
        assert!(raw_str.contains("X-PQC-Version: ML-KEM-768"));
        assert!(raw_str.contains("X-PQC-Sender-Key: "));

        // Verify the sender key is valid base64 that decodes to correct length
        let key_line = raw_str
            .lines()
            .find(|l| l.starts_with("X-PQC-Sender-Key: "))
            .unwrap();
        let key_b64 = key_line.strip_prefix("X-PQC-Sender-Key: ").unwrap();
        let decoded = B64.decode(key_b64).expect("valid base64");
        assert_eq!(decoded.len(), pk_bytes.len());
    }

    #[test]
    fn test_self_destruct_timer_expiry() {
        let timer = SelfDestructTimer::new(
            "msg-001".into(),
            1_000_000,
            WipeMethod::Delete,
        );

        assert!(!timer.is_expired(999_999));
        assert!(timer.is_expired(1_000_000));
        assert!(timer.is_expired(1_000_001));
    }

    #[test]
    fn test_self_destruct_wipe_on_temp_file() {
        let dir = std::env::temp_dir().join("zipminator_test_wipe");
        std::fs::create_dir_all(&dir).ok();

        // Test Delete
        let delete_path = dir.join("delete_me.bin");
        std::fs::write(&delete_path, b"sensitive data").unwrap();
        let timer = SelfDestructTimer::new("d1".into(), 0, WipeMethod::Delete);
        timer.execute_wipe(&delete_path).expect("delete wipe");
        assert!(!delete_path.exists());

        // Test Overwrite3Pass (DoD)
        let dod_path = dir.join("dod_wipe.bin");
        std::fs::write(&dod_path, b"top secret payload here!").unwrap();
        let timer = SelfDestructTimer::new("d2".into(), 0, WipeMethod::Overwrite3Pass);
        timer.execute_wipe(&dod_path).expect("3pass wipe");
        assert!(!dod_path.exists());

        // Test OverwriteRandom
        let rand_path = dir.join("rand_wipe.bin");
        std::fs::write(&rand_path, b"classified").unwrap();
        let timer =
            SelfDestructTimer::new("d3".into(), 0, WipeMethod::OverwriteRandom);
        timer.execute_wipe(&rand_path).expect("random wipe");
        assert!(!rand_path.exists());

        // Test wipe on non-existent file (should be Ok)
        let missing = dir.join("does_not_exist.bin");
        let timer = SelfDestructTimer::new("d4".into(), 0, WipeMethod::Delete);
        assert!(timer.execute_wipe(&missing).is_ok());

        std::fs::remove_dir_all(&dir).ok();
    }
}
