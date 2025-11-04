#!/usr/bin/env python3
"""
Multi-Provider Quantum QRNG Example
Demonstrates usage of the multi-provider harvester
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../src/python'))

from multi_provider_harvester import (
    MultiProviderHarvester,
    QuantumProvider,
    calculate_bytes_per_shot,
    calculate_optimal_harvest
)
from credit_optimizer import CreditOptimizer, OptimizationGoal
from qbraid_adapter import QBraidAdapter


def example_basic_usage():
    """Basic usage example"""
    print("\n" + "="*80)
    print("EXAMPLE 1: Basic Usage")
    print("="*80)

    # Initialize harvester
    harvester = MultiProviderHarvester()

    # Show provider status
    status = harvester.get_provider_status()
    print(f"\nInitialized providers: {status['initialized_providers']}")
    print(f"Available backends: {status['total_backends']}")

    print("\nBackends:")
    for backend in status['available_backends'][:5]:  # Show first 5
        available = "✓" if backend['available'] else "✗"
        print(f"  {available} {backend['name']:30} | {backend['provider']:15} | "
              f"{backend['qubits']:3} qubits | Queue: {backend['queue_depth']:3}")

    # Generate quantum random numbers (uncomment when configured)
    # entropy = harvester.harvest_quantum_entropy(num_bytes=1000)
    # print(f"\nGenerated {len(entropy)} bytes of quantum randomness")


def example_qubit_strategies():
    """Demonstrate different qubit usage strategies"""
    print("\n" + "="*80)
    print("EXAMPLE 2: Qubit Usage Strategies")
    print("="*80)

    target_bytes = 1000

    print(f"\nTarget: {target_bytes} bytes of random data")
    print("\nIBM Brisbane has 127 qubits available. Let's compare strategies:\n")

    strategies = [
        (8, "Minimum qubits (1 byte per shot)"),
        (64, "Balanced (8 bytes per shot)"),
        (120, "Maximum qubits (15 bytes per shot) - OPTIMAL!")
    ]

    for num_qubits, description in strategies:
        bytes_per_shot = calculate_bytes_per_shot(num_qubits)
        shots_needed = (target_bytes + bytes_per_shot - 1) // bytes_per_shot
        total_bytes = shots_needed * bytes_per_shot

        print(f"Strategy: {num_qubits} qubits")
        print(f"  Description: {description}")
        print(f"  Bytes per shot: {bytes_per_shot}")
        print(f"  Shots needed: {shots_needed:,}")
        print(f"  Total bytes: {total_bytes:,}")
        print(f"  Efficiency: {'⭐' * (num_qubits // 24 + 1)}")
        print()


def example_cost_optimization():
    """Demonstrate cost optimization"""
    print("\n" + "="*80)
    print("EXAMPLE 3: Cost Optimization")
    print("="*80)

    optimizer = CreditOptimizer()

    target_bytes = 1000

    print(f"\nComparing all providers for {target_bytes} bytes:")
    print("-" * 80)

    plans = optimizer.compare_providers(target_bytes, OptimizationGoal.BALANCED)

    for i, plan in enumerate(plans[:5], 1):  # Show top 5
        print(f"\n{i}. {plan.provider}")
        print(f"   Strategy: {plan.num_qubits} qubits × {plan.num_shots:,} shots")
        print(f"   Cost: ${plan.estimated_cost:.4f}")
        print(f"   Time: {plan.estimated_time_seconds/60:.1f} minutes")
        print(f"   Efficiency score: {plan.efficiency_score:.2f}")


def example_optimal_calculation():
    """Show optimal qubit calculation"""
    print("\n" + "="*80)
    print("EXAMPLE 4: Optimal Qubit Calculation")
    print("="*80)

    print("\nQuestion: How many qubits should I use on IBM Brisbane (127 qubits)?")
    print("Answer: Use the maximum byte-aligned count!")
    print()

    max_qubits = 127
    target_bytes = 1000

    # Calculate optimal
    optimal_qubits, optimal_shots = calculate_optimal_harvest(target_bytes, max_qubits)

    print(f"Given: IBM Brisbane with {max_qubits} qubits")
    print(f"Target: {target_bytes} bytes")
    print()
    print(f"Optimal Strategy:")
    print(f"  Use: {optimal_qubits} qubits (byte-aligned)")
    print(f"  Shots: {optimal_shots:,}")
    print(f"  Bytes per shot: {calculate_bytes_per_shot(optimal_qubits)}")
    print(f"  Total bytes: {optimal_shots * calculate_bytes_per_shot(optimal_qubits):,}")
    print()
    print("Why 120 qubits?")
    print("  - 127 qubits ÷ 8 = 15.875 → round down to 15 bytes per shot")
    print("  - 15 bytes × 8 bits = 120 qubits (byte-aligned)")
    print("  - This is the maximum efficiency!")
    print()
    print("Comparison:")
    print(f"  120 qubits × {optimal_shots} shots = {optimal_shots * 15} bytes ✅ (optimal)")
    print(f"    8 qubits × 1000 shots = 1000 bytes ❌ (inefficient)")
    print()
    print("Result: 120 qubits is 15x more efficient!")


def example_provider_selection():
    """Demonstrate provider selection"""
    print("\n" + "="*80)
    print("EXAMPLE 5: Provider Selection")
    print("="*80)

    harvester = MultiProviderHarvester()

    print("\nAutomatic provider selection:")

    # Select best backend
    backend = harvester.select_backend(min_qubits=8)

    if backend:
        print(f"\nSelected: {backend.name}")
        print(f"Provider: {backend.provider.value}")
        print(f"Qubits: {backend.num_qubits}")
        print(f"Queue depth: {backend.queue_depth}")
        print(f"Available: {'Yes' if backend.available else 'No'}")

        # Calculate strategy
        strategy = harvester.calculate_optimal_strategy(1000, backend)
        print(f"\nOptimal strategy for this backend:")
        print(f"  Qubits: {strategy.num_qubits}")
        print(f"  Shots: {strategy.num_shots:,}")
        print(f"  Jobs: {strategy.num_jobs}")
        print(f"  Estimated cost: ${strategy.estimated_credits:.4f}")
    else:
        print("\nNo backends available (this is expected without credentials)")


def example_qbraid_usage():
    """Demonstrate qBraid usage"""
    print("\n" + "="*80)
    print("EXAMPLE 6: qBraid Multi-Provider Access")
    print("="*80)

    print("\nqBraid provides unified access to:")
    print("  - IBM Quantum")
    print("  - IonQ")
    print("  - Rigetti")
    print("  - Oxford Quantum Circuits")
    print("  - AWS Braket")

    try:
        adapter = QBraidAdapter()

        print(f"\nFound {len(adapter.devices)} devices:")

        for device in adapter.devices[:10]:  # Show first 10
            status = "✓" if device.status == "ONLINE" else "✗"
            print(f"  {status} {device.name:30} | {device.provider:15} | "
                  f"{device.num_qubits:3} qubits")

        # Get best device
        best = adapter.get_best_device(min_qubits=8)
        if best:
            print(f"\nBest device: {best.name}")
            print(f"  Provider: {best.provider}")
            print(f"  Qubits: {best.num_qubits}")

            # Estimate cost
            num_qubits = min(best.num_qubits, 120)
            bytes_per_shot = num_qubits // 8
            num_shots = 1000 // bytes_per_shot
            cost = adapter.estimate_cost(best.device_id, num_shots)
            print(f"  Cost for 1KB: ${cost:.4f}")

    except Exception as e:
        print(f"\nqBraid not available: {e}")
        print("Set QBRAID_API_KEY environment variable to use qBraid")


def main():
    """Run all examples"""
    print("\n╔═══════════════════════════════════════════════════════════════╗")
    print("║     Multi-Provider Quantum Random Number Generator           ║")
    print("║     Examples and Usage Demonstrations                         ║")
    print("╚═══════════════════════════════════════════════════════════════╝")

    examples = [
        ("Basic Usage", example_basic_usage),
        ("Qubit Strategies", example_qubit_strategies),
        ("Cost Optimization", example_cost_optimization),
        ("Optimal Calculation", example_optimal_calculation),
        ("Provider Selection", example_provider_selection),
        ("qBraid Access", example_qbraid_usage)
    ]

    for name, func in examples:
        try:
            func()
        except Exception as e:
            print(f"\n⚠️  Example '{name}' encountered an error: {e}")

    print("\n" + "="*80)
    print("Examples complete!")
    print("="*80)
    print("\nTo run with real quantum hardware:")
    print("  1. Set environment variables (IBM_QUANTUM_TOKEN or QBRAID_API_KEY)")
    print("  2. Uncomment the harvest_quantum_entropy() calls")
    print("  3. Run: python3 examples/multi_provider_example.py")
    print()


if __name__ == "__main__":
    main()
