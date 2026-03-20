#!/usr/bin/env python3
"""Zipminator CLI — Post-Quantum Cryptography tools."""

import sys
import os
from typing import Optional

try:
    import typer
    from rich.console import Console
    from rich.panel import Panel
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich import print as rprint
except ImportError:
    print("CLI requires 'typer' and 'rich'. Install with: pip install zipminator[cli]")
    sys.exit(1)

from zipminator.crypto.pqc import PQC
from zipminator.crypto.quantum_random import QuantumRandom


app = typer.Typer(
    name="zipminator",
    help="Zipminator: World-Class Post-Quantum Cryptography & Quantum Entropy",
    add_completion=False,
)
console = Console()


@app.command()
def keygen(
    output_dir: str = typer.Option(".", help="Directory to save keys"),
    entropy_file: Optional[str] = typer.Option(
        None, help="Path to quantum entropy file (32 bytes required)"
    ),
):
    """
    Generate a CRYSTALS-Kyber-768 keypair (FIPS 203).
    Uses Real Quantum Entropy if available.
    """
    console.print(
        Panel.fit("🔐 Generating Kyber-768 Keypair...", style="bold blue"))

    # Locate entropy source
    seed = None
    entropy_source_path = entropy_file

    # If no file provided, look for default pools
    if not entropy_source_path:
        default_pools = [
            "quantum_entropy/quantum_entropy_pool.bin",
            "quantum_entropy/entropy_pool.bin",
        ]
        for pool in default_pools:
            if os.path.exists(pool):
                entropy_source_path = pool
                break

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:

        if entropy_source_path and os.path.exists(entropy_source_path):
            progress.add_task(
                description=f"Harvesting Quantum Entropy from {os.path.basename(entropy_source_path)}...", total=None)
            try:
                with open(entropy_source_path, "rb") as f:
                    seed = f.read(32)
                if len(seed) < 32:
                    rprint(
                        f"[yellow]⚠ Warning: Entropy file too small. Using pseudo-randomness.[/yellow]")
                    seed = None
            except Exception as e:
                rprint(f"[red]⚠ Error reading entropy: {e}[/red]")
                seed = None
        else:
            progress.add_task(
                description="No entropy pool found. Using system randomness...", total=None)

        progress.add_task(
            description="Initializing PQC Engine (Rust Accelerated)...", total=None)
        pqc = PQC()
        pk, sk = pqc.generate_keypair(seed=seed)

    pk_path = os.path.join(output_dir, "public_key.bin")
    sk_path = os.path.join(output_dir, "secret_key.bin")

    with open(pk_path, "wb") as f:
        f.write(pk)
    with open(sk_path, "wb") as f:
        f.write(sk)

    rprint(f"[green]✅ Keys generated successfully![/green]")
    if seed:
        rprint(
            f"   🌌 Source: [bold magenta]Real Quantum Entropy[/bold magenta] ({os.path.basename(entropy_source_path)})")
    else:
        rprint(
            f"   💻 Source: [yellow]System Randomness (Pseudo-Quantum)[/yellow]")

    rprint(f"   📂 Public Key: [bold]{pk_path}[/bold] ({len(pk)} bytes)")
    rprint(f"   📂 Secret Key: [bold]{sk_path}[/bold] ({len(sk)} bytes)")


