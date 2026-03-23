# Algebraic Randomness Extraction: Formal Specification

**Version:** 0.1.0-draft
**Date:** 2026-03-23
**Authors:** Mo Houshmand (QDaria AS)
**Status:** Working draft for CHE Framework (Task 5)

---

## 1. Introduction

Algebraic Randomness Extraction (ARE) is a new family of seeded randomness extractors. Unlike Toeplitz-matrix or trevisan extractors that require large seed-to-output ratios, ARE programs encode the seed as a short sequence of algebraic instructions over bounded number domains. The extractor applies these instructions to the input, producing uniformly distributed output.

ARE is designed for the Certified Heterogeneous Entropy (CHE) framework as Layer 2 post-processing: raw entropy from multiple sources (QRNG, WiFi CSI, OS) is composed at Layer 1, then passed through ARE to produce cryptographically clean output with provable min-entropy guarantees.

---

## 2. Number Domains

We define five bounded number domains, each parameterized by a bound `n >= 2`:

| Symbol | Name | Definition | Cardinality |
|--------|------|-----------|-------------|
| N_n | Bounded naturals | {0, 1, ..., n-1} | n |
| Z_n | Bounded integers | {-(n-1), -(n-2), ..., -1, 0, 1, ..., n-1} | 2n - 1 |
| Q_n | Bounded rationals | {a/b : a,b in Z_n, b != 0} | (2n-1)(2n-2) |
| R_n | Bounded reals | Fixed-point: integer part in Z_n, n fractional bits | 2^n * (2n-1) |
| C_n | Bounded complex | {a + bi : a,b in R_n} | |R_n|^2 |

For the initial implementation, we use `n = 2^16 = 65536`, giving N_n cardinality 65536 and Z_n cardinality 131071. This is sufficient for 128-bit security with programs of length k >= 8.

### 2.1 Domain Encoding

All domain values are encoded as `(i128, i128)` pairs where:
- **N_n**: `(v, 0)` with `0 <= v < n`
- **Z_n**: `(v, 0)` with `-(n-1) <= v <= n-1`
- **Q_n**: `(numerator, denominator)` with denominator != 0 (stored as `(value, value_imag)` in the implementation, reinterpreting `value_imag` as denominator)
- **R_n**: `(fixed_point_value, 0)` where the value is scaled by `2^n`
- **C_n**: `(real_part, imag_part)` both as R_n fixed-point values

---

## 3. Operations

Six arithmetic operations form the instruction set:

| Op | Symbol | Definition | Division-by-zero rule |
|----|--------|-----------|----------------------|
| Add | + | a + b | N/A |
| Sub | - | a - b | N/A |
| Mul | * | a * b | N/A |
| Div | / | a / b | If b = 0, return a (identity) |
| Mod | % | a mod b | If b = 0, return a (identity) |
| Exp | ^ | a^b mod m | Restricted to N_n, Z_n; b clamped to [0, 64] |

All operations are performed within the domain's bounded range. Overflow wraps modulo the domain bound (for N_n and Z_n) or saturates (for R_n and C_n).

---

## 4. ARE Program

### 4.1 Definition

An **ARE program** P of length k is a pair:

```
P = (steps, p)
```

where:
- `steps = [(d_1, v_1, op_1), (d_2, v_2, op_2), ..., (d_k, v_k, op_k)]`
  - `d_i in {Natural, Integer, Rational, Real, Complex}` (5 choices)
  - `v_i` is a value in domain `d_i` (up to `n` choices, domain-dependent)
  - `op_i in {Add, Sub, Mul, Div, Mod, Exp}` (6 choices)
- `p` is a prime modulus for final reduction

### 4.2 Extraction Function

Given input `x` (interpreted as a 128-bit unsigned integer) and program P:

```
f_P(x) = reduce(fold(x, steps), p)
```

where:

```
fold(x, []) = x
fold(x, [(d, v, op)] ++ rest) = fold(apply(x, d, v, op), rest)
```

and `apply(acc, d, v, op)` performs:
1. Project `acc` into domain `d` (modular reduction or reinterpretation)
2. Compute `result = op(acc_d, v)` within domain `d`
3. Lift `result` back to i128 representation

The final reduction is: `reduce(acc, p) = acc mod p` (unsigned).

### 4.3 Seed Cost Analysis

Each step of an ARE program encodes:
- Domain selector: ceil(log2(5)) = 3 bits
- Value in domain: ceil(log2(n)) bits (e.g., 16 bits for n = 65536)
- Operation selector: ceil(log2(6)) = 3 bits

