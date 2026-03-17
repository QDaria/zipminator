//! Criterion benchmarks for Kyber-768 Rust implementation
//!
//! Run with: cargo bench -p zipminator-bench

use criterion::{black_box, criterion_group, criterion_main, Criterion};
use zipminator_core::*;

fn bench_keygen(c: &mut Criterion) {
    c.bench_function("kyber768_keygen", |b| {
        b.iter(|| {
            let _ = black_box(Kyber768::keypair());
        });
    });
}

fn bench_encaps(c: &mut Criterion) {
    let (pk, _) = Kyber768::keypair();

    c.bench_function("kyber768_encaps", |b| {
        b.iter(|| {
            let _ = black_box(Kyber768::encapsulate(&pk));
        });
    });
}

fn bench_decaps(c: &mut Criterion) {
    let (pk, sk) = Kyber768::keypair();
    let (ct, _) = Kyber768::encapsulate(&pk);

    c.bench_function("kyber768_decaps", |b| {
        b.iter(|| {
            let _ = black_box(Kyber768::decapsulate(&ct, &sk));
        });
    });
}

fn bench_full_operation(c: &mut Criterion) {
    c.bench_function("kyber768_full", |b| {
        b.iter(|| {
            let (pk, sk) = Kyber768::keypair();
            let (ct, _) = Kyber768::encapsulate(&pk);
            let _ = black_box(Kyber768::decapsulate(&ct, &sk));
        });
    });
}

fn bench_ntt(c: &mut Criterion) {
    use zipminator_core::ntt::ntt;
    let mut poly = [0i16; 256];
    for i in 0..256 {
        poly[i] = (i as i16) % 3329;
    }

    c.bench_function("ntt_forward", |b| {
        let mut p = poly;
        b.iter(|| {
            ntt(black_box(&mut p));
        });
    });
}

criterion_group!(
    benches,
    bench_keygen,
    bench_encaps,
    bench_decaps,
    bench_full_operation,
    bench_ntt
);
criterion_main!(benches);