@app.command()
def entropy(
    bits: int = typer.Option(256, help="Number of random bits to generate"),
    provider_name: Optional[str] = typer.Option(
        None, "--provider", help="Force specific provider (ibm, rigetti, qbraid, api)"
    ),
):
    """
    Generate quantum entropy from available providers.
    """
    console.print(Panel.fit(
        f"🎲 Generating {bits} bits of Quantum Entropy", style="bold magenta"))

    try:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            task = progress.add_task(
                description="Generating quantum entropy...", total=None)
            qrand = QuantumRandom()
            entropy_bytes = qrand.randbytes(bits // 8)
            progress.update(
                task, description="Entropy generated")

        source = "Quantum Pool" if qrand._has_quantum_access else "System Random"
        rprint(
            f"[green]✅ Success![/green] Source: [bold blue]{source}[/bold blue]")
        console.print(Panel(f"{entropy_bytes.hex()}",
                      title="Quantum Entropy", border_style="green"))

    except Exception as e:
        rprint(f"[bold red]❌ Error:[/bold red] {e}")
        sys.exit(1)


@app.command()
def anonymize(
    input_file: str = typer.Argument(..., help="Path to input CSV file"),
    output_file: str = typer.Argument(..., help="Path to output CSV file"),
    level: int = typer.Option(3, "--level", "-l", min=1, max=10,
                              help="Anonymization level (1-10, default 3)"),
):
    """
    Anonymize a CSV file using the 10-level PQC anonymization system.

    Applies the specified level to ALL columns in the input CSV.
    """
    import pandas as pd
    from zipminator.anonymizer import AdvancedAnonymizer

    if not os.path.isfile(input_file):
        rprint(f"[bold red]Error:[/bold red] File not found: {input_file}")
        raise typer.Exit(code=1)

    console.print(Panel.fit(
        f"Anonymizing [bold]{input_file}[/bold] at level {level}/10",
        style="bold cyan",
    ))

    try:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description="Reading CSV...", total=None)
            df = pd.read_csv(input_file)

            level_map = {col: level for col in df.columns}

            progress.add_task(description="Applying anonymization...", total=None)
            anon = AdvancedAnonymizer()
            result = anon.process(df, level_map)

            progress.add_task(description="Writing output...", total=None)
            result.to_csv(output_file, index=False)

        rprint(f"[green]Done.[/green] {len(df)} rows anonymized -> [bold]{output_file}[/bold]")
        rprint(f"   Columns: {', '.join(df.columns)}")
        rprint(f"   Level: {level}/10")

    except pd.errors.EmptyDataError:
        rprint("[bold red]Error:[/bold red] Input CSV is empty.")
        raise typer.Exit(code=1)
    except Exception as e:
        rprint(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command()
def encrypt(
    input_file: str = typer.Argument(..., help="File to encrypt (CSV, JSON, Parquet, or any)"),
    output_file: Optional[str] = typer.Option(None, "--output", "-o", help="Output path (default: input_file.zip.enc)"),
    key_dir: str = typer.Option(".", "--key-dir", "-k", help="Directory containing public_key.bin"),
    password: Optional[str] = typer.Option(None, "--password", "-p", help="Use password instead of PQC keys (legacy mode)"),
    level: int = typer.Option(0, "--anonymize", "-a", min=0, max=10,
                              help="Anonymize CSV at this level before encrypting (0=skip)"),
    scan_pii: bool = typer.Option(True, "--pii-scan/--no-pii-scan", help="Scan for PII before encryption"),
):
    """
    Encrypt a file using ML-KEM-768 (Quantum Vault).

    By default uses the keypair from --key-dir (public_key.bin).
    Falls back to password mode if no keys found.
    Run 'zipminator keygen' first to generate keys.
    """
    if not os.path.isfile(input_file):
        rprint(f"[bold red]Error:[/bold red] File not found: {input_file}")
        raise typer.Exit(code=1)

    out_path = output_file or f"{input_file}.zip.enc"

    # PII scan
    if scan_pii and input_file.endswith(".csv"):
        try:
            from zipminator.crypto.pii_scanner import PIIScanner
            import pandas as pd
            scanner = PIIScanner()
            df = pd.read_csv(input_file)
            results = scanner.scan(df)
            if results.get("pii_detected"):
                rprint(f"[yellow]PII detected:[/yellow] {', '.join(results.get('types', []))}")
                rprint(f"   Risk level: [bold]{results.get('risk_level', 'unknown')}[/bold]")
                if level == 0:
                    rprint("   Tip: use --anonymize N to scrub PII before encrypting")
        except Exception:
            pass

    # Anonymize if requested
    if level > 0 and input_file.endswith(".csv"):
        try:
            import pandas as pd
            from zipminator.anonymizer import AdvancedAnonymizer
            df = pd.read_csv(input_file)
            level_map = {col: level for col in df.columns}
            df = AdvancedAnonymizer().process(df, level_map)
            # Write anonymized to temp, encrypt that
            import tempfile
            tmp = tempfile.NamedTemporaryFile(suffix=".csv", delete=False)
            df.to_csv(tmp.name, index=False)
            input_file = tmp.name
            rprint(f"[cyan]Anonymized at L{level} before encryption[/cyan]")
        except Exception as e:
            rprint(f"[yellow]Anonymization skipped: {e}[/yellow]")

    # Determine encryption mode
    pk_path = os.path.join(key_dir, "public_key.bin")

    if password:
        # Legacy password mode
        _encrypt_password(input_file, out_path, password)
    elif os.path.isfile(pk_path):
        # PQC mode (Quantum Vault)
        _encrypt_pqc(input_file, out_path, pk_path)
    else:
        # No keys, no password — prompt
        rprint("[yellow]No PQC keys found. Run 'zipminator keygen' first, or use --password.[/yellow]")
        import getpass
        pw = getpass.getpass("Enter encryption password (legacy mode): ")
        if not pw:
            rprint("[red]Empty password. Aborting.[/red]")
            raise typer.Exit(code=1)
        _encrypt_password(input_file, out_path, pw)

    rprint(f"[green]Encrypted:[/green] [bold]{out_path}[/bold]")


def _encrypt_pqc(input_file: str, output_file: str, pk_path: str):
    """Encrypt using ML-KEM-768 public key."""
    pqc = PQC()

    with open(pk_path, "rb") as f:
        pk_bytes = f.read()

    # Read file content
    with open(input_file, "rb") as f:
        plaintext = f.read()

    # Encapsulate to get shared secret
    ct, shared_secret = pqc.encapsulate(pk_bytes)

    # AES-256-GCM encrypt with shared secret
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    nonce = os.urandom(12)
    aesgcm = AESGCM(shared_secret)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)

    # Write envelope: [4-byte ct_len][ct][12-byte nonce][ciphertext]
    import struct
    with open(output_file, "wb") as f:
        f.write(b"ZPQC")  # magic
        f.write(struct.pack("<I", len(ct)))
        f.write(ct)
        f.write(nonce)
        f.write(ciphertext)

    console.print(f"   Mode: [bold magenta]ML-KEM-768 (Post-Quantum)[/bold magenta]")
    console.print(f"   Key: {pk_path}")


