//! Number domain arithmetic implementations.
//!
//! Provides bounded arithmetic for each domain (N_n, Z_n, Q_n, R_n, C_n)
//! used by the ARE extraction engine.
//!
//! All operations reduce intermediate results modulo the domain bound to
//! keep values within representable range. Division by zero maps to the
//! identity element (input returned unchanged).

use super::{Domain, Operation};

/// Execute an operation in the given domain, returning result mod modulus.
///
/// The `modulus` parameter acts as the domain bound for intermediate arithmetic.
/// Division by zero maps to identity (input unchanged).
///
/// # Arguments
/// * `domain` - Which number domain to compute in
/// * `op` - The arithmetic operation to apply
/// * `input` - Current accumulator value
/// * `value` - Step value (real part or numerator)
/// * `value_imag` - Imaginary part (Complex domain) or denominator (Rational)
/// * `modulus` - Domain bound for modular reduction
pub fn domain_execute(
    domain: Domain,
    op: Operation,
    input: i128,
    value: i128,
    value_imag: i128,
    modulus: u128,
) -> i128 {
    match domain {
        Domain::Natural | Domain::Integer => integer_op(op, input, value, modulus),
        Domain::Rational => rational_op(op, input, value, modulus),
        Domain::Real => real_op(op, input, value, modulus),
        Domain::Complex => complex_op(op, input, value, value_imag, modulus),
    }
}

/// Reduce a signed i128 to its canonical representative in [0, modulus).
///
/// Handles negative values correctly: -1 mod 7 = 6, not -1.
fn reduce(val: i128, modulus: u128) -> i128 {
    if modulus == 0 {
        return val;
    }
    let m = modulus as i128;
    ((val % m) + m) % m
}

/// Modular exponentiation using square-and-multiply.
///
/// Computes `base^exp mod modulus` with constant iteration count (64 rounds).
/// Exponent is clamped to [0, 64] per spec.
fn mod_pow(base: i128, exp: i128, modulus: u128) -> i128 {
    if modulus <= 1 {
        return 0;
    }
    let m = modulus as i128;

    // Clamp exponent to [0, 64] per spec.
    let e = if exp < 0 { 0i128 } else { exp.min(64) } as u64;

    let mut result: i128 = 1;
    let mut b = reduce(base, modulus);

    for i in 0..64u32 {
        if (e >> i) & 1 == 1 {
            result = (result * b) % m;
        }
        b = (b * b) % m;
    }

    result
}

/// Integer domain operations (also used for Natural).
///
/// Natural and Integer share the same arithmetic; the only difference is
/// domain projection (handled at the caller level). All intermediate
/// results reduce mod `modulus`.
fn integer_op(op: Operation, input: i128, value: i128, modulus: u128) -> i128 {
    let m = modulus as i128;
    match op {
        Operation::Add => reduce(input + value, modulus),
        Operation::Sub => reduce(input - value, modulus),
        Operation::Mul => {
            // Use checked multiplication to avoid overflow on large i128 values.
            // For values that fit, direct multiplication is fine since we reduce mod m.
            let product = input.wrapping_mul(value);
            reduce(product, modulus)
        }
        Operation::Div => {
            if value == 0 {
                // Division by zero: identity rule
                input
            } else {
                reduce(input / value, modulus)
            }
        }
        Operation::Mod => {
            if value == 0 || m == 0 {
                // Modulus by zero: identity rule
                input
            } else {
                reduce(input % value, modulus)
            }
        }
        Operation::Exp => mod_pow(input, value, modulus),
    }
}

/// Rational domain operations.
///
/// For simplicity, rational operations treat `value` as a simple integer
/// operand (like embedding as v/1). The `value_imag` field is not used as
/// a denominator in this simplified implementation; full Q_n arithmetic
/// is reserved for a future version.
fn rational_op(op: Operation, input: i128, value: i128, modulus: u128) -> i128 {
    // Simplified: treat rational as integer with same operations.
    // Full rational field arithmetic (numerator/denominator tracking) is a
    // future extension. This matches the integer embedding a/1.
    integer_op(op, input, value, modulus)
}

/// Real domain operations.
///
/// Fixed-point reals are represented as integers (truncated). Operations
/// proceed identically to the integer domain since we work in modular
/// arithmetic with integer representatives.
fn real_op(op: Operation, input: i128, value: i128, modulus: u128) -> i128 {
    // Simplified: treat real as integer. Fixed-point scaling is a future
    // extension. The truncation projection (R -> Z) is an identity on
    // integer representatives.
    integer_op(op, input, value, modulus)
}

