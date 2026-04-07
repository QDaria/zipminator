import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import 'package:zipminator/main.dart' show rustBridgeAvailable;
import 'package:zipminator/src/rust/api/simple.dart' as rust;

/// Metadata for a file encrypted in the PQC vault.
class VaultFile {
  final String id;
  final String name;
  final int originalSize;
  final int encryptedSize;
  final DateTime encryptedAt;
  final String filePath;

  const VaultFile({
    required this.id,
    required this.name,
    required this.originalSize,
    required this.encryptedSize,
    required this.encryptedAt,
    required this.filePath,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'originalSize': originalSize,
        'encryptedSize': encryptedSize,
        'encryptedAt': encryptedAt.toIso8601String(),
        'filePath': filePath,
      };

  factory VaultFile.fromJson(Map<String, dynamic> json) => VaultFile(
        id: json['id'] as String,
        name: json['name'] as String,
        originalSize: json['originalSize'] as int,
        encryptedSize: json['encryptedSize'] as int,
        encryptedAt: DateTime.parse(json['encryptedAt'] as String),
        filePath: json['filePath'] as String,
      );
}

class VaultState {
  final List<VaultFile> files;
  final bool isProcessing;
  final String? error;
  final String? currentOperation;

  const VaultState({
    this.files = const [],
    this.isProcessing = false,
    this.error,
    this.currentOperation,
  });

  VaultState copyWith({
    List<VaultFile>? files,
    bool? isProcessing,
    String? error,
    String? currentOperation,
  }) =>
      VaultState(
        files: files ?? this.files,
        isProcessing: isProcessing ?? this.isProcessing,
        error: error,
        currentOperation: currentOperation,
      );
}

const _uuid = Uuid();

class VaultNotifier extends Notifier<VaultState> {
  @override
  VaultState build() {
    _loadFileList();
    return const VaultState();
  }

  Future<Directory> _vaultDir() async {
    final appDir = await getApplicationDocumentsDirectory();
    final dir = Directory('${appDir.path}/zipminator_vault');
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    return dir;
  }

  File _manifestFile(Directory vaultDir) =>
      File('${vaultDir.path}/manifest.json');

  Future<void> _loadFileList() async {
    try {
      final dir = await _vaultDir();
      final manifest = _manifestFile(dir);
      if (!await manifest.exists()) return;
      final raw = await manifest.readAsString();
      final List<dynamic> entries = jsonDecode(raw) as List<dynamic>;
      final files = <VaultFile>[];
      for (final entry in entries) {
        final vf = VaultFile.fromJson(entry as Map<String, dynamic>);
        if (await File(vf.filePath).exists()) {
          files.add(vf);
        }
      }
      state = state.copyWith(files: files);
    } catch (_) {
      // First launch or corrupt manifest; start fresh.
    }
  }

  Future<void> _saveManifest() async {
    final dir = await _vaultDir();
    final manifest = _manifestFile(dir);
    final json = jsonEncode(state.files.map((f) => f.toJson()).toList());
    await manifest.writeAsString(json);
  }

  /// Encrypt [sourceFile] with ML-KEM-768 envelope encryption and store
  /// the result in the vault directory as a `.pqc` file.
  Future<void> encryptFile(File sourceFile) async {
    if (!rustBridgeAvailable) {
      state = state.copyWith(
        isProcessing: false,
        error: 'PQC crypto engine not available. '
            'The Rust bridge failed to initialize at startup. '
            'Please restart the app or check that the native library is installed.',
      );
      return;
    }

    state = state.copyWith(
      isProcessing: true,
      currentOperation: 'Reading file...',
      error: null,
    );

    try {
      final plaintext = await sourceFile.readAsBytes();
      final fileName = sourceFile.uri.pathSegments.last;

      state = state.copyWith(currentOperation: 'Generating ML-KEM-768 keypair...');
      final kp = await rust.keypair();

      state = state.copyWith(currentOperation: 'Encrypting with PQC envelope...');

      // AAD includes the original filename for authenticated binding.
      final aad = utf8.encode(fileName);

      final envelope = await rust.emailEncrypt(
        recipientPk: kp.publicKey,
        plaintext: plaintext,
        aad: aad,
      );

      // Store format: [4-byte SK length][secret key][envelope]
      // The secret key is needed for decryption. In a production system this
      // would be stored in a hardware-backed keystore; here we bundle it
      // with the encrypted file for the demo/beta phase.
      final skBytes = Uint8List.fromList(kp.secretKey);
      final skLen = skBytes.length;
      final combined = BytesBuilder(copy: false);
      combined.add(_uint32Bytes(skLen));
      combined.add(skBytes);
      combined.add(envelope);
      final outputBytes = combined.toBytes();

      final id = _uuid.v4();
      final dir = await _vaultDir();
      final outFile = File('${dir.path}/$id.pqc');
      await outFile.writeAsBytes(outputBytes);

      final vaultFile = VaultFile(
        id: id,
        name: fileName,
        originalSize: plaintext.length,
        encryptedSize: outputBytes.length,
        encryptedAt: DateTime.now(),
        filePath: outFile.path,
      );

      state = state.copyWith(
        files: [...state.files, vaultFile],
        isProcessing: false,
      );
      await _saveManifest();
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Encryption failed: $e',
      );
    }
  }

  /// Decrypt a vault file and return a temporary [File] with the original
  /// plaintext content.
  Future<File?> decryptFile(VaultFile vaultFile) async {
    if (!rustBridgeAvailable) {
      state = state.copyWith(
        isProcessing: false,
        error: 'PQC crypto engine not available. '
            'The Rust bridge failed to initialize at startup.',
      );
      return null;
    }

    state = state.copyWith(
      isProcessing: true,
      currentOperation: 'Decrypting...',
      error: null,
    );

    try {
      final raw = await File(vaultFile.filePath).readAsBytes();

      // Parse stored format: [4-byte SK length][secret key][envelope]
      final skLen = _readUint32(raw, 0);
      final sk = raw.sublist(4, 4 + skLen);
      final envelope = raw.sublist(4 + skLen);

      final aad = utf8.encode(vaultFile.name);

      final plaintext = await rust.emailDecrypt(
        secretKey: sk,
        envelope: envelope,
        aad: aad,
      );

      // Write decrypted content to temp directory.
      final tempDir = await getTemporaryDirectory();
      final outFile = File('${tempDir.path}/${vaultFile.name}');
      await outFile.writeAsBytes(plaintext);

      state = state.copyWith(isProcessing: false);
      return outFile;
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Decryption failed: $e',
      );
      return null;
    }
  }

  /// Delete a vault file from disk and remove it from state.
  Future<void> deleteFile(VaultFile vaultFile) async {
    try {
      final file = File(vaultFile.filePath);
      if (await file.exists()) {
        await file.delete();
      }
      state = state.copyWith(
        files: state.files.where((f) => f.id != vaultFile.id).toList(),
      );
      await _saveManifest();
    } catch (e) {
      state = state.copyWith(error: 'Delete failed: $e');
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  /// Encode a 32-bit unsigned integer as 4 little-endian bytes.
  Uint8List _uint32Bytes(int value) {
    final data = ByteData(4);
    data.setUint32(0, value, Endian.little);
    return data.buffer.asUint8List();
  }

  /// Read a 32-bit unsigned integer from [bytes] at [offset] (little-endian).
  int _readUint32(Uint8List bytes, int offset) {
    return ByteData.sublistView(bytes, offset, offset + 4)
        .getUint32(0, Endian.little);
  }
}

final vaultProvider =
    NotifierProvider<VaultNotifier, VaultState>(VaultNotifier.new);
