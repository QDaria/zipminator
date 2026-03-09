//! Fingerprint resistance JavaScript injection.
//!
//! Generates JavaScript that overrides browser APIs commonly used for device
//! fingerprinting.  The overrides are seeded with a per-session QRNG value
//! so that noise is:
//!   - Deterministic within a session (same seed → same noise every call).
//!   - Different across sessions (new seed each launch).
//!
//! The generated script is injected into every page via Tauri's webview
//! `eval()` API *before* any page script runs.
//!
//! Protections implemented:
//!   1. Canvas fingerprinting  — pixel-level noise added to toDataURL/toBlob.
//!   2. WebGL fingerprinting   — masked renderer/vendor strings, noisy params.
//!   3. AudioContext           — micro-noise on frequency data.
//!   4. Navigator properties   — hardwareConcurrency, deviceMemory, etc.
//!   5. Screen/Window          — dimensions rounded, colorDepth fixed to 24.
//!   6. Font enumeration       — blocked; standard list returned.

use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::privacy::entropy::QrngReader;

/// Configuration for fingerprint resistance.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FingerprintConfig {
    /// Protect canvas API.
    pub canvas: bool,
    /// Protect WebGL API.
    pub webgl: bool,
    /// Protect AudioContext API.
    pub audio: bool,
    /// Standardize navigator properties.
    pub navigator: bool,
    /// Round screen dimensions and fix colorDepth.
    pub screen: bool,
    /// Block font enumeration.
    pub fonts: bool,
    /// Value reported for `navigator.hardwareConcurrency`.
    pub hardware_concurrency: u8,
    /// Value reported for `navigator.deviceMemory`.
    pub device_memory_gb: u8,
}

impl Default for FingerprintConfig {
    fn default() -> Self {
        Self {
            canvas: true,
            webgl: true,
            audio: true,
            navigator: true,
            screen: true,
            fonts: true,
            hardware_concurrency: 4,
            device_memory_gb: 8,
        }
    }
}

/// Generates and caches the injection script for a session.
pub struct FingerprintGuard {
    entropy: Arc<QrngReader>,
    config: FingerprintConfig,
    /// Per-session seed (128 bits split into two u64s).
    seed_lo: u64,
    seed_hi: u64,
}

impl FingerprintGuard {
    /// Create a new guard with a fresh QRNG-derived session seed.
    pub fn new(entropy: Arc<QrngReader>, config: FingerprintConfig) -> Self {
        let seed_lo = entropy.read_u64();
        let seed_hi = entropy.read_u64();
        Self {
            entropy,
            config,
            seed_lo,
            seed_hi,
        }
    }

    /// Regenerate the session seed (call on session rotation).
    pub fn rotate_seed(&mut self) {
        self.seed_lo = self.entropy.read_u64();
        self.seed_hi = self.entropy.read_u64();
    }

    /// Produce the complete JavaScript injection script.
    ///
    /// The returned string should be injected into the webview with
    /// `webview.eval(script)` *before* page content loads.
    pub fn injection_script(&self) -> String {
        let mut parts = Vec::with_capacity(8);
        parts.push(self.header_script());

        if self.config.canvas {
            parts.push(self.canvas_script());
        }
        if self.config.webgl {
            parts.push(self.webgl_script());
        }
        if self.config.audio {
            parts.push(self.audio_script());
        }
        if self.config.navigator {
            parts.push(self.navigator_script());
        }
        if self.config.screen {
            parts.push(self.screen_script());
        }
        if self.config.fonts {
            parts.push(self.font_script());
        }

        parts.join("\n")
    }

    // ── Script fragments ─────────────────────────────────────────────────

    fn header_script(&self) -> String {
        format!(
            r#"(function() {{
  'use strict';
  // ZipBrowser fingerprint resistance — session seed: {lo:016x}{hi:016x}
  // Do not remove this block.
  const __zb_seed_lo = 0x{lo:016x}n;
  const __zb_seed_hi = 0x{hi:016x}n;

  // Simple deterministic PRNG seeded from quantum entropy.
  // xoshiro128** in BigInt arithmetic, outputs 32-bit values.
  let __zb_s0 = Number(BigInt.asUintN(32, __zb_seed_lo));
  let __zb_s1 = Number(BigInt.asUintN(32, __zb_seed_lo >> 32n));
  let __zb_s2 = Number(BigInt.asUintN(32, __zb_seed_hi));
  let __zb_s3 = Number(BigInt.asUintN(32, __zb_seed_hi >> 32n));

  function __zb_rotl(x, k) {{
    return ((x << k) | (x >>> (32 - k))) >>> 0;
  }}

  function __zb_rand() {{
    const result = (__zb_rotl((__zb_s1 * 5) >>> 0, 7) * 9) >>> 0;
    const t = (__zb_s1 << 9) >>> 0;
    __zb_s2 ^= __zb_s0;
    __zb_s3 ^= __zb_s1;
    __zb_s1 ^= __zb_s2;
    __zb_s0 ^= __zb_s3;
    __zb_s2 ^= t;
    __zb_s3 = __zb_rotl(__zb_s3, 11);
    return result;
  }}

  // Noise value in [-1, 1] as a float.
  function __zb_noise() {{
    return (__zb_rand() / 0xFFFFFFFF) * 2 - 1;
  }}
"#,
            lo = self.seed_lo,
            hi = self.seed_hi,
        )
    }