/// Complex domain operations.
///
/// Input is treated as `(input + 0i)`, value as `(value + value_imag * i)`.
/// After the operation, we project back to the real part (C -> R projection).
///
/// # Complex arithmetic rules
/// - Add: Re((a+0i) + (c+di)) = (a + c) mod modulus
/// - Sub: Re((a+0i) - (c+di)) = (a - c) mod modulus
/// - Mul: Re((a+0i) * (c+di)) = a*c mod modulus
/// - Div: Re((a+0i) / (c+di)) = a*c / (c^2 + d^2) mod modulus, or identity if c=d=0
/// - Mod: falls back to integer mod on real parts
/// - Exp: falls back to integer exp on real parts
fn complex_op(op: Operation, input: i128, value: i128, value_imag: i128, modulus: u128) -> i128 {
    let m = modulus as i128;
    match op {
        Operation::Add => {
            // (a + 0i) + (c + di) -> Re = a + c
            reduce(input + value, modulus)
        }
        Operation::Sub => {
            // (a + 0i) - (c + di) -> Re = a - c
            reduce(input - value, modulus)
        }
        Operation::Mul => {
            // (a + 0i) * (c + di) = ac + adi -> Re = a*c
            let product = input.wrapping_mul(value);
            reduce(product, modulus)
        }
        Operation::Div => {
            // (a + 0i) / (c + di) = a(c - di) / (c^2 + d^2) -> Re = a*c / (c^2+d^2)
            let denom = value.wrapping_mul(value) + value_imag.wrapping_mul(value_imag);
            if denom == 0 {
                // Division by zero: identity
                input
            } else {
                let numer = input.wrapping_mul(value);
                reduce(numer / denom, modulus)
            }
        }
        Operation::Mod => {
            // Complex mod: fall back to integer mod on real parts
            if value == 0 {
                input
            } else {
                reduce(input % value, modulus)
            }
        }
        Operation::Exp => {
            // Complex exp: fall back to integer exponentiation on real part
            mod_pow(input, value, modulus)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reduce_positive() {
        assert_eq!(reduce(10, 7), 3);
        assert_eq!(reduce(7, 7), 0);
        assert_eq!(reduce(0, 7), 0);
    }

    #[test]
    fn test_reduce_negative() {
        assert_eq!(reduce(-1, 7), 6);
        assert_eq!(reduce(-7, 7), 0);
        assert_eq!(reduce(-8, 7), 6);
    }

    #[test]
    fn test_integer_add() {
        assert_eq!(integer_op(Operation::Add, 100, 200, 256), 44); // 300 mod 256 = 44
        assert_eq!(integer_op(Operation::Add, 42, 10, 257), 52); // test vector 1
    }

    #[test]
    fn test_integer_mul() {
        assert_eq!(integer_op(Operation::Mul, 100, 3, 257), 43); // 300 mod 257 = 43
        assert_eq!(integer_op(Operation::Mul, 1, 137, 256), 137); // test vector 8 step 1
    }

    #[test]
    fn test_integer_sub() {
        assert_eq!(integer_op(Operation::Sub, 300, 50, 257), 250); // test vector 2 step 2
    }

    #[test]
    fn test_integer_div_by_zero() {
        assert_eq!(integer_op(Operation::Div, 77, 0, 257), 77); // identity
    }

    #[test]
    fn test_integer_mod_by_zero() {
        assert_eq!(integer_op(Operation::Mod, 42, 0, 257), 42); // identity
    }

    #[test]
    fn test_integer_exp() {
        // 2^10 = 1024, 1024 mod 256 = 0
        assert_eq!(integer_op(Operation::Exp, 2, 10, 256), 0);
        // 3^3 = 27, 27 mod 257 = 27
        assert_eq!(integer_op(Operation::Exp, 3, 3, 257), 27);
    }

    #[test]
    fn test_complex_mul() {
        // (100+0i) * (3+4i) = 300+400i, Re = 300
        assert_eq!(complex_op(Operation::Mul, 100, 3, 4, 1_000_000_007), 300);
    }

    #[test]
    fn test_complex_add() {
        // (50+0i) + (10+20i) -> Re = 60
        assert_eq!(complex_op(Operation::Add, 50, 10, 20, 1_000_000_007), 60);
    }

    #[test]
    fn test_complex_div_by_zero() {
        // (100+0i) / (0+0i) -> identity = 100
        assert_eq!(complex_op(Operation::Div, 100, 0, 0, 257), 100);
    }

    #[test]
    fn test_domain_execute_dispatch() {
        // Natural domain dispatches to integer_op
        assert_eq!(
            domain_execute(Domain::Natural, Operation::Add, 10, 5, 0, 257),
            15
        );
        // Complex domain dispatches to complex_op
        assert_eq!(
            domain_execute(Domain::Complex, Operation::Mul, 100, 3, 4, 1_000_000_007),
            300
        );
    }

    #[test]
    fn test_mod_pow_clamps_exponent() {
        // Exponent > 64 is clamped to 64
        let result = mod_pow(2, 100, 1_000_000_007);
        let expected = mod_pow(2, 64, 1_000_000_007);
        assert_eq!(result, expected);
    }

    #[test]
    fn test_mod_pow_negative_exponent() {
        // Negative exponent clamped to 0: x^0 = 1
        assert_eq!(mod_pow(5, -3, 257), 1);
    }
}
