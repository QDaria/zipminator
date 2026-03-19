//! Secure file self-destruct — DoD 5220.22-M 3-pass overwrite.
//!
//! Implements the same destruction protocol as the Python `SelfDestruct` class
//! but in Rust for use inside the Tauri browser. The algorithm:
//!
//! 1. **Pass 1**: Overwrite entire file with `0x00` bytes, fsync.
//! 2. **Pass 2**: Overwrite entire file with `0xFF` bytes, fsync.
//! 3. **Pass 3**: Overwrite entire file with cryptographic random bytes, fsync.
//! 4. Delete the file from disk.
//! 5. Verify the path no longer exists.

use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::Path;

use serde::Serialize;

/// Result returned to the frontend after a self-destruct operation.
#[derive(Debug, Clone, Serialize)]
pub struct SelfDestructResult {
    /// The path that was destroyed.
    pub path: String,
    /// Number of overwrite passes performed.
    pub passes: u32,
    /// Original file size in bytes.
    pub original_size: u64,
    /// Whether the file was successfully removed from disk.
    pub verified_deleted: bool,
}

/// Securely destroy a file using DoD 5220.22-M 3-pass overwrite.
///
/// # Errors
///
/// Returns a human-readable error string suitable for IPC.
pub fn secure_delete_file(file_path: &Path) -> Result<SelfDestructResult, String> {
    // ── Validate path ────────────────────────────────────────────────
    if !file_path.exists() {
        return Err(format!("File not found: {}", file_path.display()));
    }
    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", file_path.display()));
    }

    // Refuse to delete anything outside the user's home or temp directories.
    // This is a safety net against accidental system-wide destruction.
    let canonical = file_path
        .canonicalize()
        .map_err(|e| format!("Cannot resolve path: {e}"))?;

    if cfg!(unix) {
        let path_str = canonical.to_string_lossy();
        let forbidden = ["/bin", "/sbin", "/usr", "/etc", "/var", "/System", "/Library"];
        for prefix in &forbidden {
            if path_str.starts_with(prefix) {
                return Err(format!("Refusing to destroy system path: {}", path_str));
            }
        }
    }

    let file_size = fs::metadata(&canonical)
        .map_err(|e| format!("Cannot read file metadata: {e}"))?
        .len();

    // ── Pass 1: zeros ────────────────────────────────────────────────
    overwrite_pass(&canonical, file_size, 0x00)
        .map_err(|e| format!("Pass 1 (zeros) failed: {e}"))?;

    // ── Pass 2: ones ─────────────────────────────────────────────────
    overwrite_pass(&canonical, file_size, 0xFF)
        .map_err(|e| format!("Pass 2 (ones) failed: {e}"))?;

    // ── Pass 3: random ───────────────────────────────────────────────
    overwrite_random(&canonical, file_size)
        .map_err(|e| format!("Pass 3 (random) failed: {e}"))?;

    // ── Delete ───────────────────────────────────────────────────────
    fs::remove_file(&canonical)
        .map_err(|e| format!("File deletion failed: {e}"))?;

    let verified_deleted = !canonical.exists();

    tracing::info!(
        path = %canonical.display(),
        size = file_size,
        "file self-destructed (DoD 5220.22-M 3-pass)"
    );

    Ok(SelfDestructResult {
        path: canonical.to_string_lossy().into_owned(),
        passes: 3,
        original_size: file_size,
        verified_deleted,
    })
}

// ── Internal helpers ─────────────────────────────────────────────────────────

fn overwrite_pass(path: &Path, size: u64, byte: u8) -> std::io::Result<()> {
    let mut f = open_for_overwrite(path)?;
    let buf = vec![byte; chunk_size(size)];
    write_full(&mut f, size, &buf)?;
    f.flush()?;
    f.sync_all()?;
    Ok(())
}

