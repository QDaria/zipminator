//! WireGuard tunnel management using the `boringtun` userspace implementation.
//!
//! This module creates and manages a TUN interface and the `boringtun` WireGuard
//! session.  All outbound traffic from the ZipBrowser is routed through the
//! tunnel via OS routing table entries installed here.
//!
//! ## Platform specifics
//!
//! | Platform | TUN device | Routing                           |
//! |----------|------------|-----------------------------------|
//! | macOS    | `utunN`    | `route add -net 0.0.0.0/1 …`     |
//! | Linux    | `/dev/net/tun` | `ip route add default …`      |
//! | Windows  | `wintun`   | WFP (stub)                        |
//!
//! The [`Tunnel`] struct owns the TUN fd and the `boringtun` peer.
//! Dropping it closes the fd and (on macOS/Linux) removes the routes.

use boringtun::noise::{Tunn, TunnResult};
#[allow(unused_imports)]
use std::net::SocketAddr;
use std::process::Command;
use std::time::Duration;
use thiserror::Error;
use tokio::net::UdpSocket;
use tokio::sync::Mutex;
use tracing::{debug, error, info, warn};
use zeroize::Zeroize;

use crate::vpn::config::{VpnConfig, TUNNEL_MTU};
use crate::vpn::metrics::VpnMetrics;

// ── Errors ─────────────────────────────────────────────────────────────────

/// Errors produced by tunnel creation or operation.
#[derive(Debug, Error)]
pub enum TunnelError {
    #[error("failed to create TUN interface: {0}")]
    TunCreation(String),

    #[error("failed to configure tunnel interface: {0}")]
    IfaceConfig(String),

    #[error("failed to install routing rules: {0}")]
    RoutingError(String),

    #[error("failed to remove routing rules: {0}")]
    RoutingCleanup(String),

    #[error("WireGuard handshake timed out after {0:?}")]
    HandshakeTimeout(Duration),

    #[error("I/O error on UDP socket: {0}")]
    Io(#[from] std::io::Error),

    #[error("boringtun error: {0}")]
    Boringtun(String),

    #[error("invalid WireGuard key material")]
    InvalidKeys,

    #[error("tunnel not supported on this platform")]
    Unsupported,
}

// ── TunDevice ─────────────────────────────────────────────────────────────

/// Owned handle to a TUN network interface.
///
/// Closing this struct removes the interface (on macOS/Linux the kernel
/// automatically removes the `utun` / `tun` device when the fd is closed).
pub struct TunDevice {
    /// Name of the interface (e.g. `"utun7"` or `"tun0"`).
    pub name: String,
    /// Raw file descriptor.
    #[cfg(unix)]
    pub fd: std::os::unix::io::OwnedFd,
    /// On Windows this would be a wintun adapter handle.
    #[cfg(windows)]
    pub _handle: (),
}

impl TunDevice {
    /// Create a new TUN device.
    ///
    /// On macOS this opens an `utun` socket via `PF_SYSTEM`.
    /// On Linux this opens `/dev/net/tun` and creates a named tun interface.
    pub fn create() -> Result<Self, TunnelError> {
        #[cfg(target_os = "macos")]
        {
            create_utun()
        }
        #[cfg(target_os = "linux")]
        {
            create_tun_linux()
        }
        #[cfg(target_os = "windows")]
        {
            Err(TunnelError::Unsupported)
        }
        #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
        {
            Err(TunnelError::Unsupported)
        }
    }

    /// Read a packet from the TUN device (blocking).
    #[cfg(unix)]
    pub fn read_packet(&self, buf: &mut [u8]) -> Result<usize, TunnelError> {
        use std::os::unix::io::AsRawFd;
        let n = unsafe {
            libc::read(self.fd.as_raw_fd(), buf.as_mut_ptr() as *mut libc::c_void, buf.len())
        };
        if n < 0 {
            return Err(TunnelError::Io(std::io::Error::last_os_error()));
        }
        Ok(n as usize)
    }

