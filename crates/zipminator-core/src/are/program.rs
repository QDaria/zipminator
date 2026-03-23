//! ARE program generation and serialization.
//!
//! Handles construction of random ARE programs from entropy seeds,
//! deterministic regeneration from serialized form, and seed-cost analysis.

use super::{AreProgram, AreStep, Domain, Operation};

/// Default large prime modulus for ARE programs.
const DEFAULT_MODULUS: u128 = 1_000_000_007;

/// A simple sequential bit reader over a byte slice.
///
/// Reads bits MSB-first from consecutive bytes, tracking position
/// across the entire slice. Used by `from_seed` to deterministically
/// decode domain/value/operation fields from a random seed.
struct BitReader<'a> {
    data: &'a [u8],
    byte_pos: usize,
    bit_pos: u8, // 0..8, MSB = 0
}

impl<'a> BitReader<'a> {
    fn new(data: &'a [u8]) -> Self {
        Self {
            data,
            byte_pos: 0,
            bit_pos: 0,
        }
    }

    /// Read `n` bits (up to 64) and return as a u64.
    ///
    /// If the underlying data is exhausted, remaining bits are zero-filled.
    fn read_bits(&mut self, n: u32) -> u64 {
        let mut result: u64 = 0;
        for _ in 0..n {
            result <<= 1;
            if self.byte_pos < self.data.len() {
                let bit = (self.data[self.byte_pos] >> (7 - self.bit_pos)) & 1;
                result |= bit as u64;
                self.bit_pos += 1;
                if self.bit_pos >= 8 {
                    self.bit_pos = 0;
                    self.byte_pos += 1;
                }
            }
            // If exhausted, bit stays 0
        }
        result
    }
}

/// Map a 3-bit value to one of the 5 domains (mod 5).
fn decode_domain(bits: u64) -> Domain {
    match bits % 5 {
        0 => Domain::Natural,
        1 => Domain::Integer,
        2 => Domain::Rational,
        3 => Domain::Real,
        4 => Domain::Complex,
        _ => unreachable!(),
    }
}

/// Map a 3-bit value to one of the 6 operations (mod 6).
fn decode_operation(bits: u64) -> Operation {
    match bits % 6 {
        0 => Operation::Add,
        1 => Operation::Sub,
        2 => Operation::Mul,
        3 => Operation::Div,
        4 => Operation::Mod,
        5 => Operation::Exp,
        _ => unreachable!(),
    }
}

impl AreProgram {
    /// Create an ARE program from explicit steps and modulus.
    pub fn from_steps(steps: Vec<AreStep>, modulus: u128) -> Self {
        Self { steps, modulus }
    }

    /// Deterministic program generation from random seed bytes.
    ///
    /// Each step consumes:
    /// - 3 bits for domain (mod 5)
    /// - 16 bits for value (interpreted as i128)
    /// - 3 bits for operation (mod 6)
    ///
    /// Total: 22 bits per step. If the seed runs out, remaining bits
    /// are zero-filled, ensuring determinism for any seed length.
    ///
    /// The imaginary component (`value_imag`) is set to 0 for all domains
    /// except Complex, where a second 16-bit value is read.
    pub fn from_seed(seed: &[u8], num_steps: usize) -> Self {
        let mut reader = BitReader::new(seed);
        let mut steps = Vec::with_capacity(num_steps);

        for _ in 0..num_steps {
            let domain_bits = reader.read_bits(3);
            let domain = decode_domain(domain_bits);

            let value_bits = reader.read_bits(16);
            let value = value_bits as i128;

            let value_imag = if domain == Domain::Complex {
                reader.read_bits(16) as i128
            } else {
                0
            };

            let op_bits = reader.read_bits(3);
            let operation = decode_operation(op_bits);

            steps.push(AreStep {
                domain,
                value,
                value_imag,
                operation,
            });
        }

        Self {
            steps,
            modulus: DEFAULT_MODULUS,
        }
    }

    /// Return the number of steps in this program.
    pub fn len(&self) -> usize {
        self.steps.len()
    }

