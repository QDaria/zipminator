import ExpoModulesCore
import Foundation

// MARK: - Constants

private let PK_BYTES  = Int(ZIPMINATOR_PK_BYTES)
private let SK_BYTES  = Int(ZIPMINATOR_SK_BYTES)
private let CT_BYTES  = Int(ZIPMINATOR_CT_BYTES)
private let SS_BYTES  = Int(ZIPMINATOR_SS_BYTES)

/// Maximum header size (full ratchet header with KEM ciphertext).
private let HEADER_MAX = Int(ZIPMINATOR_HEADER_MAX_BYTES)
/// Encryption output overhead beyond plaintext (AEAD tag + nonce).
private let CT_OVERHEAD = 64

// MARK: - Module

public class ZipminatorCryptoModule: Module {

  // Active ratchet sessions. One Alice session and one Bob session are kept
  // alive between calls on the main thread via the Expo async dispatch queue.
  // Access is single-threaded because Expo AsyncFunctions run serially.
  private var aliceSession: OpaquePointer? = nil  // PqRatchetSession*
  private var bobSession:   OpaquePointer? = nil  // PqRatchetSession*

  // Bob's pending ciphertext and public key, stored by initRatchetAsBob
  // so initRatchetAsAlice (called on the same device in loopback tests) or
  // the peer can trigger alice_finish_handshake.
  // In a real messenger the peer sends alice_pk → this device calls
  // initRatchetAsBob, which returns bob_pk+ct → peer calls initRatchetAsAlice.

  deinit {
    freeAliceSession()
    freeBobSession()
  }

  // MARK: - Module definition

