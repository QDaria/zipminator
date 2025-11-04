"""
Unit tests for Multi-Provider Quantum Harvester
"""

import unittest
import os
import sys
from unittest.mock import Mock, patch, MagicMock

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src/python'))

from multi_provider_harvester import (
    MultiProviderHarvester,
    QuantumProvider,
    BackendInfo,
    HarvestStrategy,
    calculate_bytes_per_shot,
    calculate_optimal_harvest
)

from credit_optimizer import (
    CreditOptimizer,
    OptimizationGoal,
    ProviderPricing
)


class TestCalculations(unittest.TestCase):
    """Test basic calculation functions"""

    def test_bytes_per_shot(self):
        """Test bytes per shot calculation"""
        self.assertEqual(calculate_bytes_per_shot(8), 1)
        self.assertEqual(calculate_bytes_per_shot(16), 2)
        self.assertEqual(calculate_bytes_per_shot(64), 8)
        self.assertEqual(calculate_bytes_per_shot(120), 15)
        self.assertEqual(calculate_bytes_per_shot(127), 15)  # Truncated

    def test_optimal_harvest_small(self):
        """Test optimal harvest for small byte count"""
        qubits, shots = calculate_optimal_harvest(1000, 127)
        self.assertEqual(qubits, 120)  # Max byte-aligned
        self.assertEqual(shots, 67)    # Ceiling of 1000/15

    def test_optimal_harvest_large(self):
        """Test optimal harvest for large byte count"""
        qubits, shots = calculate_optimal_harvest(10000, 127)
        self.assertEqual(qubits, 120)
        self.assertEqual(shots, 667)

    def test_optimal_harvest_limited_qubits(self):
        """Test optimal harvest with limited qubits"""
        qubits, shots = calculate_optimal_harvest(1000, 11)  # IonQ Harmony
        self.assertEqual(qubits, 8)   # Only 1 byte per shot
        self.assertEqual(shots, 1000)


class TestBackendInfo(unittest.TestCase):
    """Test BackendInfo dataclass"""

    def test_backend_creation(self):
        """Test backend info creation"""
        backend = BackendInfo(
            provider=QuantumProvider.IBM_DIRECT,
            name="ibm_brisbane",
            num_qubits=127,
            available=True,
            queue_depth=10,
            credits_per_shot=0.01
        )

        self.assertEqual(backend.name, "ibm_brisbane")
        self.assertEqual(backend.num_qubits, 127)
        self.assertTrue(backend.available)


class TestHarvestStrategy(unittest.TestCase):
    """Test harvest strategy calculations"""

    def test_strategy_calculation(self):
        """Test strategy calculation"""
        backend = BackendInfo(
            provider=QuantumProvider.IBM_DIRECT,
            name="ibm_brisbane",
            num_qubits=127,
            available=True,
            queue_depth=10,
            credits_per_shot=0.01
        )

        harvester = MultiProviderHarvester()
        strategy = harvester.calculate_optimal_strategy(1000, backend)

        self.assertEqual(strategy.num_qubits, 120)
        self.assertEqual(strategy.bytes_per_shot, 15)
        self.assertGreaterEqual(strategy.total_bytes, 1000)
        self.assertGreater(strategy.num_shots, 0)


class TestCreditOptimizer(unittest.TestCase):
    """Test credit optimizer"""

    def setUp(self):
        """Set up optimizer"""
        self.optimizer = CreditOptimizer()

    def test_strategy_comparison(self):
        """Test strategy comparison for IBM Brisbane"""
        strategies = []

        for num_qubits in [8, 64, 120]:
            pricing = self.optimizer.providers['ibm_brisbane_127q']
            plan = self.optimizer._evaluate_strategy(
                1000, num_qubits, pricing, OptimizationGoal.BALANCED
            )
            strategies.append(plan)

        # 120 qubits should be most efficient
        self.assertEqual(strategies[2].num_qubits, 120)
        self.assertLess(strategies[2].num_shots, strategies[1].num_shots)
        self.assertLess(strategies[2].num_shots, strategies[0].num_shots)

    def test_provider_comparison(self):
        """Test comparing all providers"""
        plans = self.optimizer.compare_providers(1000, OptimizationGoal.BALANCED)

        self.assertGreater(len(plans), 0)

        # Verify plans are sorted by efficiency
        for i in range(len(plans) - 1):
            self.assertGreaterEqual(
                plans[i].efficiency_score,
                plans[i+1].efficiency_score
            )

    def test_recommendation_with_constraints(self):
        """Test provider recommendation with constraints"""
        plan = self.optimizer.recommend_provider(
            target_bytes=1000,
            budget=0.50,
            max_time_seconds=600,
            goal=OptimizationGoal.MINIMIZE_COST
        )

        if plan:
            self.assertLessEqual(plan.estimated_cost, 0.50)
            self.assertLessEqual(plan.estimated_time_seconds, 600)


