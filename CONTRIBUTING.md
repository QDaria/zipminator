# Contributing to Zipminator-PQC

Thank you for your interest in contributing to Zipminator-PQC! We welcome contributions from the community.

## 📋 Contributor License Agreement (CLA)

By contributing to this project, you agree that your contributions will be licensed under both:
1. **MIT License** (for the Community Edition)
2. **Commercial License** (for the Enterprise Edition)

This dual licensing allows us to:
- Keep the Community Edition open source and freely available
- Develop and maintain Enterprise features for commercial customers
- Sustain the project long-term

### What This Means

When you submit a pull request, you grant Zipminator-PQC:
1. A perpetual, worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your contributions
2. The right to sublicense your contributions under commercial terms in the Enterprise Edition
3. You certify that you have the right to make this contribution

This is standard practice for open-core projects (similar to GitLab, MongoDB, Elastic).

## 🤝 How to Contribute

### Areas We Welcome Contributions

**Core Cryptography:**
- Performance optimizations (SIMD, AVX2)
- Additional PQC algorithms (Dilithium, Falcon)
- Constant-time validation improvements
- Test coverage expansion

**Quantum Entropy:**
- Additional provider integrations
- Optimization algorithms
- Quality testing and validation

**Documentation:**
- Tutorial improvements
- Code examples
- Translation to other languages
- Use case documentation

**Testing:**
- Unit tests
- Integration tests
- Benchmark improvements
- Security audits

**Bug Fixes:**
- Security vulnerabilities (see SECURITY.md)
- Performance issues
- Correctness bugs
- Documentation errors

### What's NOT in Scope for Community Contributions

The following features are part of the Enterprise Edition and developed internally:
- HSM integration modules
- SSO/RBAC implementation
- Multi-tenancy architecture
- Cloud KMS integrations
- FIPS 140-3 validation work

## 🚀 Getting Started

### 1. Fork the Repository

Click the "Fork" button at the top right of this page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/zipminator-pqc.git
cd zipminator-pqc
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Make Your Changes

Follow our coding standards:
- **Rust**: Run `cargo fmt` and `cargo clippy`
- **Python**: Follow PEP 8, use `black` for formatting
- **Tests**: Add tests for new functionality
- **Documentation**: Update relevant docs

### 5. Test Your Changes

```bash
# Rust tests
cd src/rust
cargo test --release

# Python tests
pytest tests/

# Demo tests
cd demo
./test_demo.sh
```

### 6. Commit Your Changes

```bash
git add .
git commit -m "feat: Add your feature description"
```

Use conventional commit format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions or changes
- `perf:` Performance improvements
- `refactor:` Code refactoring

### 7. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 8. Open a Pull Request

Go to the original repository and click "New Pull Request".

**Pull Request Guidelines:**
- Provide a clear description of the changes
- Reference any related issues
- Ensure all tests pass
- Update documentation if needed
- Be responsive to review feedback

## 📏 Code Standards

### Rust

```rust
// Use descriptive variable names
let public_key = kyber768::generate_public_key();

// Add doc comments for public APIs
/// Generates a Kyber768 key pair with quantum entropy
pub fn keypair() -> (PublicKey, SecretKey) {
    // Implementation
}

// Prefer explicit error handling
let result = operation().map_err(|e| Error::OperationFailed(e))?;
```

### Python

```python
# Use type hints
def harvest_entropy(num_bytes: int) -> bytes:
    """Harvest quantum entropy from IBM Quantum.

    Args:
        num_bytes: Number of random bytes to generate

    Returns:
        Quantum random bytes

    Raises:
        QuantumError: If entropy generation fails
    """
    pass

# Follow PEP 8
# Use descriptive names
# Add docstrings to all public functions
```

## 🔒 Security

If you discover a security vulnerability, please see [SECURITY.md](SECURITY.md) for responsible disclosure procedures.

**DO NOT** open a public issue for security vulnerabilities.

## 📝 License

By contributing, you agree that your contributions will be licensed under:
- MIT License (Community Edition)
- Commercial License (Enterprise Edition)

See [LICENSE](LICENSE) for details.

## 💬 Community

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Email**: opensource@zipminator.io

## 🎉 Recognition

Contributors will be recognized in:
- GitHub contributors page
- CONTRIBUTORS.md file
- Release notes (for significant contributions)

Thank you for helping make quantum-secure cryptography accessible to everyone!
