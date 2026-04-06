import 'package:flutter_riverpod/flutter_riverpod.dart';

/// A mesh node in the Q-Mesh network.
class MeshNode {
  final String id;
  final String label;
  final bool isOnline;
  final double? signalStrength;
  final DateTime lastSeen;

  const MeshNode({
    required this.id,
    required this.label,
    this.isOnline = false,
    this.signalStrength,
    required this.lastSeen,
  });
}

/// An edge between two mesh nodes.
class MeshEdge {
  final String sourceId;
  final String targetId;
  final double? latency;

  const MeshEdge({
    required this.sourceId,
    required this.targetId,
    this.latency,
  });
}

/// Security profile of the mesh network.
enum MeshSecurityProfile {
  standard,    // HMAC-SHA256 beacon auth
  enhanced,    // + SipHash frame integrity
  quantum,     // + QRNG-derived mesh keys
}

/// State for the Q-Mesh feature.
class MeshState {
  final List<MeshNode> nodes;
  final List<MeshEdge> edges;
  final bool isConnected;
  final MeshSecurityProfile securityProfile;
  final DateTime? lastKeyRotation;
  final int? meshKeyAge;
  final String? error;

  const MeshState({
    this.nodes = const [],
    this.edges = const [],
    this.isConnected = false,
    this.securityProfile = MeshSecurityProfile.standard,
    this.lastKeyRotation,
    this.meshKeyAge,
    this.error,
  });

  MeshState copyWith({
    List<MeshNode>? nodes,
    List<MeshEdge>? edges,
    bool? isConnected,
    MeshSecurityProfile? securityProfile,
    DateTime? lastKeyRotation,
    int? meshKeyAge,
    String? error,
  }) => MeshState(
    nodes: nodes ?? this.nodes,
    edges: edges ?? this.edges,
    isConnected: isConnected ?? this.isConnected,
    securityProfile: securityProfile ?? this.securityProfile,
    lastKeyRotation: lastKeyRotation ?? this.lastKeyRotation,
    meshKeyAge: meshKeyAge ?? this.meshKeyAge,
    error: error,
  );

  int get onlineCount => nodes.where((n) => n.isOnline).length;
}

/// Manages Q-Mesh network state and provisioning.
class MeshNotifier extends Notifier<MeshState> {
  @override
  MeshState build() {
    // Seed with demo topology until live mesh discovery is implemented
    final now = DateTime.now();
    return MeshState(
      nodes: [
        MeshNode(id: 'esp32-001', label: 'Gateway', isOnline: true, signalStrength: -45, lastSeen: now),
        MeshNode(id: 'esp32-002', label: 'Bedroom', isOnline: true, signalStrength: -62, lastSeen: now),
        MeshNode(id: 'esp32-003', label: 'Kitchen', isOnline: true, signalStrength: -58, lastSeen: now),
        MeshNode(id: 'esp32-004', label: 'Office', isOnline: false, signalStrength: null, lastSeen: now.subtract(const Duration(hours: 2))),
      ],
      edges: [
        const MeshEdge(sourceId: 'esp32-001', targetId: 'esp32-002', latency: 12),
        const MeshEdge(sourceId: 'esp32-001', targetId: 'esp32-003', latency: 8),
        const MeshEdge(sourceId: 'esp32-002', targetId: 'esp32-004', latency: 25),
      ],
      isConnected: true,
      securityProfile: MeshSecurityProfile.quantum,
      lastKeyRotation: now.subtract(const Duration(hours: 6)),
      meshKeyAge: 6,
    );
  }

  void refreshTopology() {
    // Will call Rust FFI when mesh discovery is wired
    state = state.copyWith(error: null);
  }

  void rotateKey() {
    state = state.copyWith(
      lastKeyRotation: DateTime.now(),
      meshKeyAge: 0,
    );
  }

  void setSecurityProfile(MeshSecurityProfile profile) {
    state = state.copyWith(securityProfile: profile);
  }
}

final meshProvider = NotifierProvider<MeshNotifier, MeshState>(MeshNotifier.new);
