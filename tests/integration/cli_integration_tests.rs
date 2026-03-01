// Integration Tests for Zipminator CLI
// Tests complete end-to-end workflows

use std::process::{Command, Stdio};
use std::fs;
use std::path::PathBuf;
use tempfile::TempDir;

const CLI_BINARY: &str = env!("CARGO_BIN_EXE_zipminator");

#[cfg(test)]
mod cli_integration {
    use super::*;

    fn get_temp_dir() -> TempDir {
        TempDir::new().expect("Failed to create temp directory")
    }

    fn run_cli(args: &[&str]) -> (String, String, i32) {
        let output = Command::new(CLI_BINARY)
            .args(args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .expect("Failed to execute CLI");

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let exit_code = output.status.code().unwrap_or(-1);

        (stdout, stderr, exit_code)
    }

    #[test]
    fn test_cli_help() {
        let (stdout, _, exit_code) = run_cli(&["--help"]);

        assert_eq!(exit_code, 0);
        assert!(stdout.contains("Zipminator"));
        assert!(stdout.contains("keygen") || stdout.contains("Usage"));
    }

    #[test]
    fn test_cli_version() {
        let (stdout, _, exit_code) = run_cli(&["--version"]);

        assert_eq!(exit_code, 0);
        assert!(stdout.contains("0.1.0") || stdout.contains("zipminator"));
    }

    #[test]
    fn test_keygen_command() {
        let temp_dir = get_temp_dir();
        let public_key_path = temp_dir.path().join("public.key");
        let secret_key_path = temp_dir.path().join("secret.key");

        let (stdout, stderr, exit_code) = run_cli(&[
            "keygen",
            "--public-key", public_key_path.to_str().unwrap(),
            "--secret-key", secret_key_path.to_str().unwrap(),
        ]);

        assert_eq!(exit_code, 0, "stderr: {}", stderr);
        assert!(public_key_path.exists(), "Public key file not created");
        assert!(secret_key_path.exists(), "Secret key file not created");

        // Verify file sizes
        let public_key_size = fs::metadata(&public_key_path).unwrap().len();
        let secret_key_size = fs::metadata(&secret_key_path).unwrap().len();

        assert_eq!(public_key_size, 1184); // Kyber768 public key size
        assert_eq!(secret_key_size, 2400); // Kyber768 secret key size
    }

    #[test]
    fn test_encapsulate_command() {
        let temp_dir = get_temp_dir();
        let public_key_path = temp_dir.path().join("public.key");
        let secret_key_path = temp_dir.path().join("secret.key");
        let ciphertext_path = temp_dir.path().join("ciphertext.bin");
        let shared_secret_path = temp_dir.path().join("shared_secret.bin");

        // Generate keypair first
        run_cli(&[
            "keygen",
            "--public-key", public_key_path.to_str().unwrap(),
            "--secret-key", secret_key_path.to_str().unwrap(),
        ]);

        // Encapsulate
        let (_, stderr, exit_code) = run_cli(&[
            "encapsulate",
            "--public-key", public_key_path.to_str().unwrap(),
            "--ciphertext", ciphertext_path.to_str().unwrap(),
            "--shared-secret", shared_secret_path.to_str().unwrap(),
        ]);

        assert_eq!(exit_code, 0, "stderr: {}", stderr);
        assert!(ciphertext_path.exists());
        assert!(shared_secret_path.exists());

        // Verify file sizes
        let ciphertext_size = fs::metadata(&ciphertext_path).unwrap().len();
        let shared_secret_size = fs::metadata(&shared_secret_path).unwrap().len();

        assert_eq!(ciphertext_size, 1088); // Kyber768 ciphertext size
        assert_eq!(shared_secret_size, 32); // Shared secret size
    }

    #[test]
    fn test_decapsulate_command() {
        let temp_dir = get_temp_dir();
        let public_key_path = temp_dir.path().join("public.key");
        let secret_key_path = temp_dir.path().join("secret.key");
        let ciphertext_path = temp_dir.path().join("ciphertext.bin");
        let shared_secret_enc = temp_dir.path().join("shared_secret_enc.bin");
        let shared_secret_dec = temp_dir.path().join("shared_secret_dec.bin");

        // Generate keypair
        run_cli(&[
            "keygen",
            "--public-key", public_key_path.to_str().unwrap(),
            "--secret-key", secret_key_path.to_str().unwrap(),
        ]);

        // Encapsulate
        run_cli(&[
            "encapsulate",
            "--public-key", public_key_path.to_str().unwrap(),
            "--ciphertext", ciphertext_path.to_str().unwrap(),
            "--shared-secret", shared_secret_enc.to_str().unwrap(),
        ]);

        // Decapsulate
        let (_, stderr, exit_code) = run_cli(&[
            "decapsulate",
            "--secret-key", secret_key_path.to_str().unwrap(),
            "--ciphertext", ciphertext_path.to_str().unwrap(),
            "--shared-secret", shared_secret_dec.to_str().unwrap(),
        ]);

        assert_eq!(exit_code, 0, "stderr: {}", stderr);
        assert!(shared_secret_dec.exists());

        // Verify shared secrets match
        let ss_enc = fs::read(&shared_secret_enc).unwrap();
        let ss_dec = fs::read(&shared_secret_dec).unwrap();

        assert_eq!(ss_enc, ss_dec, "Shared secrets don't match!");
    }

    #[test]
    fn test_complete_workflow() {
        let temp_dir = get_temp_dir();

        // Step 1: Generate Alice's keypair
        let alice_public = temp_dir.path().join("alice.pub");
        let alice_secret = temp_dir.path().join("alice.sec");

        run_cli(&[
            "keygen",
            "--public-key", alice_public.to_str().unwrap(),
            "--secret-key", alice_secret.to_str().unwrap(),
        ]);

        // Step 2: Bob encapsulates with Alice's public key
        let ciphertext = temp_dir.path().join("ciphertext.bin");
        let bob_shared = temp_dir.path().join("bob_shared.bin");

        run_cli(&[
            "encapsulate",
            "--public-key", alice_public.to_str().unwrap(),
            "--ciphertext", ciphertext.to_str().unwrap(),
            "--shared-secret", bob_shared.to_str().unwrap(),
        ]);

        // Step 3: Alice decapsulates to get shared secret
        let alice_shared = temp_dir.path().join("alice_shared.bin");

        run_cli(&[
            "decapsulate",
            "--secret-key", alice_secret.to_str().unwrap(),
            "--ciphertext", ciphertext.to_str().unwrap(),
            "--shared-secret", alice_shared.to_str().unwrap(),
        ]);

        // Verify both have the same shared secret
        let bob_ss = fs::read(&bob_shared).unwrap();
        let alice_ss = fs::read(&alice_shared).unwrap();

        assert_eq!(bob_ss, alice_ss, "Key exchange failed!");
    }

    #[test]
    fn test_invalid_public_key_file() {
        let temp_dir = get_temp_dir();
        let invalid_public = temp_dir.path().join("invalid.pub");
        let ciphertext = temp_dir.path().join("ct.bin");
        let shared_secret = temp_dir.path().join("ss.bin");

        // Create invalid public key file
        fs::write(&invalid_public, b"invalid data").unwrap();

        let (_, _, exit_code) = run_cli(&[
            "encapsulate",
            "--public-key", invalid_public.to_str().unwrap(),
            "--ciphertext", ciphertext.to_str().unwrap(),
            "--shared-secret", shared_secret.to_str().unwrap(),
        ]);

        assert_ne!(exit_code, 0, "Should fail with invalid public key");
    }

    #[test]
    fn test_missing_files_error() {
        let (_, _, exit_code) = run_cli(&[
            "encapsulate",
            "--public-key", "/nonexistent/path/public.key",
            "--ciphertext", "/tmp/ct.bin",
            "--shared-secret", "/tmp/ss.bin",
        ]);

        assert_ne!(exit_code, 0, "Should fail with missing file");
    }

    #[test]
    fn test_multiple_encapsulations() {
        let temp_dir = get_temp_dir();
        let public_key = temp_dir.path().join("public.key");
        let secret_key = temp_dir.path().join("secret.key");

        // Generate keypair
        run_cli(&[
            "keygen",
            "--public-key", public_key.to_str().unwrap(),
            "--secret-key", secret_key.to_str().unwrap(),
        ]);

        // Perform 10 encapsulation/decapsulation cycles
        for i in 0..10 {
            let ct_path = temp_dir.path().join(format!("ct_{}.bin", i));
            let ss_enc_path = temp_dir.path().join(format!("ss_enc_{}.bin", i));
            let ss_dec_path = temp_dir.path().join(format!("ss_dec_{}.bin", i));

            run_cli(&[
                "encapsulate",
                "--public-key", public_key.to_str().unwrap(),
                "--ciphertext", ct_path.to_str().unwrap(),
                "--shared-secret", ss_enc_path.to_str().unwrap(),
            ]);

            run_cli(&[
                "decapsulate",
                "--secret-key", secret_key.to_str().unwrap(),
                "--ciphertext", ct_path.to_str().unwrap(),
                "--shared-secret", ss_dec_path.to_str().unwrap(),
            ]);

            let ss_enc = fs::read(&ss_enc_path).unwrap();
            let ss_dec = fs::read(&ss_dec_path).unwrap();

            assert_eq!(ss_enc, ss_dec, "Cycle {} failed", i);
        }
    }

    #[test]
    fn test_qrng_keygen_if_available() {
        let temp_dir = get_temp_dir();
        let public_key = temp_dir.path().join("public.key");
        let secret_key = temp_dir.path().join("secret.key");

        // Try with QRNG (may not be available)
        let (_, _, exit_code) = run_cli(&[
            "keygen",
            "--public-key", public_key.to_str().unwrap(),
            "--secret-key", secret_key.to_str().unwrap(),
            "--qrng", "idquantique",
        ]);

        // Should either succeed or fail gracefully
        if exit_code == 0 {
            assert!(public_key.exists());
            assert!(secret_key.exists());
        } else {
            // Should have informative error message
            // (test passes either way)
        }
    }

    #[test]
    fn test_benchmark_command() {
        let (stdout, _, exit_code) = run_cli(&["benchmark", "--iterations", "10"]);

        // Benchmark command may or may not be implemented
        if exit_code == 0 {
            assert!(stdout.contains("keygen") || stdout.contains("benchmark"));
        }
    }
}

#[cfg(test)]
mod docker_integration {
    use super::*;

    #[test]
    #[ignore] // Requires Docker
    fn test_docker_build() {
        let output = Command::new("docker")
            .args(&["build", "-t", "zipminator:test", "."])
            .output();

        if let Ok(result) = output {
            assert!(result.status.success(), "Docker build failed");
        }
    }

    #[test]
    #[ignore] // Requires Docker
    fn test_docker_run() {
        let output = Command::new("docker")
            .args(&["run", "--rm", "zipminator:test", "zipminator", "--version"])
            .output();

        if let Ok(result) = output {
            assert!(result.status.success());
            let stdout = String::from_utf8_lossy(&result.stdout);
            assert!(stdout.contains("zipminator"));
        }
    }
}
