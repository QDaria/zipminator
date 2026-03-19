fn main() {
    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    let target_arch = std::env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default();

    // iOS aarch64: provide ___chkstk_darwin stub (macOS-only symbol used by
    // pqcrypto-kyber AARCH64 assembly from PQClean).
    if target_os == "ios" && target_arch == "aarch64" {
        cc::Build::new()
            .file("src/ios_compat/chkstk_stub.c")
            .compile("ios_compat");
    }
}
