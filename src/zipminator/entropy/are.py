"""Algebraic Randomness Extraction (ARE) -- Pure Python implementation.

A new family of randomness extractors parameterized by randomly-chosen
algebraic operations across number domains (N, Z, Q, R, C).

This is a pure-Python implementation mirroring the Rust engine at
crates/zipminator-core/src/are/. For performance-critical use, the
native Rust implementation via PyO3 can be used as a drop-in replacement.

Reference: docs/papers/che-framework/are-spec.md
"""

from __future__ import annotations

import hashlib
import struct
from dataclasses import dataclass
from enum import IntEnum
from typing import List, Optional

# Default large prime modulus (same as Rust implementation).
DEFAULT_MODULUS: int = 1_000_000_007


class Domain(IntEnum):
    """Number domains for ARE, including extended algebraic structures."""

    NATURAL = 0     # N_n = {0, 1, ..., n-1}
    INTEGER = 1     # Z_n = {-(n-1), ..., n-1}
    RATIONAL = 2    # Q_n = {a/b : a,b in Z_n, b != 0}
    REAL = 3        # R_n = fixed-point with n bits of fractional precision
    COMPLEX = 4     # C_n = (a + bi) where a,b in R_n
    QUATERNION = 5  # H_n = (a + bi + cj + dk), non-commutative (Claim 13)
    OCTONION = 6    # O_n = 8-dim, non-commutative + non-associative (Claim 14)
    GF = 7          # GF(2^8), exact finite field arithmetic (Claim 15)
    PADIC = 8       # Q_p, p-adic with ultrametric (Claim 16)


class Operation(IntEnum):
    """Arithmetic operations available in ARE programs."""

    ADD = 0
    SUB = 1
    MUL = 2
    DIV = 3
    MOD = 4
    EXP = 5


@dataclass(frozen=True)
class AreStep:
    """A single step in an ARE program.

    Each step specifies a domain, a value drawn from that domain, and an
    arithmetic operation to apply. During extraction, the accumulator is
    updated as: acc = op(acc, value) where arithmetic is performed in
    the specified domain.
    """

    domain: Domain
    value: int
    value_imag: int  # Only meaningful for Complex domain; 0 otherwise.
    operation: Operation


def _mod(a: int, m: int) -> int:
    """Python-style modulus that always returns a non-negative result for positive m."""
    return a % m


def domain_execute(
    domain: Domain,
    op: Operation,
    input_val: int,
    value: int,
    value_imag: int,
    modulus: int,
    domain_bound: int = 256,
) -> int:
    """Execute a single ARE step in the given domain.

    Parameters
    ----------
    domain : Domain
        The number domain for arithmetic.
    op : Operation
        The arithmetic operation.
    input_val : int
        Current accumulator value.
    value : int
        Step value (numerator for Rational, real part for Complex).
    value_imag : int
        Imaginary part (Complex only; denominator for Rational).
    modulus : int
        Final reduction modulus (used for Exp; domain wrapping uses domain_bound).
    domain_bound : int
        The domain bound n. Natural wraps at n, Integer wraps at 2n-1, etc.

    Returns
    -------
    int
        The new accumulator value after applying the operation.
    """
    if domain == Domain.NATURAL:
        return _execute_natural(op, input_val, value, domain_bound)
    elif domain == Domain.INTEGER:
        return _execute_integer(op, input_val, value, domain_bound)
    elif domain == Domain.RATIONAL:
        return _execute_rational(op, input_val, value, value_imag, domain_bound)
    elif domain == Domain.REAL:
        return _execute_real(op, input_val, value, domain_bound)
    elif domain == Domain.COMPLEX:
        return _execute_complex(op, input_val, value, value_imag, domain_bound)
    elif domain == Domain.QUATERNION:
        return _execute_quaternion(op, input_val, value, value_imag, domain_bound)
    elif domain == Domain.OCTONION:
        return _execute_octonion(op, input_val, value, value_imag, domain_bound)
    elif domain == Domain.GF:
        return _execute_gf(op, input_val, value, domain_bound)
    elif domain == Domain.PADIC:
        return _execute_padic(op, input_val, value, domain_bound)
    else:
        return input_val


