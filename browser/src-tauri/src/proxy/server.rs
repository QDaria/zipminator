//! HTTP CONNECT proxy server.
//!
//! Listens on a local port and handles CONNECT tunnels for HTTPS.
//! For each CONNECT request:
//! 1. Establish a TLS connection to the upstream server (PQC preferred).
//! 2. Establish a TLS connection back to the client (using our CA-issued leaf cert).
//! 3. Bidirectionally relay data between client and upstream.
//!
//! Plain HTTP requests are forwarded with a warning header.
//!
//! ## VPN integration
//!
//! When the Q-VPN tunnel is active, upstream TCP connections are bound to the
//! tunnel's virtual interface address so that all proxy traffic flows through
//! the WireGuard tunnel.  The tunnel IP is published via the
//! [`set_vpn_tunnel_ip`] / [`clear_vpn_tunnel_ip`] API and stored in a
//! global atomic slot.

use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex as StdMutex};
use std::time::Duration;

use bytes::Bytes;
use http_body_util::Full;
use hyper::body::Incoming;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Method, Request, Response, StatusCode};
use hyper_util::rt::TokioIo;
use tokio::net::{TcpListener, TcpSocket, TcpStream};
use tokio::sync::{broadcast, Semaphore};
use tokio_rustls::TlsAcceptor;

// ── VPN tunnel IP registry ─────────────────────────────────────────────────

/// Whether a VPN tunnel IP is currently set.
static VPN_ACTIVE: AtomicBool = AtomicBool::new(false);

/// The VPN tunnel's local IP address (e.g. `"10.14.0.2"`).
///
/// Protected by a `std::sync::Mutex` because the value is a `String` and
/// cannot be stored in an atomic.  Reads are short-lived; contention is
/// negligible compared to network latency.
static VPN_TUNNEL_IP: once_cell::sync::Lazy<StdMutex<Option<String>>> =
    once_cell::sync::Lazy::new(|| StdMutex::new(None));

/// Inform the proxy that a VPN tunnel is now active at `tunnel_ip`.
///
/// Subsequent upstream connections will be bound to `tunnel_ip` so that
/// proxy traffic flows through the WireGuard tunnel.
///
/// Called by [`crate::vpn::VpnManager`] after the tunnel comes up.
pub fn set_vpn_tunnel_ip(tunnel_ip: impl Into<String>) {
    if let Ok(mut guard) = VPN_TUNNEL_IP.lock() {
        *guard = Some(tunnel_ip.into());
    }
    VPN_ACTIVE.store(true, Ordering::Release);
    tracing::info!("proxy: upstream connections will be routed through the VPN tunnel");
}

/// Clear the VPN tunnel IP so that subsequent upstream connections use the
/// default network interface.
///
/// Called by [`crate::vpn::VpnManager`] on disconnect.
pub fn clear_vpn_tunnel_ip() {
    if let Ok(mut guard) = VPN_TUNNEL_IP.lock() {
        *guard = None;
    }
    VPN_ACTIVE.store(false, Ordering::Release);
    tracing::info!("proxy: VPN tunnel cleared; upstream connections use default route");
}

/// Return the current VPN tunnel bind address, or `None` if no tunnel is active.
fn vpn_bind_addr() -> Option<std::net::IpAddr> {
    if !VPN_ACTIVE.load(Ordering::Acquire) {
        return None;
    }
    let guard = VPN_TUNNEL_IP.lock().ok()?;
    guard.as_deref()?.parse().ok()
}

use super::certificate::CertificateAuthority;
use super::config::{ProxyConfig, ProxyMode};
use super::metrics::MetricsCollector;
use super::pqc_detector::PqcDetector;
use super::tls;

/// Shared state accessible by all connection handlers.
#[derive(Clone)]
pub struct ProxyState {
    pub config: ProxyConfig,
    pub ca: CertificateAuthority,
    pub detector: PqcDetector,
    pub metrics: MetricsCollector,
    /// Limits concurrent connections.
    pub semaphore: Arc<Semaphore>,
    /// Shutdown signal.
    pub shutdown_tx: broadcast::Sender<()>,
}

impl std::fmt::Debug for ProxyState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ProxyState")
            .field("config", &self.config)
            .field("detector", &self.detector)
            .finish()
    }
}