class TestMultiProviderHarvester(unittest.TestCase):
    """Test multi-provider harvester"""

    @patch.dict(os.environ, {}, clear=True)
    def test_initialization_no_creds(self):
        """Test initialization without credentials"""
        harvester = MultiProviderHarvester()
        self.assertIsNotNone(harvester)
        self.assertGreater(len(harvester.available_backends), 0)  # Should have simulator

    def test_backend_selection_auto(self):
        """Test automatic backend selection"""
        harvester = MultiProviderHarvester()
        backend = harvester.select_backend(min_qubits=8)

        self.assertIsNotNone(backend)
        self.assertGreaterEqual(backend.num_qubits, 8)

    def test_backend_selection_specific_provider(self):
        """Test backend selection for specific provider"""
        harvester = MultiProviderHarvester()
        backend = harvester.select_backend(
            provider=QuantumProvider.SIMULATOR,
            min_qubits=8
        )

        if backend:
            self.assertEqual(backend.provider, QuantumProvider.SIMULATOR)

    def test_provider_status(self):
        """Test getting provider status"""
        harvester = MultiProviderHarvester()
        status = harvester.get_provider_status()

        self.assertIn('initialized_providers', status)
        self.assertIn('available_backends', status)
        self.assertIn('total_backends', status)
        self.assertGreater(status['total_backends'], 0)


class TestQubitStrategies(unittest.TestCase):
    """Test different qubit usage strategies"""

    def test_8_qubit_strategy(self):
        """Test 8 qubit strategy (1 byte per shot)"""
        qubits = 8
        target_bytes = 1000

        bytes_per_shot = calculate_bytes_per_shot(qubits)
        shots_needed = target_bytes // bytes_per_shot

        self.assertEqual(bytes_per_shot, 1)
        self.assertEqual(shots_needed, 1000)

    def test_64_qubit_strategy(self):
        """Test 64 qubit strategy (8 bytes per shot)"""
        qubits = 64
        target_bytes = 1000

        bytes_per_shot = calculate_bytes_per_shot(qubits)
        shots_needed = (target_bytes + bytes_per_shot - 1) // bytes_per_shot

        self.assertEqual(bytes_per_shot, 8)
        self.assertEqual(shots_needed, 125)

    def test_120_qubit_strategy(self):
        """Test 120 qubit strategy (15 bytes per shot)"""
        qubits = 120
        target_bytes = 1000

        bytes_per_shot = calculate_bytes_per_shot(qubits)
        shots_needed = (target_bytes + bytes_per_shot - 1) // bytes_per_shot

        self.assertEqual(bytes_per_shot, 15)
        self.assertEqual(shots_needed, 67)

        # Verify this is most efficient
        total_bytes = shots_needed * bytes_per_shot
        self.assertGreaterEqual(total_bytes, target_bytes)
        self.assertLess(shots_needed, 125)  # Better than 64 qubits
        self.assertLess(shots_needed, 1000)  # Better than 8 qubits


def run_tests():
    """Run all tests"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test cases
    suite.addTests(loader.loadTestsFromTestCase(TestCalculations))
    suite.addTests(loader.loadTestsFromTestCase(TestBackendInfo))
    suite.addTests(loader.loadTestsFromTestCase(TestHarvestStrategy))
    suite.addTests(loader.loadTestsFromTestCase(TestCreditOptimizer))
    suite.addTests(loader.loadTestsFromTestCase(TestMultiProviderHarvester))
    suite.addTests(loader.loadTestsFromTestCase(TestQubitStrategies))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
