import 'package:flutter_riverpod/flutter_riverpod.dart';

/// VPN connection states.
enum VpnStatus { disconnected, connecting, connected, disconnecting, error }

/// Geographic regions for VPN server selection.
enum VpnRegion {
  europe('Europe'),
  americas('Americas'),
  asiaPacific('Asia-Pacific'),
  middleEast('Middle East');

  final String label;
  const VpnRegion(this.label);
}

/// A VPN server location.
class VpnLocation {
  final String country;
  final String city;
  final String flag;
  final String server;
  final VpnRegion region;

  const VpnLocation({
    required this.country,
    required this.city,
    required this.flag,
    required this.server,
    required this.region,
  });

  String get displayName => '$flag $country — $city';
}

/// Available VPN server locations.
const kVpnLocations = <VpnLocation>[
  // Europe
  VpnLocation(
      country: 'Norway',
      city: 'Oslo',
      flag: '\u{1F1F3}\u{1F1F4}',
      server: 'no-osl.vpn.zipminator.zip',
      region: VpnRegion.europe),
  VpnLocation(
      country: 'Sweden',
      city: 'Stockholm',
      flag: '\u{1F1F8}\u{1F1EA}',
      server: 'se-sto.vpn.zipminator.zip',
      region: VpnRegion.europe),
  VpnLocation(
      country: 'Germany',
      city: 'Frankfurt',
      flag: '\u{1F1E9}\u{1F1EA}',
      server: 'de-fra.vpn.zipminator.zip',
      region: VpnRegion.europe),
  VpnLocation(
      country: 'Netherlands',
      city: 'Amsterdam',
      flag: '\u{1F1F3}\u{1F1F1}',
      server: 'nl-ams.vpn.zipminator.zip',
      region: VpnRegion.europe),
  VpnLocation(
      country: 'UK',
      city: 'London',
      flag: '\u{1F1EC}\u{1F1E7}',
      server: 'gb-lon.vpn.zipminator.zip',
      region: VpnRegion.europe),
  VpnLocation(
      country: 'Switzerland',
      city: 'Zurich',
      flag: '\u{1F1E8}\u{1F1ED}',
      server: 'ch-zur.vpn.zipminator.zip',
      region: VpnRegion.europe),
  // Americas
  VpnLocation(
      country: 'US East',
      city: 'New York',
      flag: '\u{1F1FA}\u{1F1F8}',
      server: 'us-nyc.vpn.zipminator.zip',
      region: VpnRegion.americas),
  VpnLocation(
      country: 'US West',
      city: 'Los Angeles',
      flag: '\u{1F1FA}\u{1F1F8}',
      server: 'us-lax.vpn.zipminator.zip',
      region: VpnRegion.americas),
  // Asia-Pacific
  VpnLocation(
      country: 'Japan',
      city: 'Tokyo',
      flag: '\u{1F1EF}\u{1F1F5}',
      server: 'jp-tyo.vpn.zipminator.zip',
      region: VpnRegion.asiaPacific),
  VpnLocation(
      country: 'Singapore',
      city: 'Singapore',
      flag: '\u{1F1F8}\u{1F1EC}',
      server: 'sg-sin.vpn.zipminator.zip',
      region: VpnRegion.asiaPacific),
  VpnLocation(
      country: 'Australia',
      city: 'Sydney',
      flag: '\u{1F1E6}\u{1F1FA}',
      server: 'au-syd.vpn.zipminator.zip',
      region: VpnRegion.asiaPacific),
];

/// State for the Q-VPN pillar.
class VpnState {
  final VpnStatus status;
  final String? serverAddress;
  final Duration uptime;
  final int bytesUp;
  final int bytesDown;
  final bool killSwitchEnabled;
  final VpnLocation? selectedLocation;
  final VpnRegion selectedRegion;
  final String? error;

  const VpnState({
    this.status = VpnStatus.disconnected,
    this.serverAddress,
    this.uptime = Duration.zero,
    this.bytesUp = 0,
    this.bytesDown = 0,
    this.killSwitchEnabled = true,
    this.selectedLocation,
    this.selectedRegion = VpnRegion.europe,
    this.error,
  });

  VpnState copyWith({
    VpnStatus? status,
    String? serverAddress,
    Duration? uptime,
    int? bytesUp,
    int? bytesDown,
    bool? killSwitchEnabled,
    VpnLocation? selectedLocation,
    VpnRegion? selectedRegion,
    String? error,
  }) =>
      VpnState(
        status: status ?? this.status,
        serverAddress: serverAddress ?? this.serverAddress,
        uptime: uptime ?? this.uptime,
        bytesUp: bytesUp ?? this.bytesUp,
        bytesDown: bytesDown ?? this.bytesDown,
        killSwitchEnabled: killSwitchEnabled ?? this.killSwitchEnabled,
        selectedLocation: selectedLocation ?? this.selectedLocation,
        selectedRegion: selectedRegion ?? this.selectedRegion,
        error: error,
      );

  bool get isActive =>
      status == VpnStatus.connected || status == VpnStatus.connecting;

  /// Locations filtered by selected region.
  List<VpnLocation> get regionLocations =>
      kVpnLocations.where((l) => l.region == selectedRegion).toList();
}

/// Manages VPN connection state.
///
/// Actual tunnel creation requires platform channels:
/// - iOS/macOS: Swift NEPacketTunnelProvider
/// - Android: Kotlin VpnService
/// - Linux: Rust tun/tap
class VpnNotifier extends Notifier<VpnState> {
  @override
  VpnState build() => VpnState(
        selectedLocation: kVpnLocations.first,
      );

  void selectRegion(VpnRegion region) {
    final locations =
        kVpnLocations.where((l) => l.region == region).toList();
    state = state.copyWith(
      selectedRegion: region,
      selectedLocation: locations.isNotEmpty ? locations.first : null,
    );
  }

  void selectLocation(VpnLocation location) {
    state = state.copyWith(selectedLocation: location);
  }

  Future<void> connect() async {
    final location = state.selectedLocation;
    if (location == null) return;

    state = state.copyWith(
      status: VpnStatus.connecting,
      serverAddress: location.server,
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
    state = state.copyWith(
      status: VpnStatus.disconnected,
      serverAddress: null,
    );
  }

  void toggleKillSwitch() {
    state = state.copyWith(killSwitchEnabled: !state.killSwitchEnabled);
  }
}

final vpnProvider =
    NotifierProvider<VpnNotifier, VpnState>(VpnNotifier.new);
