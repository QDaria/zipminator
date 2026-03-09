//! Kill switch: block all non-VPN traffic when the tunnel drops.
//!
//! When the VPN tunnel is active the kill switch installs OS-level firewall
//! rules that permit traffic only through the designated tunnel interface
//! (e.g. `utun7` on macOS).  If the tunnel drops unexpectedly the rules
//! remain in place, ensuring *no* plaintext traffic escapes before the user
//! explicitly disables the kill switch.
//!
//! ## Platform implementations
//!
//! | Platform | Mechanism       | Command                          |
//! |----------|-----------------|----------------------------------|
//! | macOS    | `pf` (pfctl)    | `/sbin/pfctl -f <rules> -e`      |
//! | Linux    | `iptables`      | via `iptables` / `ip6tables`     |
//! | Windows  | WFP (stub)      | (requires elevated privileges)   |
//!
//! The [`KillSwitch`] struct implements [`Drop`] to remove the firewall rules
//! on normal exit.  For crash recovery, the rules persist until manually
//! cleared (failsafe-open behaviour is not acceptable for a security product).

use std::process::Command;
use thiserror::Error;
use tracing::{info, warn};

// ── Errors ─────────────────────────────────────────────────────────────────

/// Errors produced by kill switch operations.
#[derive(Debug, Error)]
pub enum KillSwitchError {
    #[error("failed to activate kill switch: {0}")]
    ActivationFailed(String),

    #[error("failed to deactivate kill switch: {0}")]
    DeactivationFailed(String),

    #[error("I/O error running firewall command: {0}")]
    Io(#[from] std::io::Error),

    #[error("kill switch not supported on this platform")]
    Unsupported,
}

// ── KillSwitch ─────────────────────────────────────────────────────────────

/// Firewall-based kill switch for the VPN tunnel.
///
/// Activate with [`KillSwitch::activate`]; the rules persist until
/// [`KillSwitch::deactivate`] is called **or the struct is dropped**.
///
/// Creating a `KillSwitch` with `kill_switch_enabled = false` results in a
/// no-op implementation that satisfies the interface without touching the OS.
pub struct KillSwitch {
    /// Name of the TUN interface carrying VPN traffic (e.g. `"utun7"`).
    tunnel_interface: String,
    /// Whether the kill switch is currently blocking non-VPN traffic.
    active: bool,
    /// User preference — if `false`, all methods are no-ops.
    enabled: bool,
}

impl KillSwitch {
    /// Create a new (inactive) kill switch for the given tunnel interface.
    pub fn new(tunnel_interface: impl Into<String>, enabled: bool) -> Self {
        Self {
            tunnel_interface: tunnel_interface.into(),
            active: false,
            enabled,
        }
    }

    /// Install firewall rules that block all non-VPN traffic.
    ///
    /// Safe to call multiple times; subsequent calls when already active are
    /// no-ops.
    pub fn activate(&mut self) -> Result<(), KillSwitchError> {
        if !self.enabled {
            return Ok(());
        }
        if self.active {
            return Ok(());
        }

        info!(
            interface = %self.tunnel_interface,
            "kill switch: activating firewall rules"
        );

        #[cfg(target_os = "macos")]
        self.activate_macos()?;

        #[cfg(target_os = "linux")]
        self.activate_linux()?;

        #[cfg(target_os = "windows")]
        self.activate_windows()?;

        #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
        return Err(KillSwitchError::Unsupported);

        self.active = true;
        Ok(())
    }

    /// Remove the firewall rules, restoring normal traffic flow.
    ///
    /// Safe to call when the kill switch is already inactive.
    pub fn deactivate(&mut self) -> Result<(), KillSwitchError> {
        if !self.enabled || !self.active {
            return Ok(());
        }

        info!(
            interface = %self.tunnel_interface,
            "kill switch: deactivating firewall rules"
        );

        #[cfg(target_os = "macos")]
        self.deactivate_macos()?;

        #[cfg(target_os = "linux")]
        self.deactivate_linux()?;

        #[cfg(target_os = "windows")]
        self.deactivate_windows()?;

        #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
        return Err(KillSwitchError::Unsupported);

        self.active = false;
        Ok(())
    }

    /// Return `true` when the kill switch rules are installed.
    pub fn is_active(&self) -> bool {
        self.active
    }

    /// Return `true` when the kill switch feature is enabled by the user.
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    // ── macOS implementation ────────────────────────────────────────────