**Bits per step:** 3 + ceil(log2(n)) + 3 = 6 + ceil(log2(n))

For n = 65536 (16-bit bound): **22 bits per step**.

**Total seed cost for k steps:** k * (6 + ceil(log2(n))) bits, plus ceil(log2(p)) bits for the modulus.

For a typical program with k = 8, n = 65536, and a 128-bit modulus:
- Seed = 8 * 22 + 128 = **304 bits (38 bytes)**

Compare with Toeplitz matrix extractor for the same parameters (128-bit input to 128-bit output): seed = 128 + 128 - 1 = 255 bits. ARE uses ~19% more seed but supports richer algebraic structure, enabling stronger epsilon bounds for high min-entropy sources.

---

## 5. Test Vectors

All test vectors use `n = 256` (8-bit domain bound) and modulus `p = 257` (smallest prime > 256) for readability. Real deployments use n = 65536 and a 128-bit prime.

### Vector 1: Single-step Natural addition

```
Input:  x = 42
Program: [(Natural, 10, Add)], p = 257
Trace:  fold(42, [(N, 10, Add)]) = 42 + 10 = 52
Output: 52 mod 257 = 52
```

### Vector 2: Two-step Integer multiply-then-subtract

```
Input:  x = 100
Program: [(Integer, 3, Mul), (Integer, 50, Sub)], p = 257
Trace:  fold(100, ...) = (100 * 3) - 50 = 300 - 50 = 250
Output: 250 mod 257 = 250
```

### Vector 3: Division by zero (identity rule)

```
Input:  x = 77
Program: [(Natural, 0, Div), (Natural, 5, Add)], p = 257
Trace:  fold(77, ...) = div(77, 0) = 77 (identity), then 77 + 5 = 82
Output: 82 mod 257 = 82
```

### Vector 4: Modular reduction overflow

```
Input:  x = 200
Program: [(Natural, 200, Add), (Natural, 3, Mul)], p = 257
Trace:  fold(200, ...) = (200 + 200) mod 256 = 144, then 144 * 3 = 432 mod 256 = 176
         (Natural domain wraps at n=256)
Output: 176 mod 257 = 176
```

### Vector 5: Mixed-domain program

```
Input:  x = 50
Program: [(Natural, 7, Mul), (Integer, -20, Add), (Natural, 13, Mod)], p = 257
Trace:  step 1: 50 * 7 = 350 mod 256 = 94 (Natural wraps)
         step 2: project 94 to Z_256, then 94 + (-20) = 74
         step 3: project 74 to N_256, then 74 mod 13 = 9
Output: 9 mod 257 = 9
```

### Vector 6: Exponentiation

```
Input:  x = 2
Program: [(Natural, 10, Exp)], p = 257
Trace:  2^10 = 1024 mod 256 = 0 (Natural wraps)
Output: 0 mod 257 = 0
```

### Vector 7: Multi-step with large accumulator

```
Input:  x = 128
Program: [(Integer, 127, Add), (Natural, 2, Mul), (Integer, -1, Add)], p = 257
Trace:  step 1: project 128 to Z_256, then 128 + 127 = 255
         step 2: project 255 to N_256, then 255 * 2 = 510 mod 256 = 254
         step 3: project 254 to Z_256, then 254 + (-1) = 253
Output: 253 mod 257 = 253
```

### Vector 8: Chained multiplications (avalanche test)

```
Input:  x = 1
Program: [(Natural, 137, Mul), (Natural, 149, Mul), (Natural, 163, Mul), (Natural, 173, Mul)], p = 257
Trace:  step 1: 1 * 137 = 137
         step 2: 137 * 149 = 20413 mod 256 = 157
         step 3: 157 * 163 = 25591 mod 256 = 231
         step 4: 231 * 173 = 39963 mod 256 = 11
Output: 11 mod 257 = 11
```

---

## 6. Security Analysis: Epsilon-Universality

### 6.1 Connection to Carter-Wegman Hashing

An ARE program defines a hash function `h_s : {0,1}^m -> {0,1}^l` parameterized by seed `s`. We claim that the family {h_s} is epsilon-almost-universal for appropriate program parameters.

**Definition (epsilon-universal).** A family H of functions from X to Y is epsilon-universal if for all distinct x, x' in X:

```
Pr_{h <- H}[h(x) = h(x')] <= epsilon
```

### 6.2 Universality Argument Sketch

Consider a k-step ARE program over domain bound n with modulus p (prime).

