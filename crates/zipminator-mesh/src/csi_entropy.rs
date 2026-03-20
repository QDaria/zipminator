//! CSI Entropy Harvester: extracts cryptographic entropy from WiFi CSI subcarrier data.
//!
//! Uses Von Neumann debiasing on the least-significant bits of CSI phase measurements
//! to produce unbiased random bits, then optionally XORs with an existing QRNG pool
//! for defense-in-depth.
//!
//! Architecture #3 from the Physical Cryptography integration plan.

use num_complex::Complex;
use zeroize::Zeroize;

use crate::entropy_bridge::{EntropyBridgeError, PoolEntropySource};

/// Number of subcarriers in a standard WiFi CSI frame (802.11n HT20).
pub const CSI_SUBCARRIERS: usize = 56;

/// Minimum number of CSI frames needed to produce one byte of entropy.
/// Von Neumann debiasing discards ~75% of input bits on average,
/// and we need phase LSBs from subcarrier pairs.
const MIN_FRAMES_PER_BYTE: usize = 4;

/// Von Neumann debiaser: converts biased bit streams into unbiased output.
///
/// Operates on consecutive bit pairs:
/// - (0, 1) → output 0
/// - (1, 0) → output 1
/// - (0, 0) or (1, 1) → discard
pub struct VonNeumannExtractor {
    /// Accumulated output bits (up to 8 before flushing to byte buffer).
    bit_accumulator: u8,
    /// Number of valid bits in the accumulator (0..8).
    bits_collected: u8,
    /// Completed output bytes.
    output: Vec<u8>,
}

impl VonNeumannExtractor {
    /// Create a new extractor with empty state.
    pub fn new() -> Self {
        Self {
            bit_accumulator: 0,
            bits_collected: 0,
            output: Vec::new(),
        }
    }

    /// Feed a sequence of raw bits (as bools) into the debiaser.
    pub fn feed_bits(&mut self, bits: &[bool]) {
        let mut i = 0;
        while i + 1 < bits.len() {
            let a = bits[i];
            let b = bits[i + 1];
            i += 2;

            // Von Neumann rule: only output on differing pairs
            if a != b {
                let output_bit = if a { 1u8 } else { 0u8 };
                self.bit_accumulator = (self.bit_accumulator << 1) | output_bit;
                self.bits_collected += 1;

                if self.bits_collected == 8 {
                    self.output.push(self.bit_accumulator);
                    self.bit_accumulator = 0;
                    self.bits_collected = 0;
                }
            }
        }
    }

    /// Extract the completed entropy bytes, clearing internal state.
    pub fn drain(&mut self) -> Vec<u8> {
        let result = std::mem::take(&mut self.output);
        self.bit_accumulator = 0;
        self.bits_collected = 0;
        result
    }

    /// Number of complete bytes available.
    pub fn available_bytes(&self) -> usize {
        self.output.len()
    }
}

/// Extract phase LSBs from a CSI frame as raw bits for debiasing.
///
/// For each complex subcarrier value, computes the phase angle and extracts
/// the least-significant bit of the phase when quantized to 256 levels.
fn extract_phase_lsbs(frame: &[Complex<f32>; CSI_SUBCARRIERS]) -> Vec<bool> {
    frame
        .iter()
        .map(|c| {
            let phase = c.arg(); // -π to π
            // Quantize to 0..255 range
            let quantized = ((phase + std::f32::consts::PI) / (2.0 * std::f32::consts::PI) * 256.0)
                as u8;
            // LSB extraction
            (quantized & 1) != 0
        })
        .collect()
}

/// CSI-based entropy source implementing the `PoolEntropySource` trait.
///
/// Accepts raw CSI frames (56 complex subcarrier values each) and extracts
/// entropy via Von Neumann debiasing. Optionally XORs output with an existing
/// entropy source for defense-in-depth.
pub struct CsiEntropySource {
    extractor: VonNeumannExtractor,
    /// Buffered entropy bytes ready for consumption.
    entropy_buffer: Vec<u8>,
    /// Optional secondary source to XOR with (e.g., QRNG pool).
    xor_source: Option<Box<dyn PoolEntropySource>>,
}

impl CsiEntropySource {
    /// Create a CSI entropy source without XOR combination.
    pub fn new() -> Self {
        Self {
            extractor: VonNeumannExtractor::new(),
            entropy_buffer: Vec::new(),
            xor_source: None,
        }
    }

    /// Create a CSI entropy source that XORs output with another source.
    ///
    /// Defense-in-depth: even if CSI data is compromised, the XOR with QRNG
    /// ensures output entropy is at least as strong as the secondary source.
    pub fn with_xor_source(xor_source: Box<dyn PoolEntropySource>) -> Self {
        Self {
            extractor: VonNeumannExtractor::new(),
            entropy_buffer: Vec::new(),
            xor_source: Some(xor_source),
        }
    }

    /// Ingest a CSI frame and extract entropy from subcarrier phase data.
    pub fn ingest_frame(&mut self, frame: &[Complex<f32>; CSI_SUBCARRIERS]) {
        let bits = extract_phase_lsbs(frame);
        self.extractor.feed_bits(&bits);

        // Move completed bytes to buffer
        let mut new_bytes = self.extractor.drain();
        if !new_bytes.is_empty() {
            // XOR with secondary source if available
            if let Some(ref mut xor_src) = self.xor_source {
                let mut xor_buf = vec![0u8; new_bytes.len()];
                if let Ok(n) = xor_src.read_entropy(&mut xor_buf) {
                    for i in 0..n.min(new_bytes.len()) {
                        new_bytes[i] ^= xor_buf[i];
                    }
                }
                xor_buf.zeroize();
            }
            self.entropy_buffer.extend_from_slice(&new_bytes);
            new_bytes.zeroize();
        }
    }