    fn canvas_script(&self) -> String {
        r#"
  // ── Canvas fingerprint resistance ──────────────────────────────────────
  (function() {
    const _toDataURL = HTMLCanvasElement.prototype.toDataURL;
    const _toBlob    = HTMLCanvasElement.prototype.toBlob;

    function noiseContext(canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width, h = canvas.height;
      if (w === 0 || h === 0) return;
      // Add 1-2 pixel noise — imperceptible visually but breaks hashing.
      const imgd = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < imgd.data.length; i += 4) {
        imgd.data[i]     = Math.max(0, Math.min(255, imgd.data[i]     + Math.round(__zb_noise())));
        imgd.data[i + 1] = Math.max(0, Math.min(255, imgd.data[i + 1] + Math.round(__zb_noise())));
        imgd.data[i + 2] = Math.max(0, Math.min(255, imgd.data[i + 2] + Math.round(__zb_noise())));
        // Alpha channel untouched.
      }
      ctx.putImageData(imgd, 0, 0);
    }

    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      noiseContext(this);
      return _toDataURL.apply(this, args);
    };

    HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
      noiseContext(this);
      return _toBlob.call(this, callback, ...args);
    };
  })();
"#
        .to_string()
    }

    fn webgl_script(&self) -> String {
        r#"
  // ── WebGL fingerprint resistance ───────────────────────────────────────
  (function() {
    const _getParameter = WebGLRenderingContext.prototype.getParameter;
    const WEBGL_DEBUG = 'WEBGL_debug_renderer_info';
    const UNMASKED_VENDOR   = 0x9245;
    const UNMASKED_RENDERER = 0x9246;

    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (param === UNMASKED_VENDOR)   return 'WebKit';
      if (param === UNMASKED_RENDERER) return 'WebKit WebGL';
      // Add tiny noise to float parameters to break numeric fingerprints.
      const val = _getParameter.call(this, param);
      if (typeof val === 'number' && !Number.isInteger(val)) {
        return val + __zb_noise() * 1e-7;
      }
      return val;
    };

    // Do the same for WebGL2.
    if (typeof WebGL2RenderingContext !== 'undefined') {
      const _get2 = WebGL2RenderingContext.prototype.getParameter;
      WebGL2RenderingContext.prototype.getParameter = function(param) {
        if (param === UNMASKED_VENDOR)   return 'WebKit';
        if (param === UNMASKED_RENDERER) return 'WebKit WebGL';
        const val = _get2.call(this, param);
        if (typeof val === 'number' && !Number.isInteger(val)) {
          return val + __zb_noise() * 1e-7;
        }
        return val;
      };
    }
  })();
"#
        .to_string()
    }

    fn audio_script(&self) -> String {
        r#"
  // ── AudioContext fingerprint resistance ────────────────────────────────
  (function() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    const _getFloat = AnalyserNode.prototype.getFloatFrequencyData;
    AnalyserNode.prototype.getFloatFrequencyData = function(array) {
      _getFloat.call(this, array);
      // Add imperceptible sub-dB noise to frequency data.
      for (let i = 0; i < array.length; i++) {
        array[i] += __zb_noise() * 0.0001;
      }
    };

    const _getByteFreq = AnalyserNode.prototype.getByteFrequencyData;
    AnalyserNode.prototype.getByteFrequencyData = function(array) {
      _getByteFreq.call(this, array);
      if (__zb_rand() % 8 === 0) {
        // Flip one bit every ~8 calls, imperceptible to the ear.
        const idx = __zb_rand() % array.length;
        array[idx] = Math.max(0, Math.min(255, array[idx] + (__zb_rand() % 3) - 1));
      }
    };
  })();