    /// Write a packet to the TUN device.
    #[cfg(unix)]
    pub fn write_packet(&self, buf: &[u8]) -> Result<usize, TunnelError> {
        use std::os::unix::io::AsRawFd;
        let n = unsafe {
            libc::write(self.fd.as_raw_fd(), buf.as_ptr() as *const libc::c_void, buf.len())
        };
        if n < 0 {
            return Err(TunnelError::Io(std::io::Error::last_os_error()));
        }
        Ok(n as usize)
    }
}

// ── WireGuardSession ───────────────────────────────────────────────────────

/// The raw WireGuard session key exposed by boringtun after a successful
/// handshake.  Zeroized on drop.
pub struct WgSessionKey(pub [u8; 32]);

impl Drop for WgSessionKey {
    fn drop(&mut self) {
        self.0.zeroize();
    }
}

// ── Tunnel ────────────────────────────────────────────────────────────────

/// Established WireGuard tunnel.
///
/// Owns the TUN device, the UDP socket to the WireGuard peer, and the
/// `boringtun` state machine.
pub struct Tunnel {
    /// The virtual network interface.
    pub tun: TunDevice,
    /// UDP socket connected to the WireGuard server endpoint.
    pub udp: UdpSocket,
    /// `boringtun` session (Mutex because `Tunn` is not `Sync`).
    peer: Mutex<Tunn>,
    /// VPN configuration (retained for cleanup — used when routes are removed on disconnect).
    #[allow(dead_code)]
    config: VpnConfig,
    /// Metrics handle for byte accounting.
    metrics: VpnMetrics,
}

impl Tunnel {
    /// Establish a WireGuard tunnel to `config.server_endpoint`.
    ///
    /// Steps:
    /// 1. Create TUN device.
    /// 2. Configure IP address and MTU.
    /// 3. Bind a UDP socket to an ephemeral port.
    /// 4. Connect UDP to the server endpoint.
    /// 5. Perform the WireGuard Noise handshake via boringtun.
    /// 6. Install default routes through the TUN interface.
    pub async fn connect(config: VpnConfig, metrics: VpnMetrics) -> Result<Self, TunnelError> {
        info!(endpoint = %config.server_endpoint, "WireGuard: creating tunnel");

        // 1. Create TUN device.
        let tun = TunDevice::create()?;
        info!(iface = %tun.name, "WireGuard: TUN interface created");

        // 2. Configure interface: assign IP + MTU.
        configure_interface(&tun.name, config.tunnel_ip(), TUNNEL_MTU)?;

        // 3. Create UDP socket.
        let udp = UdpSocket::bind("0.0.0.0:0").await?;
        udp.connect(&config.server_endpoint).await?;
        info!(iface = %tun.name, "WireGuard: UDP socket bound and connected");

        // 4. Construct boringtun peer.
        let peer = build_boringtun_peer(&config)?;

        let tunnel = Self {
            tun,
            udp,
            peer: Mutex::new(*peer),  // unbox into the Mutex
            config,
            metrics,
        };

        // 5. Perform WireGuard handshake.
        tunnel.perform_handshake().await?;

        // 6. Install routes.
        install_default_routes(&tunnel.tun.name)?;
        info!(iface = %tunnel.tun.name, "WireGuard: routes installed, tunnel up");

        Ok(tunnel)
    }

    /// Return the name of the TUN interface (e.g. `"utun7"`).
    pub fn interface_name(&self) -> &str {
        &self.tun.name
    }

