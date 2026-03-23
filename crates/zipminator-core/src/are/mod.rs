//! Algebraic Randomness Extraction (ARE)
//!
//! A new family of randomness extractors parameterized by randomly-chosen
//! algebraic operations across number domains (N, Z, Q, R, C). An ARE program
//! is a sequence of (domain, value, operation) triples that defines a
//! seed-dependent hash function. Given input `x` and program `P`, the
//! extraction function computes `f_P(x) = fold(x, P) mod p` where `p` is a
//! large prime.
//!
//! The key insight: because each step samples from five domains and six
//! operations, the seed space grows as `(5 * n * 6)^k` for `k` steps with
//! domain bound `n`, giving strong epsilon-universality with compact seeds.
//!
//! See `docs/papers/che-framework/are-spec.md` for the formal specification
//! and test vectors.

pub mod domains;
pub mod extractor;
pub mod program;

/// The five classical number domains, bounded for computation.
///
/// Each domain is parameterized by a bound `n` (stored separately) that
/// constrains the range of values:
/// - `Natural`: N_n = {0, 1, ..., n-1}
/// - `Integer`: Z_n = {-(n-1), ..., n-1}
/// - `Rational`: Q_n = {a/b : a,b in Z_n, b != 0}
/// - `Real`: R_n = fixed-point with n bits of fractional precision
/// - `Complex`: C_n = (a + bi) where a,b in R_n
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Domain {
    /// Natural numbers: N_n = {0, 1, ..., n-1}
    Natural,
    /// Integers: Z_n = {-(n-1), ..., n-1}
    Integer,
    /// Rationals: Q_n = {a/b : a,b in Z_n, b != 0}
    Rational,
    /// Reals: R_n = fixed-point with n bits of precision
    Real,
    /// Complex: C_n = (a + bi) where a,b in R_n
    Complex,
}

/// Arithmetic operations available in ARE programs.
///
/// These operations form the algebraic "instruction set" of an ARE program.
/// Each operation is well-defined across all domains with the following
/// safety guarantees:
/// - `Div`: division by zero maps to the identity element (no-op)
/// - `Mod`: modulus by zero maps to the identity element
/// - `Exp`: modular exponentiation; restricted to `Natural` and `Integer` domains
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Operation {
    /// Addition
    Add,
    /// Subtraction
    Sub,
    /// Multiplication
    Mul,
    /// Division (protected: division by zero maps to identity)
    Div,
    /// Modulus
    Mod,
    /// Modular exponentiation (for Natural and Integer domains only)
    Exp,
}

/// A single step in an ARE program.
///
/// Each step specifies a domain, a value drawn from that domain, and an
/// arithmetic operation to apply. During extraction, the accumulator is
/// updated as: `acc = op(acc, value)` where arithmetic is performed in
/// the specified domain.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AreStep {
    /// The number domain for this step's arithmetic.
    pub domain: Domain,
    /// Encoded value (interpretation depends on domain).
    /// For `Rational`, this is the numerator; for `Complex`, the real part.
    pub value: i128,
    /// Imaginary part (`Complex` domain only; 0 for all other domains).
    pub value_imag: i128,
    /// The arithmetic operation to apply.
    pub operation: Operation,
}

/// A complete ARE program: a sequence of algebraic steps with a final modulus.
///
/// The extraction function is defined as:
/// ```text
/// f_P(x) = fold(x, steps) mod modulus
/// ```
/// where `fold` applies each step's operation sequentially to the accumulator,
/// starting from input `x`.
///
/// The `modulus` should be a large prime to ensure uniform output distribution.
#[derive(Debug, Clone)]
pub struct AreProgram {
    /// Ordered sequence of algebraic steps.
    pub steps: Vec<AreStep>,
    /// Final reduction modulus (should be a large prime).
    pub modulus: u128,
}
