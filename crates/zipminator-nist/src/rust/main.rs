//! NIST KAT Test Runner for Kyber-768

use std::path::Path;
use nist_kat::{load_kat_vectors, generate_sample_vectors, run_kat_test};

fn main() {
    println!("==================================================");
    println!("NIST Known Answer Test (KAT) for Kyber-768");
    println!("FIPS 203 (ML-KEM) Compliance Validation");
    println!("==================================================");
    println!();

    // Load test vectors
    let vectors = if let Some(filename) = std::env::args().nth(1) {
        println!("Loading test vectors from: {}", filename);
        match load_kat_vectors(Path::new(&filename)) {
            Ok(v) => v,
            Err(e) => {
                eprintln!("Error loading vectors: {}", e);
                println!("\nUsing sample test vectors instead.");
                generate_sample_vectors()
            }
        }
    } else {
        println!("No test vector file provided.");
        println!("For full NIST compliance, download official vectors from:");
        println!("  https://github.com/post-quantum-cryptography/KAT");
        println!("\nUsing sample test vectors.");
        generate_sample_vectors()
    };

    println!("\nRunning {} test vectors...\n", vectors.len());

    // Run all tests
    let mut passed = 0;
    let mut failed = 0;

    for test in vectors {
        match run_kat_test(&test) {
            Ok(_) => passed += 1,
            Err(e) => {
                eprintln!("✗ Test FAILED: {} - {}\n", test.test_name, e);
                failed += 1;
            }
        }
    }

    // Summary
    println!("==================================================");
    println!("NIST KAT Test Results");
    println!("==================================================");
    println!("Total Tests:  {}", passed + failed);
    println!("Passed:       {} ✓", passed);
    println!("Failed:       {}{}", failed, if failed > 0 { " ✗" } else { "" });
    println!("Success Rate: {:.1}%", 100.0 * passed as f64 / (passed + failed) as f64);
    println!("==================================================");

    std::process::exit(if failed == 0 { 0 } else { 1 });
}