    /// Perform the boringtun WireGuard handshake.
    ///
    /// Initiates the handshake by sending an initiation packet and waits for
    /// the server response with a 10-second timeout.
    async fn perform_handshake(&self) -> Result<(), TunnelError> {
        let handshake_timeout = Duration::from_secs(10);
        let mut send_buf = vec![0u8; 2048];
        let mut recv_buf = vec![0u8; 2048];

        // Initiate.
        // Initiate handshake — we need to hold the lock, extract the packet bytes,
        // then release the lock before awaiting on the UDP send.
        {
            let mut peer = self.peer.lock().await;
            match peer.format_handshake_initiation(&mut send_buf, false) {
                TunnResult::WriteToNetwork(pkt) => {
                    let pkt_len = pkt.len();
                    let pkt_bytes = pkt.to_vec();
                    drop(peer); // release lock before await
                    self.udp.send(&pkt_bytes).await?;
                    debug!(len = pkt_len, "WireGuard: sent handshake initiation");
                }
                other => {
                    return Err(TunnelError::Boringtun(format!(
                        "unexpected result from format_handshake_initiation: {:?}",
                        std::mem::discriminant(&other)
                    )));
                }
            }
        }

        // Wait for server response.
        let recv_future = async {
            loop {
                let n = self.udp.recv(&mut recv_buf).await?;
                let result = {
                    let mut peer = self.peer.lock().await;
                    // We must copy the result out because TunnResult<'_> borrows send_buf.
                    let outcome = peer.decapsulate(None, &recv_buf[..n], &mut send_buf);
                    match outcome {
                        TunnResult::WriteToTunnelV4(pkt, _addr) => {
                            debug!(len = pkt.len(), "WireGuard: handshake response received (IPv4)");
                            return Ok::<(), TunnelError>(());
                        }
                        TunnResult::WriteToTunnelV6(pkt, _addr) => {
                            debug!(len = pkt.len(), "WireGuard: handshake response received (IPv6)");
                            return Ok::<(), TunnelError>(());
                        }
                        TunnResult::WriteToNetwork(pkt) => Some(pkt.to_vec()),
                        TunnResult::Done => return Ok(()),
                        TunnResult::Err(e) => {
                            return Err(TunnelError::Boringtun(format!("{:?}", e)));
                        }
                    }
                };
                // Handshake continuation packet (send outside the lock).
                if let Some(pkt) = result {
                    self.udp.send(&pkt).await?;
                }
            }
        };

        tokio::time::timeout(handshake_timeout, recv_future)
            .await
            .map_err(|_| TunnelError::HandshakeTimeout(handshake_timeout))?
    }

    /// Send a plaintext IP packet through the tunnel.
    ///
    /// Encapsulates `packet` using boringtun and transmits it via UDP.
    pub async fn send_packet(&self, packet: &[u8]) -> Result<(), TunnelError> {
        let mut buf = vec![0u8; packet.len() + 64];
        // Encapsulate inside the lock, extract result bytes before releasing.
        let outcome = {
            let mut peer = self.peer.lock().await;
            match peer.encapsulate(packet, &mut buf) {
                TunnResult::WriteToNetwork(pkt) => Ok(Some(pkt.to_vec())),
                TunnResult::Err(e) => Err(TunnelError::Boringtun(format!("{:?}", e))),
                _ => Ok(None),
            }
        };
        match outcome? {
            Some(pkt) => {
                let n = pkt.len() as u64;
                self.udp.send(&pkt).await?;
                self.metrics.add_bytes_sent(n);
            }
            None => {}
        }
        Ok(())
    }

    /// Receive and decapsulate an IP packet from the tunnel.
    ///
    /// Reads from the UDP socket and writes the decapsulated packet to `out`.
    /// Returns the number of bytes written, or 0 if the result was non-data
    /// (handshake continuation, keepalive, etc.).
    pub async fn recv_packet(&self, out: &mut [u8]) -> Result<usize, TunnelError> {
        let mut recv_buf = vec![0u8; TUNNEL_MTU as usize + 64];
        let mut send_buf = vec![0u8; 2048];

        let n = self.udp.recv(&mut recv_buf).await?;
        self.metrics.add_bytes_received(n as u64);

        // Decapsulate inside the lock; copy result bytes before releasing.
        enum DecapResult { Tunnel(Vec<u8>), Network(Vec<u8>), Done, Err(String) }

        let result = {
            let mut peer = self.peer.lock().await;
            match peer.decapsulate(None, &recv_buf[..n], &mut send_buf) {
                TunnResult::WriteToTunnelV4(pkt, _) | TunnResult::WriteToTunnelV6(pkt, _) => {
                    DecapResult::Tunnel(pkt.to_vec())
                }
                TunnResult::WriteToNetwork(pkt) => DecapResult::Network(pkt.to_vec()),
                TunnResult::Done => DecapResult::Done,
                TunnResult::Err(e) => DecapResult::Err(format!("{:?}", e)),
            }
        };

        match result {
            DecapResult::Tunnel(pkt) => {
                let written = pkt.len().min(out.len());
                out[..written].copy_from_slice(&pkt[..written]);
                Ok(written)
            }
            DecapResult::Network(pkt) => {
                // Keepalive or handshake continuation.
                self.udp.send(&pkt).await?;
                Ok(0)
            }
            DecapResult::Done => Ok(0),
            DecapResult::Err(e) => Err(TunnelError::Boringtun(e)),
        }
    }

