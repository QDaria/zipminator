import ExpoModulesCore

public class ZipminatorCryptoModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ZipminatorCrypto')` in JavaScript.
    Name("ZipminatorCrypto")

    // 1. ML-KEM Key Generation
    // In production, this bridges down to OQS_KEM_keypair in the compiled liboqs.a
    Function("generateKEMKeyPair") { (algorithm: String) -> [String: String] in
      // TODO: Link `libs/ios/liboqs.a` in Expo Podspec and call C-bindings
      // Mocking native speed execution for now
      return [
        "publicKey": "0xPK_SWIFT_NATIVE_\(algorithm)_" + UUID().uuidString.prefix(8),
        "secretKey": "0xSK_SWIFT_NATIVE_\(algorithm)_" + UUID().uuidString.prefix(8)
      ]
    }

    // 2. ML-KEM Encapsulation
    Function("encapsulateSecret") { (publicKeyHex: String, algorithm: String) -> [String: String] in
      // TODO: Bridge OQS_KEM_encaps
      return [
        "ciphertext": "0xCT_SWIFT_NATIVE_\(algorithm)_" + UUID().uuidString.prefix(8),
        "sharedSecret": "0xSS_SWIFT_NATIVE_\(algorithm)_" + UUID().uuidString.prefix(8)
      ]
    }

    // 3. ML-KEM Decapsulation
    Function("decapsulateSecret") { (ciphertextHex: String, secretKeyHex: String, algorithm: String) -> String in
      // TODO: Bridge OQS_KEM_decaps
      return "0xSS_SWIFT_NATIVE_\(algorithm)_DEC"
    }
  }
}
