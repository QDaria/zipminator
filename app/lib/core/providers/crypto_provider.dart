import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/src/rust/api/simple.dart' as rust;

/// State for a generated keypair.
class KeypairState {
  final Uint8List? publicKey;
  final Uint8List? secretKey;
  final bool isGenerating;
  final String? error;

  const KeypairState({
    this.publicKey,
    this.secretKey,
    this.isGenerating = false,
    this.error,
  });

  KeypairState copyWith({
    Uint8List? publicKey,
    Uint8List? secretKey,
    bool? isGenerating,
    String? error,
  }) =>
      KeypairState(
        publicKey: publicKey ?? this.publicKey,
        secretKey: secretKey ?? this.secretKey,
        isGenerating: isGenerating ?? this.isGenerating,
        error: error,
      );
}

/// Manages ML-KEM-768 keypair generation and KEM operations.
class CryptoNotifier extends Notifier<KeypairState> {
  @override
  KeypairState build() => const KeypairState();

  Future<void> generateKeypair() async {
    state = state.copyWith(isGenerating: true, error: null);
    try {
      final kp = await rust.keypair();
      state = KeypairState(
        publicKey: Uint8List.fromList(kp.publicKey),
        secretKey: Uint8List.fromList(kp.secretKey),
      );
    } catch (e) {
      state = state.copyWith(isGenerating: false, error: e.toString());
    }
  }

  Future<rust.EncapsulationResult?> encapsulate(Uint8List publicKey) async {
    try {
      return await rust.encapsulate(publicKey: publicKey);
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  Future<Uint8List?> decapsulate(
      Uint8List ciphertext, Uint8List secretKey) async {
    try {
      return await rust.decapsulate(
          ciphertext: ciphertext, secretKey: secretKey);
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  void clear() {
    state = const KeypairState();
  }
}

final cryptoProvider =
    NotifierProvider<CryptoNotifier, KeypairState>(CryptoNotifier.new);
