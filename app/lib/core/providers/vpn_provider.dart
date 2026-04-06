import 'dart:math';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// VPN connection states.
enum VpnStatus { disconnected, connecting, connected, disconnecting, error }

/// Auto-rotation intervals for location anonymization.
enum RotationInterval {
  everyMinute('Every 1 min', Duration(minutes: 1)),
  everyHour('Every 1 hour', Duration(hours: 1)),
  everyDay('Every 24 hours', Duration(hours: 24)),
  everyWeek('Every week', Duration(days: 7)),
  off('Off', Duration.zero);

  final String label;
  final Duration duration;
  const RotationInterval(this.label, this.duration);
}

/// Cities used for simulated location rotation.
const _rotationCities = [
  'Oslo, Norway',
  'Stockholm, Sweden',
  'Frankfurt, Germany',
  'Amsterdam, Netherlands',
  'London, UK',
  'Zurich, Switzerland',
  'New York, US',
  'Los Angeles, US',
  'Tokyo, Japan',
  'Singapore',
  'Sydney, Australia',
  'Toronto, Canada',
  'Reykjavik, Iceland',
  'Helsinki, Finland',
  'Bucharest, Romania',
  'Warsaw, Poland',
  'Prague, Czech Republic',
  'Mumbai, India',
];

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

  // Location anonymization fields
  final bool locationAnonymization;
  final RotationInterval rotationInterval;
  final bool locationHidden;
  final String currentLocation;

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
    this.locationAnonymization = false,
    this.rotationInterval = RotationInterval.everyHour,
    this.locationHidden = false,
    this.currentLocation = 'Oslo, Norway',
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
    bool? locationAnonymization,
    RotationInterval? rotationInterval,
    bool? locationHidden,
    String? currentLocation,
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
        locationAnonymization:
            locationAnonymization ?? this.locationAnonymization,
        rotationInterval: rotationInterval ?? this.rotationInterval,
        locationHidden: locationHidden ?? this.locationHidden,
        currentLocation: currentLocation ?? this.currentLocation,
      );

  bool get isActive =>
      status == VpnStatus.connected || status == VpnStatus.connecting;

  /// Locations filtered by selected region.
  List<VpnLocation> get regionLocations =>
      kVpnLocations.where((l) => l.region == selectedRegion).toList();

  /// Display string for location (respects hidden state).
  String get displayLocation => locationHidden
      ? 'Unknown \u2014 Your location is hidden even from you'
      : currentLocation;
}

/// Platform channel for iOS/macOS VPN via NEVPNManager.
const _vpnChannel = MethodChannel('com.qdaria.zipminator/vpn');

/// Manages VPN connection state with native iOS integration.
///
/// Uses NEVPNManager with IKEv2 on iOS/macOS.
/// Falls back to UI-only simulation on unsupported platforms.
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

    try {
      final result = await _vpnChannel.invokeMethod<String>('connect', {
        'server': location.server,
        'location': location.displayName,
      });
      if (result == 'connecting') {
        // Poll for connected state (NEVPNManager notifies asynchronously).
        await _pollUntilConnected();
      }
    } on PlatformException catch (e) {
      state = state.copyWith(
        status: VpnStatus.error,
        error: e.message ?? 'VPN connection failed',
      );
    } on MissingPluginException {
      // Platform doesn't support native VPN (web, Linux).
      // Simulate for UI development.
      await Future.delayed(const Duration(seconds: 1));
      state = state.copyWith(status: VpnStatus.connected);
    }
  }

  Future<void> _pollUntilConnected() async {
    for (var i = 0; i < 30; i++) {
      await Future.delayed(const Duration(seconds: 1));
      try {
        final status = await _vpnChannel.invokeMethod<String>('getStatus');
        if (status == 'connected') {
          state = state.copyWith(status: VpnStatus.connected);
          return;
        } else if (status == 'disconnected') {
          state = state.copyWith(
            status: VpnStatus.error,
            error: 'Connection failed — server may be unreachable',
          );
          return;
        }
      } catch (_) {
        break;
      }
    }
    state = state.copyWith(
      status: VpnStatus.error,
      error: 'Connection timed out',
    );
  }

  Future<void> disconnect() async {
    state = state.copyWith(status: VpnStatus.disconnecting);
    try {
      await _vpnChannel.invokeMethod<String>('disconnect');
    } on MissingPluginException {
      // Fallback for unsupported platforms.
    }
    await Future.delayed(const Duration(milliseconds: 300));
    state = state.copyWith(
      status: VpnStatus.disconnected,
      serverAddress: null,
    );
  }

  void toggleKillSwitch() {
    state = state.copyWith(killSwitchEnabled: !state.killSwitchEnabled);
  }

  // --- Location Anonymization ---

  void toggleLocationAnonymization() {
    final enabled = !state.locationAnonymization;
    state = state.copyWith(
      locationAnonymization: enabled,
      // When disabling, also unhide location
      locationHidden: enabled ? state.locationHidden : false,
    );
  }

  void setRotationInterval(RotationInterval interval) {
    state = state.copyWith(rotationInterval: interval);
  }

  void toggleLocationVisibility() {
    state = state.copyWith(locationHidden: !state.locationHidden);
  }

  /// Rotate to a random city (simulated).
  void rotateLocation() {
    final rng = Random();
    String next;
    do {
      next = _rotationCities[rng.nextInt(_rotationCities.length)];
    } while (next == state.currentLocation && _rotationCities.length > 1);
    state = state.copyWith(currentLocation: next);
  }
}

final vpnProvider =
    NotifierProvider<VpnNotifier, VpnState>(VpnNotifier.new);
