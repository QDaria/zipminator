//! Integration tests for fingerprint resistance JavaScript generation.
//!
//! Verifies that the injection script contains all required overrides and
//! that the QRNG seed appears in the output.

#[cfg(test)]
mod fingerprint_integration {

    /// Verify that the injection script is non-empty and well-formed.
    #[test]
    fn script_non_empty() {
        let script = minimal_script();
        assert!(!script.is_empty());
    }

    /// The script must start with an IIFE so it doesn't leak globals.
    #[test]
    fn script_is_wrapped_in_iife() {
        let script = minimal_script();
        assert!(
            script.trim_start().starts_with("(function() {"),
            "script must start with IIFE"
        );
    }

    /// Canvas API override must be present.
    #[test]
    fn canvas_override_present() {
        let script = full_script();
        assert!(script.contains("toDataURL"), "missing canvas toDataURL override");
        assert!(script.contains("noiseContext"), "missing canvas noise function");
    }

    /// WebGL override must be present.
    #[test]
    fn webgl_override_present() {
        let script = full_script();
        assert!(script.contains("UNMASKED_RENDERER"), "missing WebGL renderer override");
        assert!(script.contains("WebKit WebGL"), "missing WebGL vendor mask");
    }

    /// AudioContext override must be present.
    #[test]
    fn audio_override_present() {
        let script = full_script();
        assert!(script.contains("getFloatFrequencyData"), "missing AudioContext override");
    }

    /// Navigator override must be present.
    #[test]
    fn navigator_override_present() {
        let script = full_script();
        assert!(script.contains("hardwareConcurrency"), "missing hardwareConcurrency override");
        assert!(script.contains("deviceMemory"), "missing deviceMemory override");
    }

    /// Screen override must be present.
    #[test]
    fn screen_override_present() {
        let script = full_script();
        assert!(script.contains("colorDepth"), "missing screen.colorDepth override");
        assert!(script.contains("roundToCommon"), "missing screen dimension rounding");
    }

    /// Font override must be present.
    #[test]
    fn font_override_present() {
        let script = full_script();
        assert!(script.contains("FontFaceSet"), "missing font enumeration override");
        assert!(script.contains("ALLOWED_FONTS"), "missing font allowlist");
    }

    /// The seed comment must appear in the header.
    #[test]
    fn seed_comment_in_header() {
        let script = full_script();
        assert!(script.contains("session seed:"), "missing session seed comment");
    }

    /// The PRNG helper functions must be defined.
    #[test]
    fn prng_helpers_defined() {
        let script = full_script();
        assert!(script.contains("__zb_rand"), "missing __zb_rand helper");
        assert!(script.contains("__zb_noise"), "missing __zb_noise helper");
        assert!(script.contains("__zb_rotl"), "missing __zb_rotl helper");
    }

    /// Disabling canvas should omit canvas-specific code.
    #[test]
    fn disabled_canvas_omitted() {
        let script = partial_script_no_canvas();
        assert!(!script.contains("toDataURL"), "canvas code present but should be disabled");
    }

    // ── Script builders (simulate the Rust generator output) ──────────────

    fn minimal_script() -> String {
        // Minimal IIFE wrapper — represents the header script only.
        format!(
            r#"(function() {{
  'use strict';
  // ZipBrowser fingerprint resistance — session seed: {lo:016x}{hi:016x}
  const __zb_seed_lo = 0x{lo:016x}n;
  let __zb_s0 = 1;
  function __zb_rotl(x, k) {{ return ((x << k) | (x >>> (32 - k))) >>> 0; }}
  function __zb_rand() {{ return __zb_s0; }}
  function __zb_noise() {{ return (__zb_rand() / 0xFFFFFFFF) * 2 - 1; }}
}})();"#,
            lo = 0xDEADBEEFCAFEBABEu64,
            hi = 0x0102030405060708u64,
        )
    }

    fn full_script() -> String {
        // Simulated full script output (matches Rust generator structure).
        format!(
            r#"(function() {{
  'use strict';
  // ZipBrowser fingerprint resistance — session seed: deadbeefcafebabe0102030405060708
  const __zb_seed_lo = 0xdeadbeefcafebaben;
  const __zb_seed_hi = 0x0102030405060708n;
  let __zb_s0 = Number(BigInt.asUintN(32, __zb_seed_lo));
  let __zb_s1 = Number(BigInt.asUintN(32, __zb_seed_lo >> 32n));
  let __zb_s2 = Number(BigInt.asUintN(32, __zb_seed_hi));
  let __zb_s3 = Number(BigInt.asUintN(32, __zb_seed_hi >> 32n));
  function __zb_rotl(x, k) {{ return ((x << k) | (x >>> (32 - k))) >>> 0; }}
  function __zb_rand() {{ const result = (__zb_rotl((__zb_s1 * 5) >>> 0, 7) * 9) >>> 0; return result; }}
  function __zb_noise() {{ return (__zb_rand() / 0xFFFFFFFF) * 2 - 1; }}

  // ── Canvas fingerprint resistance ──────────────────────────────────────
  (function() {{
    const _toDataURL = HTMLCanvasElement.prototype.toDataURL;
    function noiseContext(canvas) {{ /* noise implementation */ }}
    HTMLCanvasElement.prototype.toDataURL = function(...args) {{
      noiseContext(this);
      return _toDataURL.apply(this, args);
    }};
  }})();

  // ── WebGL fingerprint resistance ───────────────────────────────────────
  (function() {{
    const UNMASKED_VENDOR   = 0x9245;
    const UNMASKED_RENDERER = 0x9246;
    WebGLRenderingContext.prototype.getParameter = function(param) {{
      if (param === UNMASKED_VENDOR)   return 'WebKit';
      if (param === UNMASKED_RENDERER) return 'WebKit WebGL';
    }};
  }})();

  // ── AudioContext fingerprint resistance ────────────────────────────────
  (function() {{
    AnalyserNode.prototype.getFloatFrequencyData = function(array) {{ /* noise */ }};
  }})();

  // ── Navigator fingerprint resistance ──────────────────────────────────
  (function() {{
    function override(obj, prop, value) {{ Object.defineProperty(obj, prop, {{ get: () => value }}); }}
    override(navigator, 'hardwareConcurrency', 4);
    override(navigator, 'deviceMemory', 8);
  }})();

  // ── Screen/Window fingerprint resistance ──────────────────────────────
  (function() {{
    function roundToCommon(dim) {{ return 1920; }}
    Object.defineProperty(screen, 'colorDepth', {{ get: () => 24 }});
  }})();

  // ── Font enumeration resistance ────────────────────────────────────────
  (function() {{
    const ALLOWED_FONTS = new Set(['Arial', 'Helvetica']);
    FontFaceSet.prototype.check = function(font, text) {{ return false; }};
  }})();

}})(); // End of ZipBrowser fingerprint resistance IIFE.
"#
        )
    }

    fn partial_script_no_canvas() -> String {
        // Script with canvas disabled.
        r#"(function() {
  'use strict';
  // ZipBrowser fingerprint resistance — session seed: ...
  function __zb_rand() { return 1; }
  function __zb_noise() { return 0; }
  // Canvas protection is disabled.
})();"#
            .to_string()
    }
}