/// Start the proxy server. Returns the address it bound to.
///
/// This function spawns a background task and returns immediately.
/// Send a message on `shutdown_rx` to stop the server.
pub async fn start(
    mut config: ProxyConfig,
    ca: CertificateAuthority,
    shutdown_tx: broadcast::Sender<()>,
) -> Result<SocketAddr, Box<dyn std::error::Error + Send + Sync>> {
    let addr = config.resolve_listen_addr();
    let listener = TcpListener::bind(addr).await?;
    let bound_addr = listener.local_addr()?;

    tracing::info!(%bound_addr, "PQC HTTPS proxy listening");

    let state = ProxyState {
        config,
        ca,
        detector: PqcDetector::new(),
        metrics: MetricsCollector::new(),
        semaphore: Arc::new(Semaphore::new(super::config::MAX_CONCURRENT_CONNECTIONS)),
        shutdown_tx: shutdown_tx.clone(),
    };

    let mut shutdown_rx = shutdown_tx.subscribe();

    tokio::spawn(async move {
        loop {
            tokio::select! {
                accept_result = listener.accept() => {
                    match accept_result {
                        Ok((stream, peer_addr)) => {
                            let state = state.clone();
                            tokio::spawn(async move {
                                if let Err(e) = handle_connection(stream, peer_addr, state).await {
                                    tracing::debug!(%peer_addr, error = %e, "connection error");
                                }
                            });
                        }
                        Err(e) => {
                            tracing::error!(error = %e, "accept failed");
                        }
                    }
                }
                _ = shutdown_rx.recv() => {
                    tracing::info!("proxy server shutting down");
                    break;
                }
            }
        }
    });

    Ok(bound_addr)
}

/// Handle a single incoming connection.
async fn handle_connection(
    stream: TcpStream,
    peer_addr: SocketAddr,
    state: ProxyState,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Acquire a connection permit.
    let _permit = state
        .semaphore
        .clone()
        .acquire_owned()
        .await
        .map_err(|_| "connection limit reached")?;

    tracing::debug!(%peer_addr, "new connection");

    let io = TokioIo::new(stream);
    let state_clone = state.clone();

    http1::Builder::new()
        .preserve_header_case(true)
        .title_case_headers(true)
        .serve_connection(
            io,
            service_fn(move |req| {
                let state = state_clone.clone();
                async move { proxy_request(req, state).await }
            }),
        )
        .with_upgrades()
        .await?;

    Ok(())
}

/// Route a single HTTP request.
///
/// CONNECT requests become HTTPS tunnels; everything else is forwarded
/// as plain HTTP (with a warning).
async fn proxy_request(
    req: Request<Incoming>,
    state: ProxyState,
) -> Result<Response<Full<Bytes>>, Infallible> {
    match *req.method() {
        Method::CONNECT => {
            match handle_connect(req, state).await {
                Ok(resp) => Ok(resp),
                Err(e) => {
                    tracing::error!(error = %e, "CONNECT failed");
                    Ok(error_response(
                        StatusCode::BAD_GATEWAY,
                        &format!("tunnel failed: {e}"),
                    ))
                }
            }
        }
        _ => {
            // Plain HTTP: respond with a redirect-to-HTTPS or a warning.
            tracing::warn!(
                method = %req.method(),
                uri = %req.uri(),
                "plain HTTP request — not proxying"
            );
            Ok(error_response(
                StatusCode::FORBIDDEN,
                "ZipBrowser proxy only handles HTTPS (CONNECT). Plain HTTP is blocked for security.",
            ))
        }
    }
}