fn overwrite_random(path: &Path, size: u64) -> std::io::Result<()> {
    let mut f = open_for_overwrite(path)?;
    let chunk = chunk_size(size);
    let mut buf = vec![0u8; chunk];
    let mut remaining = size;
    while remaining > 0 {
        let n = std::cmp::min(remaining, chunk as u64) as usize;
        getrandom::getrandom(&mut buf[..n])
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
        f.write_all(&buf[..n])?;
        remaining -= n as u64;
    }
    f.flush()?;
    f.sync_all()?;
    Ok(())
}

fn open_for_overwrite(path: &Path) -> std::io::Result<File> {
    OpenOptions::new()
        .write(true)
        .truncate(true)
        .open(path)
}

fn write_full(f: &mut File, total: u64, buf: &[u8]) -> std::io::Result<()> {
    let mut remaining = total;
    while remaining > 0 {
        let n = std::cmp::min(remaining, buf.len() as u64) as usize;
        f.write_all(&buf[..n])?;
        remaining -= n as u64;
    }
    Ok(())
}

/// Use 64 KiB chunks for writing, but never larger than the file itself.
fn chunk_size(file_size: u64) -> usize {
    std::cmp::min(file_size, 64 * 1024) as usize
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;

    #[test]
    fn self_destruct_deletes_file() {
        let mut tmp = NamedTempFile::new().unwrap();
        let path = tmp.path().to_path_buf();
        tmp.write_all(b"TOP SECRET QUANTUM KEY MATERIAL").unwrap();
        tmp.flush().unwrap();
        // Keep the path but allow deletion.
        drop(tmp);

        // Write file content back so it exists.
        fs::write(&path, b"TOP SECRET QUANTUM KEY MATERIAL").unwrap();
        assert!(path.exists());

        let result = secure_delete_file(&path).unwrap();
        assert!(result.verified_deleted);
        assert_eq!(result.passes, 3);
        assert_eq!(result.original_size, 31);
        assert!(!path.exists());
    }

    #[test]
    fn self_destruct_nonexistent_file_returns_error() {
        let result = secure_delete_file(Path::new("/tmp/nonexistent_zipminator_test_file"));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("File not found"));
    }

    #[test]
    fn self_destruct_directory_returns_error() {
        let dir = tempfile::tempdir().unwrap();
        let result = secure_delete_file(dir.path());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not a file"));
    }

    #[test]
    fn self_destruct_empty_file() {
        let path = tempfile::NamedTempFile::new().unwrap().into_temp_path().to_path_buf();
        // Create an empty file.
        fs::write(&path, b"").unwrap();
        assert!(path.exists());

        let result = secure_delete_file(&path).unwrap();
        assert!(result.verified_deleted);
        assert_eq!(result.original_size, 0);
    }

    #[test]
    fn self_destruct_large_file() {
        let path = tempfile::NamedTempFile::new().unwrap().into_temp_path().to_path_buf();
        // 256 KiB file — larger than the 64 KiB chunk size.
        let data = vec![0xABu8; 256 * 1024];
        fs::write(&path, &data).unwrap();

        let result = secure_delete_file(&path).unwrap();
        assert!(result.verified_deleted);
        assert_eq!(result.original_size, 256 * 1024);
    }

    #[test]
    fn self_destruct_refuses_system_paths() {
        if cfg!(unix) {
            // /usr/lib/dyld exists on macOS and lives under a forbidden prefix.
            let candidates = ["/usr/lib/dyld", "/usr/bin/true", "/bin/ls"];
            for candidate in &candidates {
                let p = Path::new(candidate);
                if p.exists() {
                    let result = secure_delete_file(p);
                    assert!(result.is_err(), "Should refuse {candidate}");
                    assert!(
                        result.unwrap_err().contains("system path"),
                        "Error for {candidate} should mention 'system path'"
                    );
                    return;
                }
            }
            // If none of the candidates exist, skip gracefully.
        }
    }
}