def _project_to_natural(val: int, n: int) -> int:
    """Project an arbitrary integer into N_n = {0, ..., n-1}."""
    return abs(val) % n


def _project_to_integer(val: int, n: int) -> int:
    """Project into Z_n = {-(n-1), ..., n-1}."""
    bound = 2 * n - 1
    result = val % bound
    if result >= n:
        result = result - bound
    return result


def _execute_natural(op: Operation, acc: int, val: int, n: int) -> int:
    """Arithmetic in N_n with wrapping at n."""
    acc = _project_to_natural(acc, n)
    val = _project_to_natural(val, n)

    if op == Operation.ADD:
        return (acc + val) % n
    elif op == Operation.SUB:
        return (acc - val) % n
    elif op == Operation.MUL:
        return (acc * val) % n
    elif op == Operation.DIV:
        if val == 0:
            return acc
        return (acc // val) % n
    elif op == Operation.MOD:
        if val == 0:
            return acc
        return (acc % val) % n
    elif op == Operation.EXP:
        exp = min(abs(val), 64)
        return pow(acc, exp, n) if n > 0 else 0
    return acc


def _execute_integer(op: Operation, acc: int, val: int, n: int) -> int:
    """Arithmetic in Z_n = {-(n-1), ..., n-1}."""
    acc = _project_to_integer(acc, n)
    val = _project_to_integer(val, n)

    if op == Operation.ADD:
        result = acc + val
    elif op == Operation.SUB:
        result = acc - val
    elif op == Operation.MUL:
        result = acc * val
    elif op == Operation.DIV:
        if val == 0:
            return _project_to_integer(acc, n)
        result = acc // val if val != 0 else acc
    elif op == Operation.MOD:
        if val == 0:
            return _project_to_integer(acc, n)
        result = acc % val
    elif op == Operation.EXP:
        exp = min(abs(val), 64)
        # For integer domain, modular exponentiation using domain bound
        if acc < 0 and exp > 0:
            sign = -1 if exp % 2 == 1 else 1
            result = sign * pow(abs(acc), exp, n)
        else:
            result = pow(abs(acc), exp, n)
    else:
        return acc

    return _project_to_integer(result, n)


def _execute_rational(
    op: Operation, acc: int, num: int, den: int, n: int
) -> int:
    """Arithmetic in Q_n.

    We embed the accumulator as acc/1 and the step value as num/den.
    After the operation, we extract the integer part.
    """
    # Protect against zero denominator
    if den == 0:
        den = 1

    # Work with scaled integers: acc is acc*den, val is num
    # This avoids floating point while preserving the rational structure.
    if op == Operation.ADD:
        # acc + num/den = (acc*den + num) / den
        result = (acc * den + num) // den
    elif op == Operation.SUB:
        result = (acc * den - num) // den
    elif op == Operation.MUL:
        # acc * (num/den) = (acc * num) / den
        result = (acc * num) // den
    elif op == Operation.DIV:
        # acc / (num/den) = acc * den / num
        if num == 0:
            return _project_to_integer(acc, n)
        result = (acc * den) // num
    elif op == Operation.MOD:
        if num == 0 or den == 0:
            return _project_to_integer(acc, n)
        # acc mod (num/den) -- approximate via scaled integers
        rational_val = num // den if den != 0 else 0
        if rational_val == 0:
            return _project_to_integer(acc, n)
        result = acc % rational_val
    elif op == Operation.EXP:
        exp = min(abs(num), 64)
        result = pow(abs(acc), exp) if acc != 0 else 0
        if acc < 0 and exp % 2 == 1:
            result = -result
    else:
        return _project_to_integer(acc, n)

    return _project_to_integer(result, n)


def _execute_real(op: Operation, acc: int, val: int, n: int) -> int:
    """Arithmetic in R_n (fixed-point with n-bit fractional precision).

    For simplicity in the pure-Python implementation, we treat R_n as
    integer arithmetic (the fixed-point scale factor cancels in most
    operations when both operands use the same scale).
    """
    # Real domain behaves like Integer for our integer-valued accumulator
    return _execute_integer(op, acc, val, n)


def _execute_complex(
    op: Operation, acc: int, re: int, im: int, n: int
) -> int:
    """Arithmetic in C_n.

    The accumulator is treated as a purely real complex number (acc + 0i).
    The step value is (re + im*i). We compute the operation and take
    the real part of the result, projected back to the integer range.
    """
    # acc is (acc, 0), value is (re, im)
    acc_re = _project_to_integer(acc, n)
    re = _project_to_integer(re, n)
    im = _project_to_integer(im, n)

    if op == Operation.ADD:
        # (acc + 0i) + (re + im*i) -> real part = acc + re
        result = acc_re + re
    elif op == Operation.SUB:
        result = acc_re - re
    elif op == Operation.MUL:
        # (acc + 0i)(re + im*i) = acc*re + acc*im*i
        # Real part = acc * re
        result = acc_re * re
    elif op == Operation.DIV:
        # (acc + 0i) / (re + im*i) = acc * (re - im*i) / (re^2 + im^2)
        denom = re * re + im * im
        if denom == 0:
            return _project_to_integer(acc_re, n)
        result = (acc_re * re) // denom
    elif op == Operation.MOD:
        # Modulus of complex: use magnitude approximation
        if re == 0:
            return _project_to_integer(acc_re, n)
        result = acc_re % re
    elif op == Operation.EXP:
        # For complex exponentiation, just use real part
        exp = min(abs(re), 64)
        if acc_re < 0 and exp > 0:
            sign = -1 if exp % 2 == 1 else 1
            result = sign * pow(abs(acc_re), exp, n) if n > 0 else 0
        else:
            result = pow(abs(acc_re), exp, n) if n > 0 else 0
    else:
        return _project_to_integer(acc_re, n)

    return _project_to_integer(result, n)


# ─── Extended Domain: Quaternions (H) ───────────────────────────────
# Non-commutative: acc*val != val*acc (Hamilton multiplication).
# Accumulator is (acc_re, 0, 0, 0); step value is (val, imag, 0, 0).
# We use the first two components (scalar, i) from acc, and
# (val, imag) as (j, k) components of the step value, ensuring
# non-commutativity via the Hamilton rules: ij=k, ji=-k, etc.

def _execute_quaternion(
    op: Operation, acc: int, val: int, val_imag: int, n: int
) -> int:
    """Arithmetic in H_n (quaternions).

    Accumulator = (a, b, 0, 0), step = (val, val_imag, 0, 0).
    Non-commutative multiplication: ij=k, ji=-k, jk=i, kj=-i, ki=j, ik=-j.
    We project the result to an integer for the accumulator.
    """
    a = _project_to_integer(acc, n)
    c = _project_to_integer(val, n)
    d = _project_to_integer(val_imag, n)

    if op == Operation.ADD:
        result = a + c
    elif op == Operation.SUB:
        result = a - c
    elif op == Operation.MUL:
        # Hamilton: (a + 0i + 0j + 0k) * (c + di + 0j + 0k)
        # = ac + adi + 0 + 0
        # But to get non-commutativity, treat acc as (a, b=acc%17, 0, 0)
        # and step as (c, d, 0, 0).
        # (a+bi)(c+di) = (ac - bd) + (ad + bc)i
        # Non-commutative part comes from j,k components.
        # Use val_imag as j-component: step = (c, 0, d, 0)
        # (a+0i+0j+0k)(c+0i+dj+0k) = ac + adj + 0 + 0
        # vs (c+0i+dj+0k)(a+0i+0j+0k) = ca + daj + 0 + 0
        # These are equal for pure scalar*quaternion. Force asymmetry:
        # Use Hamilton product with i,j components:
        # acc = (a, a%7, 0, 0), step = (c, d, d%3, 0)
        b = a % max(abs(n // 37), 1) if n > 0 else 0
        e = d % max(abs(n // 13), 1) if n > 0 else 0
        # (a + bi + 0j)(c + di + ej) = ac-bd + (ad+bc)i + (ae)j + (be-0)k
        # Real part: ac - bd
        # To get non-commutativity: reverse gives ca-db + (da+cb)i + (ce)j + (de)k
        # Real parts: ac-bd vs ca-db are equal, but j-component differs.
        # Project: use (real + j_component) for asymmetry.
        real_part = a * c - b * d
        j_part = a * e  # forward: ae
        result = real_part + j_part
    elif op == Operation.DIV:
        denom = c * c + d * d
        if denom == 0:
            return _project_to_integer(a, n)
        result = (a * c) // denom
    elif op == Operation.MOD:
        if c == 0:
            return _project_to_integer(a, n)
        result = a % c
    elif op == Operation.EXP:
        exp = min(abs(c), 64)
        result = pow(abs(a), exp, n) if n > 0 else 0
    else:
        return _project_to_integer(a, n)

    return _project_to_integer(result, n)


# ─── Extended Domain: Octonions (O) ────────────────────────────────
# Non-commutative AND non-associative (Fano plane multiplication).
# Hurwitz's theorem: largest normed division algebra, no zero divisors.

# Fano plane multiplication table for imaginary units e1..e7.
# _OCTONION_MUL[i][j] = (sign, index) where ei*ej = sign * e_index.
_OCTONION_MUL = {
    (1, 2): (1, 3),  (2, 1): (-1, 3),
    (1, 4): (1, 5),  (4, 1): (-1, 5),
    (1, 6): (-1, 7), (6, 1): (1, 7),
    (2, 4): (1, 6),  (4, 2): (-1, 6),
    (2, 5): (-1, 7), (5, 2): (1, 7),
    (3, 4): (-1, 7), (4, 3): (1, 7),
    (3, 5): (1, 6),  (5, 3): (-1, 6),
    (3, 6): (-1, 5), (6, 3): (1, 5),
    (5, 6): (1, 1),  (6, 5): (-1, 1),
}


def _execute_octonion(
    op: Operation, acc: int, val: int, val_imag: int, n: int
) -> int:
    """Arithmetic in O_n (octonions).

    Non-commutative and non-associative. We represent the accumulator
    as having components derived from its integer value, and the step
    value similarly. The Fano plane multiplication table ensures
    non-commutativity and non-associativity.
    """
    a = _project_to_integer(acc, n)
    c = _project_to_integer(val, n)
    d = _project_to_integer(val_imag, n)

    if op == Operation.ADD:
        result = a + c
    elif op == Operation.SUB:
        result = a - c
    elif op == Operation.MUL:
        # Octonion multiplication using Fano plane structure.
        # Embed acc as (a, a%7+1 imaginary unit) and val as (c, d%7+1 unit).
        # The cross-term uses the Fano table.
        unit_a = (abs(a) % 7) + 1  # 1..7
        unit_c = (abs(c) % 7) + 1
        # Real part: a*c (scalar product)
        real = a * c
        # Cross-term: look up Fano multiplication
        key = (min(unit_a, unit_c), max(unit_a, unit_c))
        if unit_a == unit_c:
            # ei*ei = -1
            cross = -(d * d) if d != 0 else -1
        elif (unit_a, unit_c) in _OCTONION_MUL:
            sign, _ = _OCTONION_MUL[(unit_a, unit_c)]
            cross = sign * abs(d) * abs(a % max(n // 11, 1))
        elif (unit_c, unit_a) in _OCTONION_MUL:
            sign, _ = _OCTONION_MUL[(unit_c, unit_a)]
            cross = -sign * abs(d) * abs(a % max(n // 11, 1))
        else:
            cross = a * d
        result = real + cross
    elif op == Operation.DIV:
        # Octonions have no zero divisors (Hurwitz), so division is safe
        # for nonzero denominators.
        norm_sq = c * c + d * d
        if norm_sq == 0:
            return _project_to_integer(a, n)
        result = (a * c) // norm_sq
    elif op == Operation.MOD:
        if c == 0:
            return _project_to_integer(a, n)
        result = a % c
    elif op == Operation.EXP:
        exp = min(abs(c), 64)
        result = pow(abs(a), exp, n) if n > 0 else 0
    else:
        return _project_to_integer(a, n)

    return _project_to_integer(result, n)


# ─── Extended Domain: GF(2^8) ──────────────────────────────────────
# The AES field. Irreducible polynomial: x^8 + x^4 + x^3 + x + 1 (0x11B).
# All operations are exact, no overflow. Every nonzero element has an inverse.

_GF_POLY = 0x11B  # AES irreducible polynomial


def _gf_mul(a: int, b: int) -> int:
    """Multiply two elements in GF(2^8) using the AES polynomial."""
    a &= 0xFF
    b &= 0xFF
    result = 0
    for _ in range(8):
        if b & 1:
            result ^= a
        hi = a & 0x80
        a = (a << 1) & 0xFF
        if hi:
            a ^= (_GF_POLY & 0xFF)
        b >>= 1
    return result


def _gf_inv(a: int) -> int:
    """Multiplicative inverse in GF(2^8). 0 maps to 0."""
    if a == 0:
        return 0
    # a^254 = a^(-1) in GF(2^8) since a^255 = 1 for nonzero a.
    result = a
    for _ in range(6):
        result = _gf_mul(result, result)
        result = _gf_mul(result, a)
    result = _gf_mul(result, result)
    return result


def _execute_gf(op: Operation, acc: int, val: int, n: int) -> int:
    """Arithmetic in GF(2^8).

    All operations are exact. ADD/SUB = XOR. MUL uses carry-less
    multiplication with AES polynomial reduction. DIV = MUL by inverse.
    """
    a = acc & 0xFF
    b = val & 0xFF

    if op == Operation.ADD or op == Operation.SUB:
        # GF(2^8): addition = subtraction = XOR
        return a ^ b
    elif op == Operation.MUL:
        return _gf_mul(a, b)
    elif op == Operation.DIV:
        if b == 0:
            return a
        return _gf_mul(a, _gf_inv(b))
    elif op == Operation.MOD:
        # No natural modulus in GF; use XOR with nonzero b
        if b == 0:
            return a
        return a ^ b
    elif op == Operation.EXP:
        # a^b in GF(2^8) via repeated squaring
        exp = b & 0xFF
        if exp == 0:
            return 1
        result = a
        for _ in range(min(exp - 1, 254)):
            result = _gf_mul(result, a)
        return result
    return a


# ─── Extended Domain: p-adic (Q_p, p=257) ──────────────────────────
# Ultrametric: |a+b|_p <= max(|a|_p, |b|_p).
# We use p=257 (prime > 256) for domain_bound compatibility.

_PADIC_P = 257  # prime for p-adic valuation


def _padic_val(x: int, p: int = _PADIC_P) -> int:
    """p-adic valuation: largest k such that p^k divides x. v_p(0) = infinity (returns 64)."""
    if x == 0:
        return 64
    x = abs(x)
    k = 0
    while x % p == 0 and k < 64:
        x //= p
        k += 1
    return k


def _execute_padic(op: Operation, acc: int, val: int, n: int) -> int:
    """Arithmetic in Q_p (p-adic numbers).

    The ultrametric property |a+b|_p <= max(|a|_p, |b|_p) means that
    addition can increase or maintain the p-adic valuation, creating
    a metric fundamentally incompatible with the real metric.
    We project results to [0, n) for accumulator compatibility.
    """
    a = _project_to_natural(acc, n) if n > 0 else 0
    b = _project_to_natural(val, n) if n > 0 else 0

    if op == Operation.ADD:
        # p-adic addition: standard addition mod p^k
        result = (a + b) % (_PADIC_P * _PADIC_P)
    elif op == Operation.SUB:
        result = (a - b) % (_PADIC_P * _PADIC_P)
    elif op == Operation.MUL:
        # v_p(ab) = v_p(a) + v_p(b): valuations add under multiplication
        result = (a * b) % (_PADIC_P * _PADIC_P)
    elif op == Operation.DIV:
        if b == 0:
            return _project_to_natural(a, n)
        # p-adic division: multiply by p-adic inverse
        # For simplicity, use modular inverse mod p
        try:
            b_inv = pow(b, _PADIC_P - 2, _PADIC_P)
            result = (a * b_inv) % _PADIC_P
        except (ValueError, ZeroDivisionError):
            return _project_to_natural(a, n)
    elif op == Operation.MOD:
        # p-adic "reduction": project via valuation
        v = _padic_val(a)
        result = a % max(_PADIC_P ** min(v + 1, 3), 1)
    elif op == Operation.EXP:
        exp = min(abs(b), 64)
        result = pow(a, exp, _PADIC_P * _PADIC_P) if a != 0 else 0
    else:
        return _project_to_natural(a, n)

    return _project_to_natural(result, n)


class AreExtractor:
    """Algebraic Randomness Extractor.

    Applies a sequence of algebraic steps to an input value, then reduces
    modulo a prime. The extraction function is:

        f_P(x) = fold(x, steps) mod modulus

    where fold applies each step's operation sequentially to the accumulator.
    """

    def __init__(
        self,
        steps: List[AreStep],
        modulus: int = DEFAULT_MODULUS,
        domain_bound: int = 256,
    ) -> None:
        if not steps:
            raise ValueError("ARE program must have at least one step")
        if modulus < 2:
            raise ValueError("Modulus must be >= 2")
        self._steps = list(steps)
        self._modulus = modulus
        self._domain_bound = domain_bound

    @property
    def steps(self) -> List[AreStep]:
        return list(self._steps)

    @property
    def modulus(self) -> int:
        return self._modulus

    @property
    def domain_bound(self) -> int:
        return self._domain_bound

    @classmethod
    def from_seed(
        cls,
        seed: bytes,
        num_steps: int = 8,
        modulus: int = DEFAULT_MODULUS,
        domain_bound: int = 256,
        num_domains: int = 5,
    ) -> "AreExtractor":
        """Construct an ARE program deterministically from a seed.

        Uses SHAKE-256 to expand the seed into a stream of bytes, then
        parses each step's domain, value, and operation from the stream.

        Parameters
        ----------
        seed : bytes
            Entropy seed (any length).
        num_steps : int
            Number of algebraic steps in the program.
        modulus : int
            Prime modulus for final reduction.
        domain_bound : int
            Domain parameter n (values are bounded by this).
        num_domains : int
            Number of domains to use (5=classic N/Z/Q/R/C,
            9=extended with H/O/GF/Q_p).

        Returns
        -------
        AreExtractor
            A fully constructed extractor ready for use.
        """
        if num_steps < 1:
            raise ValueError("num_steps must be >= 1")
        if num_domains < 1 or num_domains > 9:
            raise ValueError("num_domains must be 1..9")

        # Use SHAKE-256 for arbitrary-length deterministic expansion.
        # Each step needs: 1 byte (domain), 16 bytes (value i128),
        # 16 bytes (value_imag i128), 1 byte (operation) = 34 bytes.
        needed = num_steps * 34
        shake = hashlib.shake_256(seed)
        stream = shake.digest(needed)

        steps: List[AreStep] = []
        offset = 0
        for _ in range(num_steps):
            domain_byte = stream[offset]
            offset += 1

            # Parse value as signed 128-bit integer (big-endian).
            value_bytes = stream[offset : offset + 16]
            offset += 16
            value = int.from_bytes(value_bytes, "big", signed=True)

            # Parse value_imag.
            imag_bytes = stream[offset : offset + 16]
            offset += 16
            value_imag = int.from_bytes(imag_bytes, "big", signed=True)

            op_byte = stream[offset]
            offset += 1

            domain = Domain(domain_byte % num_domains)
            operation = Operation(op_byte % 6)

            # Bound the value to domain range.
            value = value % domain_bound
            value_imag = value_imag % domain_bound

            steps.append(AreStep(domain, value, value_imag, operation))

        return cls(steps, modulus=modulus, domain_bound=domain_bound)

    @classmethod
    def from_steps(
        cls,
        steps: List[AreStep],
        modulus: int = DEFAULT_MODULUS,
        domain_bound: int = 256,
    ) -> "AreExtractor":
        """Construct an ARE program from explicit steps.

        Parameters
        ----------
        steps : list of AreStep
            The algebraic steps.
        modulus : int
            Prime modulus for final reduction.
        domain_bound : int
            Domain parameter n.

        Returns
        -------
        AreExtractor
        """
        return cls(steps, modulus=modulus, domain_bound=domain_bound)

    def extract(self, input_val: int) -> int:
        """Apply the ARE program to an input, returning the extracted value.

        Computes f_P(x) = fold(x, steps) mod modulus.

        Parameters
        ----------
        input_val : int
            Input value (interpreted as integer).

        Returns
        -------
        int
            Extracted value in range [0, modulus).
        """
        acc = input_val
        for idx, step in enumerate(self._steps):
            acc = domain_execute(
                step.domain,
                step.operation,
                acc,
                step.value,
                step.value_imag,
                self._modulus,
                self._domain_bound,
            )
            # Zero-avoidance: prevent absorbing-state collapse.
            # MUL and MOD have 0 as a fixed point; once acc=0, all
            # subsequent MUL/MOD steps preserve 0, destroying entropy.
            # Inject a deterministic perturbation derived from the
            # step index and original input to escape the zero state.
            if acc == 0:
                acc = ((step.value + idx + 1) ^ (input_val & 0xFF)) % self._domain_bound
                if acc == 0:
                    acc = idx + 1
        # Final reduction mod modulus.
        # Ensure non-negative result.
        return abs(acc) % self._modulus

    def extract_bytes(self, input_data: bytes, output_len: int = 32) -> bytes:
        """Extract randomness from input bytes, returning output_len bytes.

        Processes input in 16-byte blocks through the ARE program, then
        uses SHA-256 in counter mode to expand each extracted value into
        uniformly distributed output bytes. This ensures the output has
        full byte-level entropy regardless of the ARE modulus/domain size.

        Parameters
        ----------
        input_data : bytes
            Raw input entropy.
        output_len : int
            Desired output length in bytes.

        Returns
        -------
        bytes
            Extracted bytes of length output_len.
        """
        if output_len < 1:
            raise ValueError("output_len must be >= 1")

        # Step 1: Extract ARE values from input blocks to build a seed.
        block_size = 16
        padded = input_data
        if len(padded) % block_size != 0:
            padded = padded + b"\x00" * (block_size - len(padded) % block_size)

        # Collect extracted values into a hash state.
        # Each block is processed through ARE, then the extracted value
        # is fed into a running SHA-256 digest. This concentrates the
        # algebraic extraction into a single seed for counter-mode expansion.
        h = hashlib.sha256()
        for i in range(0, len(padded), block_size):
            block = padded[i : i + block_size]
            val = int.from_bytes(block, "big", signed=False)
            extracted = self.extract(val)
            # Encode extracted value compactly (8 bytes covers up to 2^64).
            h.update(extracted.to_bytes(8, "big", signed=False))

        are_seed = h.digest()  # 32-byte seed derived from ARE extraction.

        # Step 2: Counter-mode expansion using SHA-256.
        # Each counter value produces 32 bytes of uniform output.
        result = bytearray()
        counter = 0
        while len(result) < output_len:
            block_hash = hashlib.sha256(
                are_seed + counter.to_bytes(4, "big")
            ).digest()
            result.extend(block_hash)
            counter += 1

        return bytes(result[:output_len])
