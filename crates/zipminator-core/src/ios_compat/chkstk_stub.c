// Stub for ___chkstk_darwin on iOS.
// This symbol is macOS-only (stack probe for large allocations).
// On aarch64 iOS, the kernel manages stack guard pages, so probing is a no-op.
// Referenced by pqcrypto-kyber AARCH64 assembly (PQClean).
//
// We use inline asm to define the exact symbol name without C name mangling.
__asm__(
    ".globl ___chkstk_darwin\n"
    "___chkstk_darwin:\n"
    "    ret\n"
);