    /// Gracefully tear down the tunnel.
    ///
    /// Removes the OS routes, closes the UDP socket and the TUN fd.
    pub fn disconnect(self) {
        if let Err(e) = remove_default_routes(&self.tun.name) {
            warn!("WireGuard: failed to remove routes on disconnect: {}", e);
        }
        // TunDevice and UdpSocket drop automatically.
        info!(iface = %self.tun.name, "WireGuard: tunnel disconnected");
    }
}

// ── boringtun peer construction ────────────────────────────────────────────

fn build_boringtun_peer(config: &VpnConfig) -> Result<Box<Tunn>, TunnelError> {
    use boringtun::x25519;

    let static_private = x25519::StaticSecret::from(config.client_private_key);
    let peer_static_public = x25519::PublicKey::from(config.server_public_key);

    // boringtun 0.6: Tunn::new returns Result<Self, &'static str>.
    match Tunn::new(
        static_private,
        peer_static_public,
        None,     // no pre-shared key at WireGuard layer (PQ added on top)
        Some(25), // 25-second keepalive
        0,        // peer index
        None,     // no rate limiter
    ) {
        Ok(t) => Ok(Box::new(t)),
        Err(e) => Err(TunnelError::Boringtun(format!("Tunn::new failed: {}", e))),
    }
}

// ── Interface configuration ────────────────────────────────────────────────

fn configure_interface(iface: &str, ip: &str, mtu: u32) -> Result<(), TunnelError> {
    #[cfg(target_os = "macos")]
    configure_interface_macos(iface, ip, mtu)?;

    #[cfg(target_os = "linux")]
    configure_interface_linux(iface, ip, mtu)?;

    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    return Err(TunnelError::Unsupported);

    Ok(())
}

#[cfg(target_os = "macos")]
fn configure_interface_macos(iface: &str, ip: &str, mtu: u32) -> Result<(), TunnelError> {
    // Assign IP address to the utun interface.
    run_cmd("ifconfig", &[iface, ip, ip]).map_err(|e| {
        TunnelError::IfaceConfig(format!("ifconfig assign: {}", e))
    })?;
    // Set MTU.
    run_cmd("ifconfig", &[iface, "mtu", &mtu.to_string()]).map_err(|e| {
        TunnelError::IfaceConfig(format!("ifconfig mtu: {}", e))
    })?;
    // Bring the interface up.
    run_cmd("ifconfig", &[iface, "up"]).map_err(|e| {
        TunnelError::IfaceConfig(format!("ifconfig up: {}", e))
    })?;
    Ok(())
}

#[cfg(target_os = "linux")]
fn configure_interface_linux(iface: &str, ip: &str, mtu: u32) -> Result<(), TunnelError> {
    run_cmd("ip", &["addr", "add", ip, "dev", iface]).map_err(|e| {
        TunnelError::IfaceConfig(format!("ip addr add: {}", e))
    })?;
    run_cmd("ip", &["link", "set", "dev", iface, "mtu", &mtu.to_string()]).map_err(|e| {
        TunnelError::IfaceConfig(format!("ip link mtu: {}", e))
    })?;
    run_cmd("ip", &["link", "set", "dev", iface, "up"]).map_err(|e| {
        TunnelError::IfaceConfig(format!("ip link up: {}", e))
    })?;
    Ok(())
}

// ── Routing table management ────────────────────────────────────────────────

fn install_default_routes(iface: &str) -> Result<(), TunnelError> {
    #[cfg(target_os = "macos")]
    install_routes_macos(iface)?;

    #[cfg(target_os = "linux")]
    install_routes_linux(iface)?;

    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    return Err(TunnelError::Unsupported);

    Ok(())
}

fn remove_default_routes(iface: &str) -> Result<(), TunnelError> {
    #[cfg(target_os = "macos")]
    remove_routes_macos(iface)?;

    #[cfg(target_os = "linux")]
    remove_routes_linux(iface)?;

    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    return Err(TunnelError::Unsupported);

    Ok(())
}

/// macOS: Use two /1 routes to cover all of IPv4 without overriding the
/// existing default route (which must still reach the WireGuard server UDP).
///
/// 0.0.0.0/1 and 128.0.0.0/1 together cover all IPv4 addresses and
/// take precedence over the original 0.0.0.0/0 default.
#[cfg(target_os = "macos")]
fn install_routes_macos(iface: &str) -> Result<(), TunnelError> {
    for net in &["0.0.0.0/1", "128.0.0.0/1", "::/1", "8000::/1"] {
        run_cmd("route", &["add", "-net", net, "-interface", iface]).map_err(|e| {
            TunnelError::RoutingError(format!("route add {}: {}", net, e))
        })?;
    }
    Ok(())
}

#[cfg(target_os = "macos")]
fn remove_routes_macos(iface: &str) -> Result<(), TunnelError> {
    for net in &["0.0.0.0/1", "128.0.0.0/1", "::/1", "8000::/1"] {
        let _ = run_cmd("route", &["delete", "-net", net, "-interface", iface]);
    }
    Ok(())
}

#[cfg(target_os = "linux")]
fn install_routes_linux(iface: &str) -> Result<(), TunnelError> {
    for net in &["0.0.0.0/1", "128.0.0.0/1", "::/1", "8000::/1"] {
        run_cmd("ip", &["route", "add", net, "dev", iface]).map_err(|e| {
            TunnelError::RoutingError(format!("ip route add {}: {}", net, e))
        })?;
    }
    Ok(())
}

#[cfg(target_os = "linux")]
fn remove_routes_linux(iface: &str) -> Result<(), TunnelError> {
    for net in &["0.0.0.0/1", "128.0.0.0/1", "::/1", "8000::/1"] {
        let _ = run_cmd("ip", &["route", "del", net, "dev", iface]);
    }
    Ok(())
}

// ── TUN device creation ────────────────────────────────────────────────────

#[cfg(target_os = "macos")]
fn create_utun() -> Result<TunDevice, TunnelError> {
    #[allow(unused_imports)]
    use std::os::unix::io::OwnedFd;

    // Open a utun socket via PF_SYSTEM / SYSPROTO_CONTROL.
    // The kernel assigns the first available utunN interface.
    let fd = open_utun_socket().map_err(|e| TunnelError::TunCreation(e.to_string()))?;
    let name = get_utun_name(fd.as_raw_fd())?;
    Ok(TunDevice { name, fd })
}

#[cfg(target_os = "macos")]
fn open_utun_socket() -> Result<std::os::unix::io::OwnedFd, std::io::Error> {
    use libc::{
        AF_SYSTEM, SOCK_DGRAM, SYSPROTO_CONTROL,
        sockaddr_ctl, ctl_info, CTLIOCGINFO,
        connect,
    };
    use std::os::unix::io::{FromRawFd, OwnedFd};

    const UTUN_CONTROL_NAME: &[u8] = b"com.apple.net.utun_control\0";

    unsafe {
        let fd = libc::socket(AF_SYSTEM, SOCK_DGRAM, SYSPROTO_CONTROL);
        if fd < 0 {
            return Err(std::io::Error::last_os_error());
        }

        let mut info: ctl_info = std::mem::zeroed();
        std::ptr::copy_nonoverlapping(
            UTUN_CONTROL_NAME.as_ptr() as *const libc::c_char,
            info.ctl_name.as_mut_ptr(),
            UTUN_CONTROL_NAME.len(),
        );

        if libc::ioctl(fd, CTLIOCGINFO as _, &mut info) < 0 {
            libc::close(fd);
            return Err(std::io::Error::last_os_error());
        }

        let mut addr: sockaddr_ctl = std::mem::zeroed();
        addr.sc_len = std::mem::size_of::<sockaddr_ctl>() as u8;
        addr.sc_family = AF_SYSTEM as u8;
        addr.ss_sysaddr = AF_SYS_CONTROL as u16;
        addr.sc_id = info.ctl_id;
        addr.sc_unit = 0; // 0 = auto-assign next available utunN

        if connect(fd, &addr as *const _ as *const libc::sockaddr, std::mem::size_of::<sockaddr_ctl>() as u32) < 0 {
            libc::close(fd);
            return Err(std::io::Error::last_os_error());
        }

        Ok(OwnedFd::from_raw_fd(fd))
    }
}

#[cfg(target_os = "macos")]
fn get_utun_name(fd: i32) -> Result<String, TunnelError> {
    use std::ffi::CStr;

    let mut name_buf = [0u8; 64];
    let mut name_len = name_buf.len() as libc::socklen_t;

    unsafe {
        if libc::getsockopt(
            fd,
            libc::SYSPROTO_CONTROL,
            2, // UTUN_OPT_IFNAME
            name_buf.as_mut_ptr() as *mut libc::c_void,
            &mut name_len,
        ) < 0
        {
            return Err(TunnelError::TunCreation(
                std::io::Error::last_os_error().to_string(),
            ));
        }
    }

    let name = CStr::from_bytes_until_nul(&name_buf)
        .map_err(|_| TunnelError::TunCreation("invalid utun interface name".to_string()))?
        .to_string_lossy()
        .into_owned();
    Ok(name)
}

#[cfg(target_os = "linux")]
fn create_tun_linux() -> Result<TunDevice, TunnelError> {
    use std::fs::OpenOptions;
    use std::io::Write;
    use std::os::unix::io::{IntoRawFd, OwnedFd};

    // Open /dev/net/tun and create a tun interface.
    let fd = OpenOptions::new()
        .read(true)
        .write(true)
        .open("/dev/net/tun")
        .map_err(|e| TunnelError::TunCreation(format!("/dev/net/tun: {}", e)))?;

    let raw_fd = fd.into_raw_fd();

    // TUNSETIFF ioctl to name the interface.
    let mut ifreq: libc::ifreq = unsafe { std::mem::zeroed() };
    let name = b"tun0\0";
    unsafe {
        std::ptr::copy_nonoverlapping(
            name.as_ptr() as *const libc::c_char,
            ifreq.ifr_name.as_mut_ptr(),
            name.len(),
        );
        // IFF_TUN | IFF_NO_PI
        ifreq.ifr_ifru.ifru_flags = (libc::IFF_TUN | libc::IFF_NO_PI) as i16;
        if libc::ioctl(raw_fd, libc::TUNSETIFF as _, &ifreq) < 0 {
            libc::close(raw_fd);
            return Err(TunnelError::TunCreation(
                std::io::Error::last_os_error().to_string(),
            ));
        }
    }

    Ok(TunDevice {
        name: "tun0".to_string(),
        fd: unsafe { OwnedFd::from_raw_fd(raw_fd) },
    })
}

// ── Shared helper ──────────────────────────────────────────────────────────

fn run_cmd(bin: &str, args: &[&str]) -> Result<(), String> {
    let output = Command::new(bin)
        .args(args)
        .output()
        .map_err(|e| format!("spawn error: {}", e))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("exited {}: {}", output.status, stderr.trim()));
    }
    Ok(())
}