def _encrypt_password(input_file: str, output_file: str, password: str):
    """Encrypt using password-based AES ZIP (legacy mode)."""
    import pyzipper
    with pyzipper.AESZipFile(output_file, "w",
                              compression=pyzipper.ZIP_DEFLATED,
                              encryption=pyzipper.WZ_AES) as zf:
        zf.setpassword(password.encode())
        zf.write(input_file, os.path.basename(input_file))
    console.print(f"   Mode: [yellow]Password AES (legacy)[/yellow]")


@app.command()
def decrypt(
    input_file: str = typer.Argument(..., help="Encrypted file (.zip.enc or .zip)"),
    output_file: Optional[str] = typer.Option(None, "--output", "-o", help="Output path"),
    key_dir: str = typer.Option(".", "--key-dir", "-k", help="Directory containing secret_key.bin"),
    password: Optional[str] = typer.Option(None, "--password", "-p", help="Password for legacy mode"),
):
    """
    Decrypt a file using ML-KEM-768 (Quantum Vault) or password.

    Automatically detects PQC vs password-encrypted files.
    """
    if not os.path.isfile(input_file):
        rprint(f"[bold red]Error:[/bold red] File not found: {input_file}")
        raise typer.Exit(code=1)

    # Detect format by magic bytes
    with open(input_file, "rb") as f:
        magic = f.read(4)

    if magic == b"ZPQC":
        # PQC encrypted
        sk_path = os.path.join(key_dir, "secret_key.bin")
        if not os.path.isfile(sk_path):
            rprint(f"[red]Secret key not found: {sk_path}[/red]")
            rprint("Run 'zipminator keygen' first, using the same key directory.")
            raise typer.Exit(code=1)
        out = output_file or input_file.replace(".zip.enc", "").replace(".enc", "")
        _decrypt_pqc(input_file, out, sk_path)
    else:
        # Legacy password ZIP
        if not password:
            import getpass
            password = getpass.getpass("Enter decryption password: ")
        out = output_file or os.path.splitext(input_file)[0]
        _decrypt_password(input_file, out, password)

    rprint(f"[green]Decrypted:[/green] [bold]{out}[/bold]")


def _decrypt_pqc(input_file: str, output_file: str, sk_path: str):
    """Decrypt using ML-KEM-768 secret key."""
    import struct
    pqc = PQC()

    with open(sk_path, "rb") as f:
        sk_bytes = f.read()

    with open(input_file, "rb") as f:
        magic = f.read(4)
        assert magic == b"ZPQC", "Not a Zipminator PQC file"
        ct_len = struct.unpack("<I", f.read(4))[0]
        ct = f.read(ct_len)
        nonce = f.read(12)
        ciphertext = f.read()

    # Decapsulate to recover shared secret (sk first, ct second)
    shared_secret = pqc.decapsulate(sk_bytes, ct)

    # AES-256-GCM decrypt
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    aesgcm = AESGCM(shared_secret)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)

    with open(output_file, "wb") as f:
        f.write(plaintext)

    console.print(f"   Mode: [bold magenta]ML-KEM-768 (Post-Quantum)[/bold magenta]")
    console.print(f"   Key: {sk_path}")


def _decrypt_password(input_file: str, output_dir: str, password: str):
    """Decrypt a password-based AES ZIP (legacy mode)."""
    import pyzipper
    os.makedirs(output_dir, exist_ok=True)
    with pyzipper.AESZipFile(input_file, "r") as zf:
        zf.setpassword(password.encode())
        zf.extractall(output_dir)
    console.print(f"   Mode: [yellow]Password AES (legacy)[/yellow]")


def main():
    app()


if __name__ == "__main__":
    main()
