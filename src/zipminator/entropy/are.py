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
    """The five classical number domains, bounded for computation."""

    NATURAL = 0   # N_n = {0, 1, ..., n-1}
    INTEGER = 1   # Z_n = {-(n-1), ..., n-1}
    RATIONAL = 2  # Q_n = {a/b : a,b in Z_n, b != 0}
    REAL = 3      # R_n = fixed-point with n bits of fractional precision
    COMPLEX = 4   # C_n = (a + bi) where a,b in R_n


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
    ) -> "AreExtractor":
        """Construct an ARE program deterministically from a seed.

        Uses SHAKE-256 to expand the seed into a stream of bytes, then
        parses each step's domain, value, and operation from the stream.
        This mirrors the Rust program generation logic.

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

        Returns
        -------
        AreExtractor
            A fully constructed extractor ready for use.
        """
        if num_steps < 1:
            raise ValueError("num_steps must be >= 1")

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

            domain = Domain(domain_byte % 5)
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
        for step in self._steps:
            acc = domain_execute(
                step.domain,
                step.operation,
                acc,
                step.value,
                step.value_imag,
                self._modulus,
                self._domain_bound,
            )
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