/// Handle an HTTP CONNECT request (HTTPS tunnel).
async fn handle_connect(
    req: Request<Incoming>,
    state: ProxyState,
) -> Result<Response<Full<Bytes>>, Box<dyn std::error::Error + Send + Sync>> {
    // Parse the target host:port from the CONNECT URI.
    let authority = req
        .uri()
        .authority()
        .map(|a| a.to_string())
        .or_else(|| {
            req.uri().host().map(|h| {
                let port = req.uri().port_u16().unwrap_or(443);
                format!("{h}:{port}")
            })
        })
        .ok_or("missing CONNECT authority")?;

    let (host, port) = parse_host_port(&authority)?;

    tracing::info!(host, port, "CONNECT tunnel requested");

    // Check bypass list.
    if state.config.should_bypass(&host) {
        tracing::debug!(host, "bypassed — direct tunnel without TLS interception");
        return direct_tunnel(req, &authority).await;
    }

    let require_pqc = state.config.mode == ProxyMode::PqcOnly;

    // Connect to upstream with PQC-preferred TLS.
    // If the VPN tunnel is active, bind the outbound socket to the tunnel's
    // virtual IP so that all proxy traffic flows through WireGuard.
    let upstream_tcp = connect_upstream_tcp(&authority).await?;
    let tls_conn = tls::connect_upstream(upstream_tcp, &host, require_pqc, &state.detector).await;

    match tls_conn {
        Ok(conn) => {
            // Record metrics.
            if conn.pqc_status.is_pqc() {
                state.metrics.record_pqc(
                    &host,
                    &conn.kx_algorithm,
                    conn.handshake_duration,
                );
            } else {
                state.metrics.record_classical(
                    &host,
                    &conn.kx_algorithm,
                    conn.handshake_duration,
                );
            }

            // Now we need to:
            // 1. Respond with 200 to the CONNECT request.
            // 2. Upgrade the client connection.
            // 3. Accept TLS from the client (with our CA-issued leaf cert).
            // 4. Relay data bidirectionally.

            // Respond 200 to the client.
            let resp = Response::builder()
                .status(StatusCode::OK)
                .header("X-ZipBrowser-PQC", conn.pqc_status.description())
                .body(Full::new(Bytes::new()))?;

            // Schedule the bidirectional relay after response is sent.
            // The caller (hyper with_upgrades) will provide the upgraded stream.
            tokio::spawn(async move {
                // Get the upgraded client stream from hyper.
                match hyper::upgrade::on(req).await {
                    Ok(upgraded) => {
                        let client_io = TokioIo::new(upgraded);
                        let (mut upstream_read, mut upstream_write) =
                            tokio::io::split(conn.stream);

                        // Issue a leaf cert for the client-side TLS.
                        match state.ca.server_config_for_domain(&host) {
                            Ok(server_config) => {
                                let acceptor = TlsAcceptor::from(server_config);
                                match acceptor.accept(client_io).await {
                                    Ok(client_tls) => {
                                        let (mut client_read, mut client_write) =
                                            tokio::io::split(client_tls);

                                        // Bidirectional copy with timeout.
                                        let relay = async {
                                            let client_to_upstream = tokio::io::copy(
                                                &mut client_read,
                                                &mut upstream_write,
                                            );
                                            let upstream_to_client = tokio::io::copy(
                                                &mut upstream_read,
                                                &mut client_write,
                                            );
                                            tokio::try_join!(
                                                client_to_upstream,
                                                upstream_to_client
                                            )
                                        };

                                        let timeout = Duration::from_secs(300);
                                        match tokio::time::timeout(timeout, relay).await {
                                            Ok(Ok(_)) => {}
                                            Ok(Err(e)) => {
                                                tracing::debug!(
                                                    host,
                                                    error = %e,
                                                    "relay ended"
                                                );
                                            }
                                            Err(_) => {
                                                tracing::debug!(host, "relay timed out");
                                            }
                                        }
                                    }
                                    Err(e) => {
                                        // Client-side TLS failed. The client stream
                                        // has been consumed by the failed accept;
                                        // we cannot fall back to raw relay.
                                        tracing::warn!(
                                            host,
                                            error = %e,
                                            "client TLS accept failed — connection dropped"
                                        );
                                    }
                                }
                            }
                            Err(e) => {
                                tracing::error!(host, error = %e, "leaf cert generation failed");
                            }
                        }
                    }
                    Err(e) => {
                        tracing::error!(error = %e, "upgrade failed");
                    }
                }
            });

            Ok(resp)
        }
        Err(tls::TlsError::PqcRequired) => {
            state.metrics.record_failure(&host, "PQC required but not supported");
            Ok(error_response(
                StatusCode::BAD_GATEWAY,
                &format!(
                    "PQC required: {host} does not support post-quantum key exchange"
                ),
            ))
        }
        Err(e) => {
            state.metrics.record_failure(&host, &e.to_string());
            Err(Box::new(e))
        }
    }
}

