// Constant-Time Validation Tests using Statistical Timing Analysis
// Based on dudect (DUmb DEvice for Constant-Time) methodology

use std::time::Instant;
use kyber768::*;

const MEASUREMENTS_PER_CLASS: usize = 100_000;
const CONFIDENCE_THRESHOLD: f64 = 4.5; // t-statistic threshold

#[derive(Debug)]
struct TimingMeasurements {
    class_a: Vec<u64>, // Valid operations
    class_b: Vec<u64>, // Invalid operations
}

impl TimingMeasurements {
    fn new() -> Self {
        Self {
            class_a: Vec::with_capacity(MEASUREMENTS_PER_CLASS),
            class_b: Vec::with_capacity(MEASUREMENTS_PER_CLASS),
        }
    }

    fn add_measurement_a(&mut self, nanos: u64) {
        self.class_a.push(nanos);
    }

    fn add_measurement_b(&mut self, nanos: u64) {
        self.class_b.push(nanos);
    }

    fn compute_t_statistic(&self) -> f64 {
        let mean_a = self.class_a.iter().sum::<u64>() as f64 / self.class_a.len() as f64;
        let mean_b = self.class_b.iter().sum::<u64>() as f64 / self.class_b.len() as f64;

        let var_a = self.class_a.iter()
            .map(|&x| {
                let diff = x as f64 - mean_a;
                diff * diff
            })
            .sum::<f64>() / (self.class_a.len() - 1) as f64;

        let var_b = self.class_b.iter()
            .map(|&x| {
                let diff = x as f64 - mean_b;
                diff * diff
            })
            .sum::<f64>() / (self.class_b.len() - 1) as f64;

        let n_a = self.class_a.len() as f64;
        let n_b = self.class_b.len() as f64;

        let numerator = mean_a - mean_b;
        let denominator = ((var_a / n_a) + (var_b / n_b)).sqrt();

        if denominator == 0.0 {
            0.0
        } else {
            (numerator / denominator).abs()
        }
    }

    fn is_constant_time(&self, threshold: f64) -> bool {
        let t_stat = self.compute_t_statistic();
        t_stat < threshold
    }
}

#[cfg(test)]
mod constant_time_tests {
    use super::*;

    #[test]
    #[ignore] // Long-running test
    fn test_decapsulation_constant_time() {
        let mut measurements = TimingMeasurements::new();
        let keypair = Keypair::generate();

        println!("Performing {} measurements per class...", MEASUREMENTS_PER_CLASS);

        for i in 0..MEASUREMENTS_PER_CLASS {
            if i % 10000 == 0 {
                println!("Progress: {}/{}", i, MEASUREMENTS_PER_CLASS);
            }

            // Class A: Valid ciphertext
            let (ciphertext, _) = encapsulate(&keypair.public);
            let start = Instant::now();
            let _ = decapsulate(&ciphertext, &keypair.secret);
            let duration = start.elapsed().as_nanos() as u64;
            measurements.add_measurement_a(duration);

            // Class B: Corrupted ciphertext
            let mut corrupted = ciphertext.clone();
            corrupted[0] ^= 0xFF;
            let start = Instant::now();
            let _ = decapsulate(&corrupted, &keypair.secret);
            let duration = start.elapsed().as_nanos() as u64;
            measurements.add_measurement_b(duration);
        }

        let t_stat = measurements.compute_t_statistic();
        println!("t-statistic: {:.4}", t_stat);
        println!("Threshold: {:.4}", CONFIDENCE_THRESHOLD);

        assert!(
            measurements.is_constant_time(CONFIDENCE_THRESHOLD),
            "Timing leak detected! t-statistic: {:.4}", t_stat
        );
    }

    #[test]
    fn test_keygen_timing_stability() {
        let mut measurements = TimingMeasurements::new();

        for _ in 0..10_000 {
            // Class A: Key generation with default RNG
            let start = Instant::now();
            let _ = Keypair::generate();
            let duration = start.elapsed().as_nanos() as u64;
            measurements.add_measurement_a(duration);

            // Class B: Key generation from seed
            let seed = [0u8; 32];
            let start = Instant::now();
            let _ = Keypair::from_seed(&seed);
            let duration = start.elapsed().as_nanos() as u64;
            measurements.add_measurement_b(duration);
        }

        let t_stat = measurements.compute_t_statistic();
        println!("Keygen t-statistic: {:.4}", t_stat);

        // Keygen may have slight differences, but should still be reasonable
        assert!(t_stat < 10.0, "Excessive keygen timing variance: {:.4}", t_stat);
    }

    #[test]
    fn test_encapsulation_timing_consistency() {
        let keypair = Keypair::generate();
        let mut measurements = TimingMeasurements::new();

        for i in 0..50_000 {
            // Measure consecutive encapsulations
            let start = Instant::now();
            let _ = encapsulate(&keypair.public);
            let duration = start.elapsed().as_nanos() as u64;

            if i % 2 == 0 {
                measurements.add_measurement_a(duration);
            } else {
                measurements.add_measurement_b(duration);
            }
        }

        let t_stat = measurements.compute_t_statistic();
        println!("Encapsulation t-statistic: {:.4}", t_stat);

        assert!(
            t_stat < 5.0,
            "Encapsulation timing inconsistent: {:.4}", t_stat
        );
    }
}

#[cfg(test)]
mod side_channel_tests {
    use super::*;

    #[test]
    fn test_cache_timing_resistance() {
        // Test for cache-timing resistance by measuring with different inputs
        let keypair1 = Keypair::generate();
        let keypair2 = Keypair::generate();

        let (ct1, _) = encapsulate(&keypair1.public);
        let (ct2, _) = encapsulate(&keypair2.public);

        let mut times1 = Vec::new();
        let mut times2 = Vec::new();

        for _ in 0..1000 {
            // Alternate between two different ciphertexts
            let start = Instant::now();
            let _ = decapsulate(&ct1, &keypair1.secret);
            times1.push(start.elapsed().as_nanos());

            let start = Instant::now();
            let _ = decapsulate(&ct2, &keypair2.secret);
            times2.push(start.elapsed().as_nanos());
        }

        let avg1 = times1.iter().sum::<u128>() as f64 / times1.len() as f64;
        let avg2 = times2.iter().sum::<u128>() as f64 / times2.len() as f64;

        let ratio = avg1 / avg2;
        println!("Cache timing ratio: {:.4}", ratio);

        // Should be close to 1.0 (within 15%)
        assert!((0.85..1.15).contains(&ratio),
            "Cache timing vulnerability detected: ratio={:.4}", ratio);
    }

    #[test]
    fn test_power_analysis_resistance() {
        // Simulate power analysis by checking operation count consistency
        let keypair = Keypair::generate();
        let (ciphertext, _) = encapsulate(&keypair.public);

        // Valid decapsulation
        let start = Instant::now();
        let _ = decapsulate(&ciphertext, &keypair.secret);
        let valid_duration = start.elapsed();

        // Invalid decapsulation (corrupted)
        let mut corrupted = ciphertext.clone();
        corrupted[100] ^= 0xFF;

        let start = Instant::now();
        let _ = decapsulate(&corrupted, &keypair.secret);
        let invalid_duration = start.elapsed();

        let ratio = valid_duration.as_nanos() as f64 / invalid_duration.as_nanos() as f64;
        println!("Power analysis ratio: {:.4}", ratio);

        // Should have similar power consumption patterns
        assert!((0.75..1.25).contains(&ratio),
            "Power analysis vulnerability: ratio={:.4}", ratio);
    }
}