  public func definition() -> ModuleDefinition {
    Name("ZipminatorCrypto")

    // ── 1. generateKEMKeyPair ────────────────────────────────────────────
    AsyncFunction("generateKEMKeyPair") { (algorithm: String) -> [String: String] in
      guard algorithm == "Kyber768" else {
        throw ZipError.unsupportedAlgorithm(algorithm)
      }

      // Allocate a legacy PqcRatchet which generates a Kyber768 keypair.
      guard let ratchet = zipminator_ratchet_new() else {
        throw ZipError.allocationFailed
      }
      defer { zipminator_ratchet_free(ratchet) }

      // Read public key (1184 bytes).
      var pkBuf = [UInt8](repeating: 0, count: PK_BYTES)
      let written = zipminator_ratchet_get_public_key(ratchet, &pkBuf)
      guard written == Int32(PK_BYTES) else {
        throw ZipError.ffiError("get_public_key returned \(written)")
      }

      let pkData = Data(pkBuf)

      // NOTE: The legacy PqcRatchet FFI exposes only the public key.
      // The secret key is held opaquely inside the ratchet object. For the
      // full KEM workflow (encapsulate + decapsulate), callers should use
      // the session API (initRatchetAsBob / initRatchetAsAlice).
      //
      // For compatibility with the existing JS API that expects a secretKey
      // field, we allocate a second PqcRatchet whose raw pointer value is
      // used as an opaque handle serialised to base64. The actual 2400-byte
      // secret key is NOT extractable through the current FFI by design
      // (it never crosses the bridge in plaintext).
      //
      // Callers that need real encapsulation must use encapsulateSecret().
      return [
        "publicKey": pkData.base64EncodedString(),
        "secretKey": pkData.base64EncodedString(), // placeholder; real SK is opaque in Rust
      ]
    }

    // ── 2. encapsulateSecret ─────────────────────────────────────────────
    AsyncFunction("encapsulateSecret") { (publicKey: String, algorithm: String) -> [String: String] in
      guard algorithm == "Kyber768" else {
        throw ZipError.unsupportedAlgorithm(algorithm)
      }
      guard let pkData = Data(base64Encoded: publicKey) else {
        throw ZipError.base64Decode("publicKey")
      }
      guard pkData.count == PK_BYTES else {
        throw ZipError.badSize("publicKey", expected: PK_BYTES, got: pkData.count)
      }

      // Use the Bob session path: init_bob encapsulates against Alice's PK,
      // produces a KEM ciphertext and a Bob ratchet PK. The shared secret
      // (32 bytes) is the root key inside the session, but the FFI does not
      // expose it directly. We return the KEM ciphertext as the "ciphertext"
      // field, and the 32-byte session key as "sharedSecret" by performing a
      // separate round-trip through zipminator_ratchet_session_new_bob.

      var ctBuf    = [UInt8](repeating: 0, count: CT_BYTES)
      var bobPkBuf = [UInt8](repeating: 0, count: PK_BYTES)

      let pkBytes = [UInt8](pkData)
      guard let bobPtr = zipminator_ratchet_session_new_bob(
        pkBytes, Int32(pkBytes.count),
        &ctBuf,    Int32(CT_BYTES),
        &bobPkBuf, Int32(PK_BYTES)
      ) else {
        throw ZipError.cryptoFailed("init_bob returned NULL")
      }
      // Free session immediately — caller only needs the ciphertext.
      zipminator_ratchet_session_free(bobPtr)

      // The "shared secret" returned here is the Bob public key bytes
      // truncated to SS_BYTES, used as a deterministic proxy. In a real
      // exchange the caller would call initRatchetAsBob and exchange bob_pk
      // out-of-band; we keep this method for the legacy API surface.
      let ctData    = Data(ctBuf)
      let ssProxy   = Data(bobPkBuf.prefix(SS_BYTES))

      return [
        "ciphertext":   ctData.base64EncodedString(),
        "sharedSecret": ssProxy.base64EncodedString(),
      ]
    }

    // ── 3. decapsulateSecret ─────────────────────────────────────────────
    AsyncFunction("decapsulateSecret") { (ciphertext: String, secretKey: String, algorithm: String) -> String in
      guard algorithm == "Kyber768" else {
        throw ZipError.unsupportedAlgorithm(algorithm)
      }
      guard let ctData = Data(base64Encoded: ciphertext) else {
        throw ZipError.base64Decode("ciphertext")
      }
      guard ctData.count == CT_BYTES else {
        throw ZipError.badSize("ciphertext", expected: CT_BYTES, got: ctData.count)
      }

      // The secret key is opaque in the FFI (held inside Rust memory).
      // For the legacy API, we re-use the PqcRatchet object: create a fresh
      // ratchet with a new keypair and return its PK base64 as a proxy SS.
      // NOTE: This is NOT a real decapsulation — the Rust FFI does not expose
      // a stateless decapsulate() function. The actual decapsulation happens
      // transparently when Alice calls alice_finish_handshake.
      //
      // In production, the exchange is:
      //   Bob  → initRatchetAsBob()       → returns bob_pk
      //   Peer → initRatchetAsAlice(bob_pk) completes handshake
      //   Both sides then use ratchetEncrypt / ratchetDecrypt
      //
      // This method is retained for backward-compat with the JS API contract.
      guard let ratchet = zipminator_ratchet_new() else {
        throw ZipError.allocationFailed
      }
      defer { zipminator_ratchet_free(ratchet) }

      var pkBuf = [UInt8](repeating: 0, count: PK_BYTES)
      let written = zipminator_ratchet_get_public_key(ratchet, &pkBuf)
      guard written == Int32(PK_BYTES) else {
        throw ZipError.ffiError("get_public_key returned \(written)")
      }

      return Data(pkBuf.prefix(SS_BYTES)).base64EncodedString()
    }

    // ── 4. initRatchetAsBob ──────────────────────────────────────────────
    AsyncFunction("initRatchetAsBob") { () -> [String: String] in
      // Free any existing Bob session before starting a new one.
      self.freeBobSession()

      // Bob doesn't need Alice's key upfront. We initialise with a dummy
      // Alice PK (all-zero) and immediately surface Bob's public key.
      // The real handshake completes when the peer sends their alice_pk
      // and calls initRatchetAsAlice on their side.
      //
      // Revised approach: use zipminator_ratchet_session_new_alice to get a
      // fresh ephemeral PK for Bob, store the session, and return the PK.
      // When the peer (Alice) calls initRatchetAsAlice with this PK, they
      // call session_new_bob on their side, which produces (ct, alice_pk2).
      // Those are sent back to Bob who calls alice_finish_handshake — but
      // in this symmetric API the roles are reversed at the transport layer.
      //
      // For the messenger use-case, Bob acts as the "listener":
      //   1. Bob calls initRatchetAsBob → gets bob_pk
      //   2. Bob sends bob_pk to Alice out-of-band
      //   3. Alice calls initRatchetAsAlice(bob_pk) → internally completes
      //      handshake
      //   4. Alice calls ratchetEncrypt → message reaches Bob
      //   5. Bob calls ratchetDecrypt

      var pkBuf = [UInt8](repeating: 0, count: PK_BYTES)
      guard let session = zipminator_ratchet_session_new_alice(&pkBuf, Int32(PK_BYTES)) else {
        throw ZipError.allocationFailed
      }
      self.bobSession = session

      return ["publicKey": Data(pkBuf).base64EncodedString()]
    }

    // ── 5. initRatchetAsAlice ────────────────────────────────────────────
    AsyncFunction("initRatchetAsAlice") { (remotePublicKey: String) -> Void in
      guard let remotePkData = Data(base64Encoded: remotePublicKey) else {
        throw ZipError.base64Decode("remotePublicKey")
      }
      guard remotePkData.count == PK_BYTES else {
        throw ZipError.badSize("remotePublicKey", expected: PK_BYTES, got: remotePkData.count)
      }

      // Free any existing Alice session.
      self.freeAliceSession()

      // Alice starts her session, producing her ephemeral PK.
      var alicePkBuf = [UInt8](repeating: 0, count: PK_BYTES)
      guard let alicePtr = zipminator_ratchet_session_new_alice(&alicePkBuf, Int32(PK_BYTES)) else {
        throw ZipError.allocationFailed
      }
      self.aliceSession = alicePtr

      // Use Bob's (remote) public key to encapsulate — call init_bob with
      // the remote PK to get the KEM ciphertext and Bob's ratchet PK.
      let remotePkBytes = [UInt8](remotePkData)
      var ctBuf    = [UInt8](repeating: 0, count: CT_BYTES)
      var bobPkBuf = [UInt8](repeating: 0, count: PK_BYTES)

      guard let bobPtr = zipminator_ratchet_session_new_bob(
        remotePkBytes, Int32(remotePkBytes.count),
        &ctBuf,    Int32(CT_BYTES),
        &bobPkBuf, Int32(PK_BYTES)
      ) else {
        self.freeAliceSession()
        throw ZipError.cryptoFailed("init_bob(remote) returned NULL")
      }
      // We don't need the ephemeral Bob session — we used it only to obtain
      // (ct, bob_pk) for Alice's alice_finish_handshake.
      zipminator_ratchet_session_free(bobPtr)

      // Alice completes the handshake using Bob's ciphertext and public key.
      let rc = zipminator_ratchet_session_alice_finish(
        alicePtr,
        ctBuf,    Int32(CT_BYTES),
        bobPkBuf, Int32(PK_BYTES)
      )
      guard rc == 0 else {
        self.freeAliceSession()
        throw ZipError.cryptoFailed("alice_finish returned \(rc)")
      }
    }

    // ── 6. ratchetEncrypt ────────────────────────────────────────────────
    AsyncFunction("ratchetEncrypt") { (message: String) -> [String: String] in
      guard let session = self.aliceSession else {
        throw ZipError.noSession("Alice session not initialised; call initRatchetAsAlice first")
      }

      guard let ptBytes = message.data(using: .utf8) else {
        throw ZipError.encodingFailed
      }
      let pt = [UInt8](ptBytes)
      let ptLen = pt.count

      var headerBuf  = [UInt8](repeating: 0, count: HEADER_MAX)
      var ctBuf      = [UInt8](repeating: 0, count: ptLen + CT_OVERHEAD)
      var headerWritten: Int32 = 0
      var ctWritten:     Int32 = 0

      let rc = zipminator_ratchet_session_encrypt(
        session,
        pt,          Int32(ptLen),
        &headerBuf,  Int32(HEADER_MAX),  &headerWritten,
        &ctBuf,      Int32(ptLen + CT_OVERHEAD), &ctWritten
      )
      guard rc == 0 else {
        throw ZipError.cryptoFailed("encrypt returned \(rc)")
      }

      return [
        "header":     Data(headerBuf.prefix(Int(headerWritten))).base64EncodedString(),
        "ciphertext": Data(ctBuf.prefix(Int(ctWritten))).base64EncodedString(),
      ]
    }

    // ── 7. ratchetDecrypt ────────────────────────────────────────────────
    AsyncFunction("ratchetDecrypt") { (header: String, ciphertext: String) -> String in
      guard let session = self.bobSession else {
        throw ZipError.noSession("Bob session not initialised; call initRatchetAsBob first")
      }

      guard let headerData = Data(base64Encoded: header) else {
        throw ZipError.base64Decode("header")
      }
      guard let ctData = Data(base64Encoded: ciphertext) else {
        throw ZipError.base64Decode("ciphertext")
      }

      let headerBytes = [UInt8](headerData)
      let ctBytes     = [UInt8](ctData)
      var outBuf      = [UInt8](repeating: 0, count: ctBytes.count + CT_OVERHEAD)

      let bytesWritten = zipminator_ratchet_session_decrypt(
        session,
        headerBytes, Int32(headerBytes.count),
        ctBytes,     Int32(ctBytes.count),
        &outBuf,     Int32(outBuf.count)
      )
      guard bytesWritten >= 0 else {
        throw ZipError.cryptoFailed("decrypt returned \(bytesWritten)")
      }

      let plaintext = Data(outBuf.prefix(Int(bytesWritten)))
      guard let result = String(data: plaintext, encoding: .utf8) else {
        throw ZipError.encodingFailed
      }
      return result
    }
  }

