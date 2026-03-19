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


def main():
    app()


if __name__ == "__main__":
    main()
