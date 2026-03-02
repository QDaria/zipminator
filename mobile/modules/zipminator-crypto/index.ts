// Reexport the native module. On web, it resolves to ZipminatorCryptoModule.web.ts
// and on native platforms to ZipminatorCryptoModule.ts
export { default } from './src/ZipminatorCryptoModule';
export { default as ZipminatorCryptoView } from './src/ZipminatorCryptoView';

// Re-export all public types so consumers can import from the package root.
export type {
  KEMAlgorithm,
  KEMKeyPair,
  KEMCapsule,
  RatchetEncryptedMessage,
  RatchetPublicKey,
  OnLoadEventPayload,
  ZipminatorCryptoModuleEvents,
  ChangeEventPayload,
  ZipminatorCryptoViewProps,
} from './src/ZipminatorCrypto.types';
