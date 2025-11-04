"""
Credit Optimizer for Multi-Provider Quantum Harvesting
Calculates optimal strategies to minimize cost and maximize efficiency
"""

import math
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class OptimizationGoal(Enum):
    """Optimization goals"""
    MINIMIZE_COST = "cost"           # Minimize credits spent
    MINIMIZE_TIME = "time"           # Minimize wall-clock time
    MINIMIZE_JOBS = "jobs"           # Minimize number of jobs
    MAXIMIZE_QUALITY = "quality"      # Maximize randomness quality
    BALANCED = "balanced"            # Balance all factors


@dataclass
class ProviderPricing:
    """Provider pricing information"""
    name: str
    cost_per_shot: float
    cost_per_task: float
    max_qubits: int
    max_shots_per_job: int
    avg_queue_time_seconds: float
    error_rate: float


@dataclass
class HarvestPlan:
    """Optimized harvest execution plan"""
    provider: str
    num_qubits: int
    num_shots: int
    num_jobs: int
    bytes_per_shot: int
    total_bytes: int
    estimated_cost: float
    estimated_time_seconds: float
    efficiency_score: float
    rationale: str


class CreditOptimizer:
    """
    Optimize quantum entropy harvesting for cost and efficiency
    """

    # Provider pricing data (example values)
    PROVIDER_PRICING = {
        'ibm_brisbane_127q': ProviderPricing(
            name='IBM Brisbane (127 qubits)',
            cost_per_shot=0.00001,  # $0.01 per 1000 shots
            cost_per_task=0.0,
            max_qubits=127,
            max_shots_per_job=8192,
            avg_queue_time_seconds=300,
            error_rate=0.01
        ),
        'ibm_kyoto_127q': ProviderPricing(
            name='IBM Kyoto (127 qubits)',
            cost_per_shot=0.00001,
            cost_per_task=0.0,
            max_qubits=127,
            max_shots_per_job=8192,
            avg_queue_time_seconds=300,
            error_rate=0.01
        ),
        'ionq_harmony_11q': ProviderPricing(
            name='IonQ Harmony (11 qubits)',
            cost_per_shot=0.0,
            cost_per_task=0.30,  # $0.30 per task
            max_qubits=11,
            max_shots_per_job=10000,
            avg_queue_time_seconds=120,
            error_rate=0.001
        ),
        'rigetti_aspen_m3_79q': ProviderPricing(
            name='Rigetti Aspen-M-3 (79 qubits)',
            cost_per_shot=0.00003,
            cost_per_task=0.0,
            max_qubits=79,
            max_shots_per_job=10000,
            avg_queue_time_seconds=180,
            error_rate=0.02
        ),
        'aws_braket_sv1': ProviderPricing(
            name='AWS Braket SV1 (34 qubits)',
            cost_per_shot=0.00075,
            cost_per_task=0.30,
            max_qubits=34,
            max_shots_per_job=100000,
            avg_queue_time_seconds=10,
            error_rate=0.0001  # Simulator
        ),
        'oqc_lucy_8q': ProviderPricing(
            name='OQC Lucy (8 qubits)',
            cost_per_shot=0.0,
            cost_per_task=0.25,
            max_qubits=8,
            max_shots_per_job=10000,
            avg_queue_time_seconds=60,
            error_rate=0.015
        )
    }

    def __init__(self):
        """Initialize credit optimizer"""
        self.providers = self.PROVIDER_PRICING

    def calculate_strategy(
        self,
        target_bytes: int,
        provider_key: str,
        goal: OptimizationGoal = OptimizationGoal.BALANCED
    ) -> HarvestPlan:
        """
        Calculate optimal harvest strategy for given provider

        Args:
            target_bytes: Target number of random bytes
            provider_key: Provider key from PROVIDER_PRICING
            goal: Optimization goal

        Returns:
            Optimized harvest plan
        """
        if provider_key not in self.providers:
            raise ValueError(f"Unknown provider: {provider_key}")

        pricing = self.providers[provider_key]

        # Calculate qubit usage strategies
        strategies = []

        # Strategy 1: Use 8 qubits (minimum)
        if pricing.max_qubits >= 8:
            strategies.append(self._evaluate_strategy(
                target_bytes, 8, pricing, goal
            ))

        # Strategy 2: Use 64 qubits (good balance)
        if pricing.max_qubits >= 64:
            strategies.append(self._evaluate_strategy(
                target_bytes, 64, pricing, goal
            ))

        # Strategy 3: Use maximum available qubits
        max_qubits = (min(pricing.max_qubits, 120) // 8) * 8  # Byte-aligned
        if max_qubits >= 8:
            strategies.append(self._evaluate_strategy(
                target_bytes, max_qubits, pricing, goal
            ))

        # Select best strategy
        if goal == OptimizationGoal.MINIMIZE_COST:
            best = min(strategies, key=lambda s: s.estimated_cost)
        elif goal == OptimizationGoal.MINIMIZE_TIME:
            best = min(strategies, key=lambda s: s.estimated_time_seconds)
        elif goal == OptimizationGoal.MINIMIZE_JOBS:
            best = min(strategies, key=lambda s: s.num_jobs)
        elif goal == OptimizationGoal.MAXIMIZE_QUALITY:
            best = min(strategies, key=lambda s: pricing.error_rate)
        else:  # BALANCED
            best = max(strategies, key=lambda s: s.efficiency_score)

        return best

    def _evaluate_strategy(
        self,
        target_bytes: int,
        num_qubits: int,
        pricing: ProviderPricing,
        goal: OptimizationGoal
    ) -> HarvestPlan:
        """Evaluate a specific qubit/shot strategy"""
        bytes_per_shot = num_qubits // 8
        num_shots = math.ceil(target_bytes / bytes_per_shot)
        total_bytes = num_shots * bytes_per_shot

        # Calculate number of jobs
        num_jobs = math.ceil(num_shots / pricing.max_shots_per_job)

        # Calculate cost
        if pricing.cost_per_shot > 0:
            estimated_cost = num_shots * pricing.cost_per_shot
        else:
            estimated_cost = num_jobs * pricing.cost_per_task

        # Calculate time
        avg_shots_per_job = num_shots / num_jobs
        execution_time_per_job = 2.0 + (avg_shots_per_job / 1000.0)  # Rough estimate
        estimated_time = (pricing.avg_queue_time_seconds + execution_time_per_job) * num_jobs

        # Calculate efficiency score
        # Higher is better: more bytes per dollar per second
        if estimated_cost > 0 and estimated_time > 0:
            efficiency_score = total_bytes / (estimated_cost * math.log(estimated_time + 1))
        else:
            efficiency_score = total_bytes / max(estimated_time, 1)

        # Generate rationale
        rationale = self._generate_rationale(
            num_qubits, num_shots, num_jobs,
            estimated_cost, estimated_time, goal
        )

        return HarvestPlan(
            provider=pricing.name,
            num_qubits=num_qubits,
            num_shots=num_shots,
            num_jobs=num_jobs,
            bytes_per_shot=bytes_per_shot,
            total_bytes=total_bytes,
            estimated_cost=estimated_cost,
            estimated_time_seconds=estimated_time,
            efficiency_score=efficiency_score,
            rationale=rationale
        )

    def _generate_rationale(
        self,
        num_qubits: int,
        num_shots: int,
        num_jobs: int,
        cost: float,
        time: float,
        goal: OptimizationGoal
    ) -> str:
        """Generate human-readable rationale for strategy"""
        lines = []

        lines.append(f"Uses {num_qubits} qubits to generate {num_qubits//8} bytes per shot")
        lines.append(f"Requires {num_shots:,} total shots across {num_jobs} job(s)")
        lines.append(f"Estimated cost: ${cost:.4f}")
        lines.append(f"Estimated time: {time/60:.1f} minutes")

        if goal == OptimizationGoal.MINIMIZE_COST:
            lines.append("Optimized for lowest cost")
        elif goal == OptimizationGoal.MINIMIZE_TIME:
            lines.append("Optimized for fastest completion")
        elif goal == OptimizationGoal.MINIMIZE_JOBS:
            lines.append("Optimized to minimize job submissions")

        return " | ".join(lines)

    def compare_providers(
        self,
        target_bytes: int,
        goal: OptimizationGoal = OptimizationGoal.BALANCED
    ) -> List[HarvestPlan]:
        """
        Compare all providers for given target

        Args:
            target_bytes: Target number of bytes
            goal: Optimization goal

        Returns:
            List of plans sorted by efficiency
        """
        plans = []

        for provider_key in self.providers:
            try:
                plan = self.calculate_strategy(target_bytes, provider_key, goal)
                plans.append(plan)
            except Exception as e:
                print(f"Warning: Failed to calculate strategy for {provider_key}: {e}")

        # Sort by efficiency score (descending)
        plans.sort(key=lambda p: p.efficiency_score, reverse=True)

        return plans

    def recommend_provider(
        self,
        target_bytes: int,
        budget: Optional[float] = None,
        max_time_seconds: Optional[float] = None,
        goal: OptimizationGoal = OptimizationGoal.BALANCED
    ) -> Optional[HarvestPlan]:
        """
        Recommend best provider based on constraints

        Args:
            target_bytes: Target number of bytes
            budget: Maximum budget in USD (None for no limit)
            max_time_seconds: Maximum time in seconds (None for no limit)
            goal: Optimization goal

        Returns:
            Recommended plan or None if no plan meets constraints
        """
        plans = self.compare_providers(target_bytes, goal)

        # Filter by constraints
        for plan in plans:
            if budget and plan.estimated_cost > budget:
                continue
            if max_time_seconds and plan.estimated_time_seconds > max_time_seconds:
                continue
            return plan

        return None


def demonstrate_optimization():
    """Demonstrate credit optimization"""
    optimizer = CreditOptimizer()

    print("\n" + "="*80)
    print("QUANTUM ENTROPY HARVESTING - CREDIT OPTIMIZATION")
    print("="*80)

    target_bytes = 1000

    print(f"\nTarget: {target_bytes} bytes of quantum random data")
    print("\nComparing all providers:")
    print("-"*80)

    plans = optimizer.compare_providers(target_bytes, OptimizationGoal.BALANCED)

    for i, plan in enumerate(plans, 1):
        print(f"\n{i}. {plan.provider}")
        print(f"   Qubits: {plan.num_qubits} | Shots: {plan.num_shots:,} | Jobs: {plan.num_jobs}")
        print(f"   Cost: ${plan.estimated_cost:.4f} | Time: {plan.estimated_time_seconds/60:.1f} min")
        print(f"   Efficiency Score: {plan.efficiency_score:.2f}")
        print(f"   {plan.rationale}")

    print("\n" + "="*80)
    print("DETAILED COMPARISON: IBM Brisbane (127 qubits)")
    print("="*80)

    # Show different strategies for IBM Brisbane
    for num_qubits in [8, 64, 120]:
        pricing = optimizer.providers['ibm_brisbane_127q']
        plan = optimizer._evaluate_strategy(target_bytes, num_qubits, pricing, OptimizationGoal.BALANCED)

        print(f"\nStrategy: {num_qubits} qubits")
        print(f"  Bytes per shot: {plan.bytes_per_shot}")
        print(f"  Number of shots: {plan.num_shots:,}")
        print(f"  Total bytes: {plan.total_bytes:,}")
        print(f"  Number of jobs: {plan.num_jobs}")
        print(f"  Estimated cost: ${plan.estimated_cost:.4f}")
        print(f"  Estimated time: {plan.estimated_time_seconds/60:.1f} minutes")
        print(f"  Efficiency score: {plan.efficiency_score:.2f}")

    print("\n" + "="*80)
    print("RECOMMENDATION WITH CONSTRAINTS")
    print("="*80)

    # Find best option under budget and time constraints
    recommendation = optimizer.recommend_provider(
        target_bytes=1000,
        budget=0.50,  # $0.50 max
        max_time_seconds=600,  # 10 minutes max
        goal=OptimizationGoal.MINIMIZE_COST
    )

    if recommendation:
        print(f"\nRecommended: {recommendation.provider}")
        print(f"Cost: ${recommendation.estimated_cost:.4f} (under $0.50 budget)")
        print(f"Time: {recommendation.estimated_time_seconds/60:.1f} minutes (under 10 min limit)")
        print(f"\nStrategy: {recommendation.num_qubits} qubits × {recommendation.num_shots:,} shots")
    else:
        print("\nNo provider meets the constraints!")


if __name__ == "__main__":
    demonstrate_optimization()
