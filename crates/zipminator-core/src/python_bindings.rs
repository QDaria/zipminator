//! Python bindings for Zipminator PQC using PyO3
//!
//! Exposes the CRYSTALS-Kyber-768 implementation to Python with
//! high-performance Rust implementation under the hood.

use pyo3::prelude::*;
use pyo3::exceptions::PyValueError;
use pyo3::types::PyBytes;
use crate::kyber768::{Kyber768, PublicKey, SecretKey, Ciphertext};

/// Python wrapper for PublicKey
#[pyclass(name = "PublicKey")]
#[derive(Clone)]
pub struct PyPublicKey {
    inner: PublicKey,
}

#[pymethods]
impl PyPublicKey {
    /// Create PublicKey from bytes
    #[staticmethod]
    fn from_bytes(data: &[u8]) -> PyResult<Self> {
        PublicKey::from_bytes(data)
            .map(|inner| PyPublicKey { inner })
            .map_err(|e| PyValueError::new_err(e))
    }

    /// Get public key as bytes
    fn to_bytes(&self, py: Python) -> PyObject {
        PyBytes::new(py, &self.inner.data).into()
    }

    /// Get size of public key
    #[getter]
    fn size(&self) -> usize {
        self.inner.data.len()
    }

    fn __repr__(&self) -> String {
        format!("PublicKey({} bytes)", self.inner.data.len())
    }
}

/// Python wrapper for SecretKey
#[pyclass(name = "SecretKey")]
#[derive(Clone)]
pub struct PySecretKey {
    inner: SecretKey,
}

#[pymethods]
impl PySecretKey {
    /// Create SecretKey from bytes
    #[staticmethod]
    fn from_bytes(data: &[u8]) -> PyResult<Self> {
        SecretKey::from_bytes(data)
            .map(|inner| PySecretKey { inner })
            .map_err(|e| PyValueError::new_err(e))
    }

    /// Get secret key as bytes
    fn to_bytes(&self, py: Python) -> PyObject {
        PyBytes::new(py, self.inner.as_bytes()).into()
    }

    /// Get size of secret key
    #[getter]
    fn size(&self) -> usize {
        self.inner.len()
    }

    fn __repr__(&self) -> String {
        format!("SecretKey({} bytes)", self.inner.len())
    }
}

/// Python wrapper for Ciphertext
#[pyclass(name = "Ciphertext")]
#[derive(Clone)]
pub struct PyCiphertext {
    inner: Ciphertext,
}

#[pymethods]
impl PyCiphertext {
    /// Create Ciphertext from bytes
    #[staticmethod]
    fn from_bytes(data: &[u8]) -> PyResult<Self> {
        Ciphertext::from_bytes(data)
            .map(|inner| PyCiphertext { inner })
            .map_err(|e| PyValueError::new_err(e))
    }

    /// Get ciphertext as bytes
    fn to_bytes(&self, py: Python) -> PyObject {
        PyBytes::new(py, &self.inner.data).into()
    }

    /// Get size of ciphertext
    #[getter]
    fn size(&self) -> usize {
        self.inner.data.len()
    }

    fn __repr__(&self) -> String {
        format!("Ciphertext({} bytes)", self.inner.data.len())
    }
}

/// Generate a CRYSTALS-Kyber-768 keypair
///
/// Returns:
///     tuple: (PublicKey, SecretKey)
///
/// Example:
///     >>> from zipminator import keypair
///     >>> pk, sk = keypair()
///     >>> print(pk.size)
///     1184
#[pyfunction]
fn keypair() -> (PyPublicKey, PySecretKey) {
    let (pk, sk) = Kyber768::keypair();
    (
        PyPublicKey { inner: pk },
        PySecretKey { inner: sk },
    )
}

/// Generate a keypair from a seed (deterministic)
///
/// Args:
///     seed (bytes): 32-byte seed for deterministic key generation
///
/// Returns:
///     tuple: (PublicKey, SecretKey)
///
/// Example:
///     >>> from zipminator import keypair_from_seed
///     >>> seed = b'0' * 32
///     >>> pk, sk = keypair_from_seed(seed)
#[pyfunction]
fn keypair_from_seed(seed: &[u8]) -> PyResult<(PyPublicKey, PySecretKey)> {
    if seed.len() != 32 {
        return Err(PyValueError::new_err("Seed must be exactly 32 bytes"));
    }
    let mut seed_array = [0u8; 32];
    seed_array.copy_from_slice(seed);
    let (pk, sk) = Kyber768::keypair_from_seed(&seed_array);
    Ok((
        PyPublicKey { inner: pk },
        PySecretKey { inner: sk },
    ))
}

