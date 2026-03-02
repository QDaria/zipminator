import { registerWebModule, NativeModule } from 'expo';

import type { ZipminatorCryptoModuleEvents } from './ZipminatorCrypto.types';

/**
 * ZipminatorCryptoModule — Web stub.
 *
 * Quantum-safe cryptography requires native hardware capabilities that are
 * not available in a browser context. All methods throw an explicit error so
 * callers can gate on platform before invoking.
 */
class ZipminatorCryptoModule extends NativeModule<ZipminatorCryptoModuleEvents> {
  async generateKEMKeyPair(_algorithm: string): Promise<never> {
    throw new Error('ZipminatorCrypto: generateKEMKeyPair is not supported on web.');
  }

  async encapsulateSecret(_publicKey: string, _algorithm: string): Promise<never> {
    throw new Error('ZipminatorCrypto: encapsulateSecret is not supported on web.');
  }

  async decapsulateSecret(
    _ciphertext: string,
    _secretKey: string,
    _algorithm: string
  ): Promise<never> {
    throw new Error('ZipminatorCrypto: decapsulateSecret is not supported on web.');
  }

  async initRatchetAsBob(): Promise<never> {
    throw new Error('ZipminatorCrypto: initRatchetAsBob is not supported on web.');
  }

  async initRatchetAsAlice(_remotePublicKey: string): Promise<never> {
    throw new Error('ZipminatorCrypto: initRatchetAsAlice is not supported on web.');
  }

  async ratchetEncrypt(_message: string): Promise<never> {
    throw new Error('ZipminatorCrypto: ratchetEncrypt is not supported on web.');
  }

  async ratchetDecrypt(_header: string, _ciphertext: string): Promise<never> {
    throw new Error('ZipminatorCrypto: ratchetDecrypt is not supported on web.');
  }
}

export default registerWebModule(ZipminatorCryptoModule, 'ZipminatorCrypto');