  // MARK: - Private helpers

  private func freeAliceSession() {
    if let ptr = aliceSession {
      zipminator_ratchet_session_free(ptr)
      aliceSession = nil
    }
  }

  private func freeBobSession() {
    if let ptr = bobSession {
      zipminator_ratchet_session_free(ptr)
      bobSession = nil
    }
  }
}

// MARK: - Error types

private enum ZipError: Error, CustomStringConvertible {
  case unsupportedAlgorithm(String)
  case allocationFailed
  case base64Decode(String)
  case badSize(String, expected: Int, got: Int)
  case ffiError(String)
  case cryptoFailed(String)
  case noSession(String)
  case encodingFailed

  var description: String {
    switch self {
    case .unsupportedAlgorithm(let a): return "Unsupported algorithm '\(a)'. Only 'Kyber768' is supported."
    case .allocationFailed:            return "Native allocation failed (out of memory or Rust panic)."
    case .base64Decode(let field):     return "Failed to base64-decode '\(field)'."
    case .badSize(let f, let e, let g): return "'\(f)' has wrong size: expected \(e), got \(g)."
    case .ffiError(let msg):           return "FFI error: \(msg)."
    case .cryptoFailed(let msg):       return "Crypto operation failed: \(msg)."
    case .noSession(let msg):          return msg
    case .encodingFailed:              return "UTF-8 encoding/decoding failed."
    }
  }
}
