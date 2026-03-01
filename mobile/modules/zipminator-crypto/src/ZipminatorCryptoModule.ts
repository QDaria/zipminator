import { NativeModule, requireNativeModule } from 'expo';

import { ZipminatorCryptoModuleEvents } from './ZipminatorCrypto.types';

export type PQCKeyPair = {
  publicKey: string;
  secretKey: string;
};

export type PQCCapsule = {
  ciphertext: string;
  sharedSecret: string;
};

declare class ZipminatorCryptoModule extends NativeModule<ZipminatorCryptoModuleEvents> {
  // Bridge to the FIPS-203 Native ML-KEM algorithms (liboqs / rust core)
  generateKEMKeyPair(algorithm: string): PQCKeyPair;
  encapsulateSecret(publicKeyHex: string, algorithm: string): PQCCapsule;
  decapsulateSecret(ciphertextHex: string, secretKeyHex: string, algorithm: string): string;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ZipminatorCryptoModule>('ZipminatorCrypto');