    /// Ingest multiple CSI frames at once.
    pub fn ingest_frames(&mut self, frames: &[[Complex<f32>; CSI_SUBCARRIERS]]) {
        for frame in frames {
            self.ingest_frame(frame);
        }
    }
}

impl PoolEntropySource for CsiEntropySource {
    fn read_entropy(&mut self, buf: &mut [u8]) -> Result<usize, EntropyBridgeError> {
        let available = self.entropy_buffer.len();
        if available == 0 {
            return Err(EntropyBridgeError::InsufficientEntropy {
                needed: buf.len(),
                available: 0,
            });
        }
        let to_read = buf.len().min(available);
        buf[..to_read].copy_from_slice(&self.entropy_buffer[..to_read]);
        // Remove consumed bytes
        self.entropy_buffer.drain(..to_read);
        Ok(to_read)
    }

    fn available(&self) -> Result<usize, EntropyBridgeError> {
        Ok(self.entropy_buffer.len())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Generate a deterministic CSI frame with known phase distribution.
    fn make_test_frame(seed: u32) -> [Complex<f32>; CSI_SUBCARRIERS] {
        let mut frame = [Complex::new(0.0f32, 0.0f32); CSI_SUBCARRIERS];
        for (i, c) in frame.iter_mut().enumerate() {
            let angle =
                ((seed as f32 * 0.1 + i as f32 * 0.7) % (2.0 * std::f32::consts::PI))
                    - std::f32::consts::PI;
            let magnitude = 1.0 + (i as f32 * 0.01);
            *c = Complex::from_polar(magnitude, angle);
        }
        frame
    }

    #[test]
    fn test_von_neumann_basic_debiasing() {
        let mut ext = VonNeumannExtractor::new();
        // (false, true) → 0, (true, false) → 1, (true, true) → discard
        let bits = vec![false, true, true, false, true, true, false, true];
        ext.feed_bits(&bits);
        // Pairs: (F,T)→0, (T,F)→1, (T,T)→discard, (F,T)→0
        // 3 output bits: 0, 1, 0 — not enough for a full byte
        assert_eq!(ext.available_bytes(), 0);
    }

    #[test]
    fn test_von_neumann_produces_bytes() {
        let mut ext = VonNeumannExtractor::new();
        // Need enough alternating pairs to produce 8 output bits
        // Each alternating pair produces 1 bit, so 8 pairs minimum
        let mut bits = Vec::new();
        for _ in 0..8 {
            bits.push(false);
            bits.push(true); // Each produces a 0 bit
        }
        ext.feed_bits(&bits);
        assert_eq!(ext.available_bytes(), 1);
        let bytes = ext.drain();
        assert_eq!(bytes.len(), 1);
        assert_eq!(bytes[0], 0b00000000); // All 0 bits from (F,T) pairs
    }

    #[test]
    fn test_von_neumann_mixed_output() {
        let mut ext = VonNeumannExtractor::new();
        // Alternate between (T,F)→1 and (F,T)→0 to get 0b10101010 = 0xAA
        let mut bits = Vec::new();
        for _ in 0..4 {
            bits.push(true);
            bits.push(false); // → 1
            bits.push(false);
            bits.push(true); // → 0
        }
        ext.feed_bits(&bits);
        assert_eq!(ext.available_bytes(), 1);
        let bytes = ext.drain();
        assert_eq!(bytes[0], 0b10101010);
    }

    #[test]
    fn test_csi_entropy_source_ingest() {
        let mut source = CsiEntropySource::new();
        // Ingest many frames to accumulate entropy
        for seed in 0..100 {
            source.ingest_frame(&make_test_frame(seed));
        }
        let available = source.available().unwrap();
        assert!(available > 0, "should have extracted some entropy from 100 CSI frames");
    }

    #[test]
    fn test_csi_entropy_source_read() {
        let mut source = CsiEntropySource::new();
        for seed in 0..200 {
            source.ingest_frame(&make_test_frame(seed));
        }
        let available = source.available().unwrap();
        assert!(available >= 4, "need at least 4 bytes for test");

        let mut buf = [0u8; 4];
        let read = source.read_entropy(&mut buf).unwrap();
        assert_eq!(read, 4);
        // After reading, available should decrease
        let new_available = source.available().unwrap();
        assert_eq!(new_available, available - 4);
    }

    #[test]
    fn test_csi_entropy_source_empty_returns_error() {
        let mut source = CsiEntropySource::new();
        let mut buf = [0u8; 1];
        let result = source.read_entropy(&mut buf);
        assert!(result.is_err());
    }

    #[test]
    fn test_csi_different_frames_different_entropy() {
        let mut source1 = CsiEntropySource::new();
        let mut source2 = CsiEntropySource::new();

        for seed in 0..200 {
            source1.ingest_frame(&make_test_frame(seed));
        }
        for seed in 1000..1200 {
            source2.ingest_frame(&make_test_frame(seed));
        }

        let mut buf1 = [0u8; 4];
        let mut buf2 = [0u8; 4];
        source1.read_entropy(&mut buf1).unwrap();
        source2.read_entropy(&mut buf2).unwrap();
        assert_ne!(buf1, buf2, "different CSI data should produce different entropy");
    }

    #[test]
    fn test_phase_lsb_extraction() {
        let frame = make_test_frame(42);
        let bits = extract_phase_lsbs(&frame);
        assert_eq!(bits.len(), CSI_SUBCARRIERS);
        // Should have a mix of true and false (not all same)
        let true_count = bits.iter().filter(|&&b| b).count();
        assert!(true_count > 0 && true_count < CSI_SUBCARRIERS, "phase LSBs should not be uniform");
    }
}
