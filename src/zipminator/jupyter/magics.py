"""IPython magic commands for Zipminator PQC."""

from __future__ import annotations

import time
from typing import Optional

from IPython.core.magic import Magics, magics_class, line_magic, cell_magic
from IPython.display import display, HTML

from zipminator.crypto.pqc import PQC
from zipminator.crypto.quantum_random import QuantumEntropyPool

from . import display as fmt


def _get_pqc() -> PQC:
    return PQC(level=768)


@magics_class
class ZipminatorMagics(Magics):

    @line_magic
    def keygen(self, line: str) -> None:
        """Generate a Kyber768 keypair.

        Usage: %keygen [--seed quantum]
        Stores `pk` and `sk` in the user namespace.
        """
        args = line.strip().split()
        use_quantum = "--seed" in args and "quantum" in args

        pqc = _get_pqc()
        seed: Optional[bytes] = None

        if use_quantum:
            pool = QuantumEntropyPool()
            seed = pool.get_bytes(32)

        t0 = time.perf_counter()
        pk, sk = pqc.generate_keypair(seed=seed)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        self.shell.user_ns["pk"] = pk
        self.shell.user_ns["sk"] = sk

        display(HTML(fmt.render_keygen_result(pk, sk, elapsed_ms, quantum_seed=use_quantum)))

    @line_magic
    def encrypt(self, line: str) -> None:
        """Encapsulate a shared secret from a public key variable.

        Usage: %encrypt pk
        Stores `ct` and `ss` in the user namespace.
        """
        var_name = line.strip() or "pk"
        pk = self.shell.user_ns.get(var_name)
        if pk is None:
            print(f"Variable '{var_name}' not found. Run %keygen first.")
            return

        pqc = _get_pqc()
        t0 = time.perf_counter()
        ct, ss = pqc.encapsulate(pk)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        self.shell.user_ns["ct"] = ct
        self.shell.user_ns["shared_secret"] = ss

        display(HTML(fmt.render_encapsulate_result(ct, ss, elapsed_ms)))

    @line_magic
    def decrypt(self, line: str) -> None:
        """Decapsulate ciphertext with a secret key.

        Usage: %decrypt ct sk
        Stores `ss_dec` in the user namespace.
        """
        parts = line.strip().split()
        ct_var = parts[0] if len(parts) > 0 else "ct"
        sk_var = parts[1] if len(parts) > 1 else "sk"

        ct = self.shell.user_ns.get(ct_var)
        sk = self.shell.user_ns.get(sk_var)

        if ct is None:
            print(f"Variable '{ct_var}' not found. Run %encrypt first.")
            return
        if sk is None:
            print(f"Variable '{sk_var}' not found. Run %keygen first.")
            return

        pqc = _get_pqc()
        t0 = time.perf_counter()
        ss = pqc.decapsulate(sk, ct)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        self.shell.user_ns["recovered"] = ss

        display(HTML(fmt.render_decapsulate_result(ss, elapsed_ms)))

    @line_magic
    def entropy_status(self, line: str) -> None:
        """Show quantum entropy pool statistics.

        Usage: %entropy_status
        """
        pool = QuantumEntropyPool()
        stats = pool.get_stats()
        display(HTML(fmt.render_entropy_status(stats)))

    @line_magic
    def pii_scan(self, line: str) -> None:
        """Scan a DataFrame variable for PII.

        Usage: %pii_scan df_name
        """
        var_name = line.strip() or "df"
        df = self.shell.user_ns.get(var_name)
        if df is None:
            print(f"Variable '{var_name}' not found in namespace.")
            return

        try:
            import pandas as pd
        except ImportError:
            print("pandas is required for PII scanning.")
            return

        if not isinstance(df, pd.DataFrame):
            print(f"'{var_name}' is not a pandas DataFrame.")
            return

        from zipminator.crypto.pii_scanner import PIIScanner

        scanner = PIIScanner()
        results = scanner.scan_dataframe(df)
        display(HTML(fmt.render_pii_results(results)))

    @line_magic
    def zipminator_info(self, line: str) -> None:
        """Print SDK version and backend info.

        Usage: %zipminator_info
        """
        display(HTML(fmt.render_info()))

    @cell_magic
    def benchmark(self, line: str, cell: str) -> None:
        """Benchmark keygen/encaps/decaps over N rounds.

        Usage: %%benchmark 100
        (cell body is ignored)
        """
        try:
            rounds = int(line.strip()) if line.strip() else 100
        except ValueError:
            rounds = 100

        pqc = _get_pqc()

        keygen_total = 0.0
        encaps_total = 0.0
        decaps_total = 0.0

        for _ in range(rounds):
            t0 = time.perf_counter()
            pk, sk = pqc.generate_keypair()
            keygen_total += time.perf_counter() - t0

            t0 = time.perf_counter()
            ct, ss = pqc.encapsulate(pk)
            encaps_total += time.perf_counter() - t0

            t0 = time.perf_counter()
            ss_dec = pqc.decapsulate(sk, ct)
            decaps_total += time.perf_counter() - t0

            assert ss == ss_dec, "Shared secret mismatch!"

        display(HTML(fmt.render_benchmark(
            rounds=rounds,
            keygen_ms=(keygen_total / rounds) * 1000,
            encaps_ms=(encaps_total / rounds) * 1000,
            decaps_ms=(decaps_total / rounds) * 1000,
        )))