"#
        .to_string()
    }

    fn navigator_script(&self) -> String {
        let hw = self.config.hardware_concurrency;
        let mem = self.config.device_memory_gb;
        format!(
            r#"
  // ── Navigator fingerprint resistance ──────────────────────────────────
  (function() {{
    const _nav = window.navigator;

    function override(obj, prop, value) {{
      try {{
        Object.defineProperty(obj, prop, {{
          get: () => value,
          configurable: false,
          enumerable: true,
        }});
      }} catch (e) {{
        // Some browsers disallow re-definition; best-effort.
      }}
    }}

    override(_nav, 'hardwareConcurrency', {hw});
    override(_nav, 'deviceMemory', {mem});
    override(_nav, 'languages', Object.freeze(['en-US', 'en']));
    override(_nav, 'platform', 'MacIntel'); // Generic; consistent across sessions.

    // Mask connection info.
    if (_nav.connection) {{
      override(_nav.connection, 'type', 'wifi');
      override(_nav.connection, 'effectiveType', '4g');
    }}
  }})();
"#,
            hw = hw,
            mem = mem,
        )
    }

    fn screen_script(&self) -> String {
        r#"
  // ── Screen/Window fingerprint resistance ──────────────────────────────
  (function() {
    function roundToCommon(dim) {
      // Round to nearest common resolution value.
      const common = [360, 375, 390, 412, 768, 1024, 1280, 1366, 1440, 1536, 1920, 2560];
      return common.reduce((a, b) => Math.abs(b - dim) < Math.abs(a - dim) ? b : a);
    }

    const _screen = window.screen;
    const rw = roundToCommon(_screen.width);
    const rh = roundToCommon(_screen.height);

    function override(obj, prop, value) {
      try {
        Object.defineProperty(obj, prop, { get: () => value, configurable: false });
      } catch (e) {}
    }

    override(_screen, 'width',       rw);
    override(_screen, 'height',      rh);
    override(_screen, 'availWidth',  rw);
    override(_screen, 'availHeight', rh - 40); // Subtract generic taskbar.
    override(_screen, 'colorDepth',  24);
    override(_screen, 'pixelDepth',  24);

    // Outer/inner window dimensions aligned to screen.
    override(window, 'outerWidth',  rw);
    override(window, 'outerHeight', rh);
  })();
"#
        .to_string()
    }

    fn font_script(&self) -> String {
        r#"
  // ── Font enumeration resistance ────────────────────────────────────────
  (function() {
    // Block document.fonts iteration for fingerprinting.
    const _check = FontFaceSet.prototype.check;
    const ALLOWED_FONTS = new Set([
      'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New',
      'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond',
      'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black',
      'Impact', 'monospace', 'sans-serif', 'serif', 'cursive', 'fantasy',
    ]);

    FontFaceSet.prototype.check = function(font, text) {
      // Extract font family name from the CSS font string.
      const match = font.match(/(?:^|\s)([\w\s"'-]+)$/);
      const family = match ? match[1].replace(/['"]/g, '').trim() : '';
      if (ALLOWED_FONTS.has(family)) {
        return _check.call(this, font, text);
      }
      // Report non-standard fonts as not loaded.
      return false;
    };
  })();

}})(); // End of ZipBrowser fingerprint resistance IIFE.
"#
        .to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::privacy::entropy::QrngReader;

    fn make_guard() -> FingerprintGuard {
        let reader = Arc::new(QrngReader::new("/nonexistent/pool.bin"));
        FingerprintGuard::new(reader, FingerprintConfig::default())
    }

    #[test]
    fn script_is_non_empty() {
        let guard = make_guard();
        let script = guard.injection_script();
        assert!(!script.is_empty());
    }

    #[test]
    fn script_contains_canvas_override() {
        let guard = make_guard();
        let script = guard.injection_script();
        assert!(script.contains("toDataURL"));
        assert!(script.contains("noiseContext"));
    }

    #[test]
    fn script_contains_webgl_override() {
        let guard = make_guard();
        let script = guard.injection_script();
        assert!(script.contains("UNMASKED_RENDERER"));
        assert!(script.contains("WebKit WebGL"));
    }

    #[test]
    fn script_contains_navigator_override() {
        let guard = make_guard();
        let script = guard.injection_script();
        assert!(script.contains("hardwareConcurrency"));
        assert!(script.contains("deviceMemory"));
    }

    #[test]
    fn script_contains_screen_override() {
        let guard = make_guard();
        let script = guard.injection_script();
        assert!(script.contains("colorDepth"));
        assert!(script.contains("roundToCommon"));
    }

    #[test]
    fn script_starts_with_iife() {
        let guard = make_guard();
        let script = guard.injection_script();
        assert!(script.trim_start().starts_with("(function() {"));
    }

    #[test]
    fn seed_appears_in_script() {
        let reader = Arc::new(QrngReader::new("/nonexistent/pool.bin"));
        let guard = FingerprintGuard::new(reader, FingerprintConfig::default());
        let script = guard.injection_script();
        // Seed hex values should appear in the header comment.
        assert!(script.contains("session seed:"));
    }

    #[test]
    fn rotate_seed_changes_script() {
        let reader = Arc::new(QrngReader::new("/nonexistent/pool.bin"));
        let mut guard = FingerprintGuard::new(reader, FingerprintConfig::default());
        let script1 = guard.injection_script();
        guard.rotate_seed();
        let script2 = guard.injection_script();
        // Seeds are OS CSPRNG-derived; extremely unlikely to match.
        assert_ne!(script1, script2);
    }

    #[test]
    fn disabled_canvas_omits_canvas_code() {
        let reader = Arc::new(QrngReader::new("/nonexistent/pool.bin"));
        let config = FingerprintConfig {
            canvas: false,
            ..FingerprintConfig::default()
        };
        let guard = FingerprintGuard::new(reader, config);
        let script = guard.injection_script();
        assert!(!script.contains("toDataURL"));
    }
}