**Case 1: Single multiplication step (k=1, Op=Mul).**
If v is chosen uniformly from Z_p*, then `h(x) = x * v mod p` is a universal hash function (collision probability = 1/p for distinct inputs). This is the classic Carter-Wegman construction.

**Case 2: General k-step program.**
Each step applies one of 6 operations with a random value. For multiplication and addition steps, the argument follows directly from polynomial hashing: a k-step program with at least one multiplication defines a degree-k polynomial over Z_p, and by the Schwartz-Zippel lemma, the collision probability is at most k/p.

For steps involving Div, Mod, or Exp, the analysis is more complex. We provide an upper bound:

**Theorem (informal).** For an ARE program of length k over domain bound n with prime modulus p, if at least one step uses Mul or Add with a value chosen uniformly from {1, ..., p-1}, then:

```
epsilon <= k / p
```

For k = 8 and p = 2^127 - 1 (a Mersenne prime): epsilon <= 8 / (2^127 - 1), which is approximately 2^{-124}. This exceeds the 2^{-128} target by a small margin; using k = 8 with a 128-bit prime gives epsilon < 2^{-121}, still well within cryptographic bounds.

### 6.3 Min-Entropy Extraction Guarantee

By the Leftover Hash Lemma, if the source X has min-entropy H_inf(X) >= m, then for an epsilon-universal family with output length l bits:

```
SD(h_s(X), U_l) <= 2^{-(m - l)/2} + epsilon
```

where SD is statistical distance and U_l is the uniform distribution on l bits.

For CHE Layer 2: if Layer 1 composition yields min-entropy >= 192 bits (from 256-bit inputs) and we extract 128-bit output with epsilon < 2^{-121}:

```
SD <= 2^{-(192-128)/2} + 2^{-121} = 2^{-32} + 2^{-121} ~ 2^{-32}
```

This is the dominant term; to achieve SD < 2^{-64}, we need H_inf(X) >= l + 128 = 256. The CHE compositor's health monitoring (Layer 1) ensures sufficient min-entropy before passing data to ARE.

### 6.4 Comparison with Existing Extractors

| Extractor | Seed size (128-bit output) | Operations | epsilon |
|-----------|---------------------------|------------|---------|
| Toeplitz matrix | 255 bits | Matrix-vector multiply | 2^{-128} |
| Trevisan | O(log^2 n) | Block design + bit extraction | 2^{-128} |
| ARE (k=8, n=2^16) | 304 bits | 8 arithmetic ops + mod | ~2^{-121} |
| ARE (k=12, n=2^16) | 392 bits | 12 arithmetic ops + mod | ~2^{-125} |

ARE trades slightly worse epsilon and seed cost for implementation simplicity and the ability to leverage diverse algebraic structure for defense-in-depth. The algebraic diversity (five domains, six operations) also makes the extractor harder to analyze for an adversary who does not know the seed, compared to a pure linear extractor.

---

## 7. Implementation Notes

### 7.1 Constant-Time Considerations

Division and modulus operations may leak timing information through data-dependent branches. The Rust implementation must:
- Use constant-time conditional selection for the division-by-zero identity rule
- Avoid variable-time modular exponentiation; use square-and-multiply with constant iteration count
- Consider using the `subtle` crate for conditional operations

### 7.2 Domain Projection

When the accumulator crosses domain boundaries (e.g., from Integer to Natural), projection uses:
- Z -> N: take absolute value, then reduce mod n
- N -> Z: identity (natural numbers are non-negative integers)
- Z -> Q: embed as v/1
- R -> Z: truncate fractional part
- C -> R: take the real part

### 7.3 Serialization

ARE programs must be serializable for:
- Provenance certificates (Layer 4): the program is stored alongside the entropy output
- Reproducibility: given the same seed, the same program must be regenerated
- Audit: third parties can verify extraction by replaying the program

The canonical serialization format is a byte sequence: `[k as u16-be] [step_1] [step_2] ... [step_k] [p as u128-be]` where each step is `[domain as u8] [value as i128-be] [value_imag as i128-be] [op as u8]`.

---

## 8. Future Work

- **Adaptive programs:** dynamically adjust program length based on measured source entropy
- **Parallel ARE:** apply multiple independent programs and XOR outputs for tighter epsilon bounds
- **Hardware acceleration:** the sequence of simple arithmetic operations maps naturally to SIMD/GPU
- **Formal verification:** machine-checked proof of epsilon-universality using Lean 4 or Coq