/// Encapsulate a shared secret using a public key
///
/// Args:
///     pk (PublicKey): The public key to encapsulate with
///
/// Returns:
///     tuple: (Ciphertext, bytes) - ciphertext and 32-byte shared secret
///
/// Example:
///     >>> from zipminator import keypair, encapsulate
///     >>> pk, sk = keypair()
///     >>> ct, ss = encapsulate(pk)
///     >>> len(ss)
///     32
#[pyfunction]
fn encapsulate(pk: &PyPublicKey, py: Python) -> (PyCiphertext, PyObject) {
    let (ct, ss) = Kyber768::encapsulate(&pk.inner);
    (
        PyCiphertext { inner: ct },
        PyBytes::new(py, &ss.data).into(),
    )
}

/// Encapsulate with provided randomness (for testing/deterministic operations)
///
/// Args:
///     pk (PublicKey): The public key to encapsulate with
///     coins (bytes): 32-byte randomness seed
///
/// Returns:
///     tuple: (Ciphertext, bytes) - ciphertext and 32-byte shared secret
#[pyfunction]
fn encapsulate_with_coins(pk: &PyPublicKey, coins: &[u8], py: Python) -> PyResult<(PyCiphertext, PyObject)> {
    if coins.len() != 32 {
        return Err(PyValueError::new_err("Coins must be exactly 32 bytes"));
    }
    let mut coins_array = [0u8; 32];
    coins_array.copy_from_slice(coins);
    let (ct, ss) = Kyber768::encapsulate_with_coins(&pk.inner, &coins_array);
    Ok((
        PyCiphertext { inner: ct },
        PyBytes::new(py, &ss.data).into(),
    ))
}

/// Decapsulate a ciphertext to recover the shared secret
///
/// Args:
///     ct (Ciphertext): The ciphertext to decapsulate
///     sk (SecretKey): The secret key
///
/// Returns:
///     bytes: 32-byte shared secret
///
/// Example:
///     >>> from zipminator import keypair, encapsulate, decapsulate
///     >>> pk, sk = keypair()
///     >>> ct, ss1 = encapsulate(pk)
///     >>> ss2 = decapsulate(ct, sk)
///     >>> ss1 == ss2
///     True
#[pyfunction]
fn decapsulate(ct: &PyCiphertext, sk: &PySecretKey, py: Python) -> PyObject {
    let ss = Kyber768::decapsulate(&ct.inner, &sk.inner);
    PyBytes::new(py, &ss.data).into()
}

/// Get the size constants for Kyber-768
///
/// Returns:
///     dict: Dictionary with size constants
#[pyfunction]
fn get_constants() -> PyResult<Py<PyAny>> {
    Python::with_gil(|py| {
        let dict = pyo3::types::PyDict::new(py);
        dict.set_item("public_key_bytes", crate::constants::KYBER768_PUBLICKEYBYTES)?;
        dict.set_item("secret_key_bytes", crate::constants::KYBER768_SECRETKEYBYTES)?;
        dict.set_item("ciphertext_bytes", crate::constants::KYBER768_CIPHERTEXTBYTES)?;
        dict.set_item("shared_secret_bytes", crate::constants::KYBER768_SHAREDSECRETBYTES)?;
        dict.set_item("kyber_k", crate::constants::KYBER_K)?;
        dict.set_item("kyber_n", crate::constants::KYBER_N)?;
        dict.set_item("kyber_q", crate::constants::KYBER_Q)?;
        Ok(dict.into())
    })
}

/// Initialize the Zipminator PQC Python module
#[pymodule]
fn _core(_py: Python, m: &PyModule) -> PyResult<()> {
    // Add version info
    m.add("__version__", env!("CARGO_PKG_VERSION"))?;
    m.add("__doc__", "CRYSTALS-Kyber-768 Post-Quantum Cryptography")?;

    // Add classes
    m.add_class::<PyPublicKey>()?;
    m.add_class::<PySecretKey>()?;
    m.add_class::<PyCiphertext>()?;

    // Add functions
    m.add_function(wrap_pyfunction!(keypair, m)?)?;
    m.add_function(wrap_pyfunction!(keypair_from_seed, m)?)?;
    m.add_function(wrap_pyfunction!(encapsulate, m)?)?;
    m.add_function(wrap_pyfunction!(encapsulate_with_coins, m)?)?;
    m.add_function(wrap_pyfunction!(decapsulate, m)?)?;
    m.add_function(wrap_pyfunction!(get_constants, m)?)?;

    Ok(())
}
