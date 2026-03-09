import 'package:flutter_riverpod/flutter_riverpod.dart';

/// VPN connection states.
enum VpnStatus { disconnected, connecting, connected, disconnecting, error }

/// State for the Q-VPN pillar.
class VpnState {
  final VpnStatus status;
  final String? serverAddress;
  final Duration uptime;
  final int bytesUp;
  final int bytesDown;
  final bool killSwitchEnabled;
  final String? error;

  const VpnState({
    this.status = VpnStatus.disconnected,
    this.serverAddress,
    this.uptime = Duration.zero,
    this.bytesUp = 0,
    this.bytesDown = 0,
    this.killSwitchEnabled = true,
    this.error,
  });

  VpnState copyWith({
    VpnStatus? status,
    String? serverAddress,
    Duration? uptime,
    int? bytesUp,
    int? bytesDown,
    bool? killSwitchEnabled,
    String? error,
  }) =>
      VpnState(
        status: status ?? this.status,
        serverAddress: serverAddress ?? this.serverAddress,
        uptime: uptime ?? this.uptime,
        bytesUp: bytesUp ?? this.bytesUp,
        bytesDown: bytesDown ?? this.bytesDown,
        killSwitchEnabled: killSwitchEnabled ?? this.killSwitchEnabled,
        error: error,
      );

  bool get isActive =>
      status == VpnStatus.connected || status == VpnStatus.connecting;
}

/// Manages VPN connection state.
///
/// Actual tunnel creation requires platform channels:
/// - iOS/macOS: Swift NEPacketTunnelProvider
/// - Android: Kotlin VpnService
/// - Linux: Rust tun/tap
class VpnNotifier extends Notifier<VpnState> {
  @override
  VpnState build() => const VpnState();

  Future<void> connect({String server = 'vpn.zipminator.zip'}) async {
    state = state.copyWith(
      status: VpnStatus.connecting,
      serverAddress: server,
      error: null,
    );
    // TODO: Platform channel to native VPN implementation
    // For now, simulate connection for UI development
    await Future.delayed(const Duration(seconds: 1));
    state = state.copyWith(status: VpnStatus.connected);
  }

  Future<void> disconnect() async {
    state = state.copyWith(status: VpnStatus.disconnecting);
    await Future.delayed(const Duration(milliseconds: 500));
    state = const VpnState();
  }

  void toggleKillSwitch() {
    state = state.copyWith(killSwitchEnabled: !state.killSwitchEnabled);
  }
}

final vpnProvider =
    NotifierProvider<VpnNotifier, VpnState>(VpnNotifier.new);