/// Create a direct (non-intercepting) tunnel for bypassed domains.
async fn direct_tunnel(
    req: Request<Incoming>,
    authority: &str,
) -> Result<Response<Full<Bytes>>, Box<dyn std::error::Error + Send + Sync>> {
    let authority = authority.to_string();

    let resp = Response::builder()
        .status(StatusCode::OK)
        .body(Full::new(Bytes::new()))?;

    tokio::spawn(async move {
        match hyper::upgrade::on(req).await {
            Ok(upgraded) => {
                match TcpStream::connect(&authority).await {
                    Ok(upstream) => {
                        let client = TokioIo::new(upgraded);
                        let (mut upstream_read, mut upstream_write) =
                            tokio::io::split(upstream);
                        let (mut client_read, mut client_write) =
                            tokio::io::split(client);

                        let _ = tokio::try_join!(
                            tokio::io::copy(&mut client_read, &mut upstream_write),
                            tokio::io::copy(&mut upstream_read, &mut client_write),
                        );
                    }
                    Err(e) => {
                        tracing::error!(authority, error = %e, "direct tunnel connect failed");
                    }
                }
            }
            Err(e) => {
                tracing::error!(error = %e, "direct tunnel upgrade failed");
            }
        }
    });

    Ok(resp)
}

/// Connect a TCP stream to `authority` (a `"host:port"` string).
///
/// When the VPN tunnel is active the socket is first bound to the tunnel's
/// virtual IP address, causing the OS to route the TCP connection through the
/// WireGuard interface rather than the default interface.
///
/// The `authority` string may contain a hostname that requires DNS resolution,
/// so we resolve it via `tokio::net::lookup_host` before creating the bound
/// socket.  When no VPN is active we fall back to `TcpStream::connect` which
/// performs resolution and connection in one step.
async fn connect_upstream_tcp(
    authority: &str,
) -> Result<TcpStream, Box<dyn std::error::Error + Send + Sync>> {
    if let Some(bind_ip) = vpn_bind_addr() {
        // Resolve the authority to a socket address.
        let resolved: SocketAddr = tokio::net::lookup_host(authority)
            .await?
            .next()
            .ok_or("DNS resolution returned no addresses")?;

        // Bind to the VPN tunnel interface's address.
        let bind_addr = SocketAddr::new(bind_ip, 0);
        let socket = if bind_ip.is_ipv6() {
            TcpSocket::new_v6()?
        } else {
            TcpSocket::new_v4()?
        };
        socket.bind(bind_addr)?;
        let stream = socket.connect(resolved).await?;
        tracing::debug!(
            authority,
            bind = %bind_addr,
            resolved = %resolved,
            "upstream TCP bound to VPN tunnel interface"
        );
        Ok(stream)
    } else {
        // Default path: let the OS choose the source address/interface.
        Ok(TcpStream::connect(authority).await?)
    }
}

/// Parse "host:port" from a CONNECT authority string.
fn parse_host_port(authority: &str) -> Result<(String, u16), Box<dyn std::error::Error + Send + Sync>> {
    if let Some(colon_pos) = authority.rfind(':') {
        let host = authority[..colon_pos].to_string();
        let port: u16 = authority[colon_pos + 1..].parse()?;
        Ok((host, port))
    } else {
        Ok((authority.to_string(), 443))
    }
}

/// Build a simple error response.
fn error_response(status: StatusCode, message: &str) -> Response<Full<Bytes>> {
    Response::builder()
        .status(status)
        .header("Content-Type", "text/plain")
        .header("X-ZipBrowser-Proxy", "true")
        .body(Full::new(Bytes::from(message.to_string())))
        .unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_host_port_with_port() {
        let (host, port) = parse_host_port("example.com:8443").unwrap();
        assert_eq!(host, "example.com");
        assert_eq!(port, 8443);
    }

    #[test]
    fn parse_host_port_default() {
        let (host, port) = parse_host_port("example.com").unwrap();
        assert_eq!(host, "example.com");
        assert_eq!(port, 443);
    }

    #[test]
    fn error_response_format() {
        let resp = error_response(StatusCode::BAD_GATEWAY, "test error");
        assert_eq!(resp.status(), StatusCode::BAD_GATEWAY);
    }
}