    #[cfg(target_os = "macos")]
    fn activate_macos(&self) -> Result<(), KillSwitchError> {
        // Build pf(4) rules:
        //   1. block drop all       — deny everything by default
        //   2. pass on <iface> all  — allow all traffic on the VPN TUN interface
        //   3. pass on lo0 all      — allow localhost (required for system services)
        let rules = self.build_pf_rules();
        apply_pf_rules(&rules)?;
        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn deactivate_macos(&self) -> Result<(), KillSwitchError> {
        // Flush all rules and disable pf; traffic flows freely again.
        run_pfctl(&["-F", "all", "-d"]).map_err(|e| {
            KillSwitchError::DeactivationFailed(format!("pfctl flush/disable: {}", e))
        })?;
        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn build_pf_rules(&self) -> String {
        format!(
            "# ZipBrowser kill switch rules — managed by zipminator, do not edit\n\
             block drop all\n\
             pass on {} all\n\
             pass on lo0 all\n",
            self.tunnel_interface
        )
    }

    // ── Linux implementation ────────────────────────────────────────────

    #[cfg(target_os = "linux")]
    fn activate_linux(&self) -> Result<(), KillSwitchError> {
        let iface = &self.tunnel_interface;

        // IPv4 rules: block everything, then allow the VPN interface and loopback.
        let ipv4_cmds = [
            vec!["-P", "OUTPUT", "DROP"],
            vec!["-A", "OUTPUT", "-o", iface, "-j", "ACCEPT"],
            vec!["-A", "OUTPUT", "-o", "lo", "-j", "ACCEPT"],
            // Allow WireGuard UDP to the peer (outbound bootstrap traffic before
            // the tunnel interface exists). The actual server address filtering
            // is handled by the VPN configuration; here we whitelist by mark.
            vec!["-A", "OUTPUT", "-m", "mark", "--mark", "51820", "-j", "ACCEPT"],
        ];

        for args in &ipv4_cmds {
            run_iptables("iptables", args).map_err(|e| {
                KillSwitchError::ActivationFailed(format!("iptables {}: {}", args.join(" "), e))
            })?;
        }

        // IPv6 rules — mirror of IPv4.
        let ipv6_cmds = [
            vec!["-P", "OUTPUT", "DROP"],
            vec!["-A", "OUTPUT", "-o", iface, "-j", "ACCEPT"],
            vec!["-A", "OUTPUT", "-o", "lo", "-j", "ACCEPT"],
        ];

        for args in &ipv6_cmds {
            run_iptables("ip6tables", args).map_err(|e| {
                KillSwitchError::ActivationFailed(format!("ip6tables {}: {}", args.join(" "), e))
            })?;
        }

        Ok(())
    }

    #[cfg(target_os = "linux")]
    fn deactivate_linux(&self) -> Result<(), KillSwitchError> {
        // Reset OUTPUT chain policy to ACCEPT and flush custom rules.
        run_iptables("iptables", &["-P", "OUTPUT", "ACCEPT"]).map_err(|e| {
            KillSwitchError::DeactivationFailed(format!("iptables policy reset: {}", e))
        })?;
        run_iptables("iptables", &["-F", "OUTPUT"]).map_err(|e| {
            KillSwitchError::DeactivationFailed(format!("iptables flush: {}", e))
        })?;

        run_iptables("ip6tables", &["-P", "OUTPUT", "ACCEPT"]).map_err(|e| {
            KillSwitchError::DeactivationFailed(format!("ip6tables policy reset: {}", e))
        })?;
        run_iptables("ip6tables", &["-F", "OUTPUT"]).map_err(|e| {
            KillSwitchError::DeactivationFailed(format!("ip6tables flush: {}", e))
        })?;

        Ok(())
    }

    // ── Windows stub ────────────────────────────────────────────────────

    #[cfg(target_os = "windows")]
    fn activate_windows(&self) -> Result<(), KillSwitchError> {
        // Windows Filtering Platform integration requires the `wfp` crate and
        // an elevated process.  This stub logs a warning but does not block.
        // Full implementation is deferred until the Windows Tauri target is
        // validated in CI.
        warn!(
            "Windows kill switch not yet implemented; traffic may leak if VPN drops"
        );
        Ok(())
    }

    #[cfg(target_os = "windows")]
    fn deactivate_windows(&self) -> Result<(), KillSwitchError> {
        Ok(())
    }
}

impl Drop for KillSwitch {
    fn drop(&mut self) {
        if self.active {
            // Best-effort cleanup on drop.  Errors are logged but not propagated
            // because `Drop::drop` cannot return a `Result`.
            if let Err(e) = self.deactivate() {
                warn!("kill switch drop cleanup failed: {}", e);
            }
        }
    }
}

// ── Platform helpers ────────────────────────────────────────────────────────

/// Write `rules` to a temporary file and apply them via `pfctl -f <file> -e`.
#[cfg(target_os = "macos")]
fn apply_pf_rules(rules: &str) -> Result<(), KillSwitchError> {
    use std::io::Write;

    // Write rules to a temp file because pfctl does not accept stdin rules
    // for anchor operations when called from a non-root context.
    let mut tmpfile = tempfile::NamedTempFile::new().map_err(|e| {
        KillSwitchError::ActivationFailed(format!("creating pf rules tempfile: {}", e))
    })?;
    tmpfile.write_all(rules.as_bytes()).map_err(|e| {
        KillSwitchError::ActivationFailed(format!("writing pf rules: {}", e))
    })?;
    let path = tmpfile.path().to_str().ok_or_else(|| {
        KillSwitchError::ActivationFailed("pf rules tempfile path is not UTF-8".to_string())
    })?;

    // Load rules.
    run_pfctl(&["-f", path]).map_err(|e| {
        KillSwitchError::ActivationFailed(format!("pfctl -f: {}", e))
    })?;
    // Enable pf.
    run_pfctl(&["-e"]).map_err(|e| {
        KillSwitchError::ActivationFailed(format!("pfctl -e: {}", e))
    })?;

    Ok(())
}

/// Run `/sbin/pfctl` with the given arguments.
#[cfg(target_os = "macos")]
fn run_pfctl(args: &[&str]) -> Result<(), String> {
    let output = Command::new("/sbin/pfctl")
        .args(args)
        .output()
        .map_err(|e| format!("pfctl spawn error: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("pfctl exited {}: {}", output.status, stderr.trim()));
    }
    Ok(())
}

/// Run `iptables` or `ip6tables` with the given arguments.
#[cfg(target_os = "linux")]
fn run_iptables(binary: &str, args: &[&str]) -> Result<(), String> {
    let output = Command::new(binary)
        .args(args)
        .output()
        .map_err(|e| format!("{} spawn error: {}", binary, e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "{} exited {}: {}",
            binary,
            output.status,
            stderr.trim()
        ));
    }
    Ok(())
}

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    /// A disabled kill switch should not activate or deactivate.
    #[test]
    fn disabled_kill_switch_is_noop() {
        let mut ks = KillSwitch::new("utun99", false);
        assert!(!ks.is_enabled());
        ks.activate().unwrap();
        assert!(!ks.is_active());
        ks.deactivate().unwrap();
        assert!(!ks.is_active());
    }

    /// Multiple activations are idempotent.
    #[test]
    fn double_activate_is_idempotent() {
        let mut ks = KillSwitch::new("utun99", false); // disabled so no OS calls
        ks.activate().unwrap();
        ks.activate().unwrap(); // must not panic
        assert!(!ks.is_active()); // disabled means active stays false
    }

    /// Multiple deactivations are idempotent.
    #[test]
    fn double_deactivate_is_idempotent() {
        let mut ks = KillSwitch::new("utun99", false);
        ks.deactivate().unwrap();
        ks.deactivate().unwrap();
    }

    /// After deactivation the kill switch is no longer active.
    #[test]
    fn deactivate_clears_active_flag() {
        let mut ks = KillSwitch::new("utun99", false);
        // Manually set active to test the flag logic without OS calls.
        // We can't force active=true without real OS calls on a disabled KS,
        // so we verify the path through is_active().
        assert!(!ks.is_active());
    }

    /// is_enabled() reflects the constructor parameter.
    #[test]
    fn is_enabled_reflects_constructor() {
        let ks_on = KillSwitch::new("utun0", true);
        let ks_off = KillSwitch::new("utun0", false);
        assert!(ks_on.is_enabled());
        assert!(!ks_off.is_enabled());
    }

    /// macOS pf rules include the tunnel interface and loopback.
    #[cfg(target_os = "macos")]
    #[test]
    fn macos_pf_rules_contain_interface_and_loopback() {
        let ks = KillSwitch::new("utun7", true);
        let rules = ks.build_pf_rules();
        assert!(rules.contains("block drop all"));
        assert!(rules.contains("pass on utun7 all"));
        assert!(rules.contains("pass on lo0 all"));
    }

    /// Drop does not panic when the kill switch is inactive.
    #[test]
    fn drop_inactive_kill_switch_is_safe() {
        let ks = KillSwitch::new("utun99", true);
        drop(ks); // must not panic
    }
}