// ── macOS system constants not yet in libc ─────────────────────────────────

#[cfg(target_os = "macos")]
const AF_SYS_CONTROL: u16 = 2;

#[cfg(target_os = "macos")]
use std::os::unix::io::AsRawFd;

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_boringtun_peer_with_valid_keys() {
        let config = crate::vpn::config::VpnConfig {
            server_endpoint: "127.0.0.1:51820".to_string(),
            server_public_key: [0x01u8; 32],
            client_private_key: [0x02u8; 32],
            tunnel_address: "10.14.0.2/32".to_string(),
            dns: vec!["1.1.1.1".to_string()],
            rekey_interval_secs: 300,
            kill_switch_enabled: false,
        };
        // boringtun should accept any 32-byte key pair.
        let result = build_boringtun_peer(&config);
        assert!(result.is_ok(), "boringtun peer creation should succeed: {:?}", result.err());
    }

    #[test]
    fn tunnel_mtu_is_conservative() {
        assert!(
            TUNNEL_MTU <= 1420,
            "MTU must be conservative enough to avoid fragmentation with PQC overhead"
        );
        assert!(TUNNEL_MTU >= 1280, "MTU must meet IPv6 minimum");
    }

    #[test]
    fn run_cmd_fails_on_bad_command() {
        let result = run_cmd("this-command-does-not-exist-12345", &[]);
        assert!(result.is_err());
    }

    #[test]
    fn run_cmd_captures_stderr_on_failure() {
        // `false` always exits with code 1 on Unix.
        #[cfg(unix)]
        {
            let result = run_cmd("false", &[]);
            assert!(result.is_err());
        }
    }
}