    /// Return true if the program has no steps.
    pub fn is_empty(&self) -> bool {
        self.steps.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_steps_basic() {
        let steps = vec![
            AreStep {
                domain: Domain::Integer,
                value: 42,
                value_imag: 0,
                operation: Operation::Add,
            },
        ];
        let program = AreProgram::from_steps(steps, 257);
        assert_eq!(program.len(), 1);
        assert_eq!(program.modulus, 257);
        assert_eq!(program.steps[0].value, 42);
    }

    #[test]
    fn test_from_seed_deterministic() {
        let seed = [0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE, 0xBA, 0xBE];
        let p1 = AreProgram::from_seed(&seed, 4);
        let p2 = AreProgram::from_seed(&seed, 4);
        assert_eq!(p1.steps.len(), p2.steps.len());
        for (a, b) in p1.steps.iter().zip(p2.steps.iter()) {
            assert_eq!(a.domain, b.domain);
            assert_eq!(a.value, b.value);
            assert_eq!(a.value_imag, b.value_imag);
            assert_eq!(a.operation, b.operation);
        }
    }

    #[test]
    fn test_from_seed_different_seeds() {
        let s1 = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
        let s2 = [0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8];
        let p1 = AreProgram::from_seed(&s1, 4);
        let p2 = AreProgram::from_seed(&s2, 4);
        // Different seeds should produce different programs (with overwhelming probability)
        let same = p1.steps.iter().zip(p2.steps.iter()).all(|(a, b)| {
            a.domain == b.domain && a.value == b.value && a.operation == b.operation
        });
        assert!(!same, "different seeds should produce different programs");
    }

    #[test]
    fn test_from_seed_default_modulus() {
        let seed = [0x42; 8];
        let p = AreProgram::from_seed(&seed, 2);
        assert_eq!(p.modulus, 1_000_000_007);
    }

    #[test]
    fn test_from_seed_short_seed_zero_fills() {
        // Even a 1-byte seed should produce a valid program (zero-filled)
        let seed = [0xFF];
        let p = AreProgram::from_seed(&seed, 2);
        assert_eq!(p.len(), 2);
    }

    #[test]
    fn test_is_empty() {
        let p = AreProgram::from_steps(vec![], 257);
        assert!(p.is_empty());
        assert_eq!(p.len(), 0);
    }

    #[test]
    fn test_bit_reader_basic() {
        let data = [0b11001010];
        let mut reader = BitReader::new(&data);
        assert_eq!(reader.read_bits(4), 0b1100);
        assert_eq!(reader.read_bits(4), 0b1010);
    }

    #[test]
    fn test_bit_reader_cross_byte() {
        let data = [0xFF, 0x00];
        let mut reader = BitReader::new(&data);
        assert_eq!(reader.read_bits(4), 0b1111);
        assert_eq!(reader.read_bits(8), 0b1111_0000);
        assert_eq!(reader.read_bits(4), 0b0000);
    }

    #[test]
    fn test_decode_domain_all_variants() {
        assert_eq!(decode_domain(0), Domain::Natural);
        assert_eq!(decode_domain(1), Domain::Integer);
        assert_eq!(decode_domain(2), Domain::Rational);
        assert_eq!(decode_domain(3), Domain::Real);
        assert_eq!(decode_domain(4), Domain::Complex);
        // Wraps: 5 mod 5 = 0
        assert_eq!(decode_domain(5), Domain::Natural);
    }

    #[test]
    fn test_decode_operation_all_variants() {
        assert_eq!(decode_operation(0), Operation::Add);
        assert_eq!(decode_operation(1), Operation::Sub);
        assert_eq!(decode_operation(2), Operation::Mul);
        assert_eq!(decode_operation(3), Operation::Div);
        assert_eq!(decode_operation(4), Operation::Mod);
        assert_eq!(decode_operation(5), Operation::Exp);
        // Wraps: 6 mod 6 = 0
        assert_eq!(decode_operation(6), Operation::Add);
    }
}
