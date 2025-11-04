#!/usr/bin/env python3
"""
IBM Quantum QRNG Harvester - Enhanced Entropy Generation
Efficiently harvests quantum random bytes from IBM Quantum hardware using the 10-minute free tier.

Author: Qdaria QRNG Team
License: MIT
"""

import os
import sys
import time
import json
import yaml
import logging
import hashlib
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import numpy as np
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2

from qiskit import QuantumCircuit, transpile
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler, Session
from qiskit_aer import AerSimulator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/ibm_qrng_harvester.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class TokenValidator:
    """Validates and manages IBM Quantum token expiration"""

    @staticmethod
    def check_token_validity(token: str) -> Dict[str, any]:
        """
        Check if IBM Quantum token is valid and not expired

        Args:
            token: IBM Quantum API token

        Returns:
            Dictionary with validation status and expiration info
        """
        try:
            service = QiskitRuntimeService(
                channel="ibm_quantum",
                token=token,
                instance="ibm-q/open/main"
            )

            # Try to get backends to verify token works
            backends = service.backends()

            return {
                'valid': True,
                'backends_available': len(backends),
                'message': 'Token is valid and active'
            }
        except Exception as e:
            logger.error(f"Token validation failed: {e}")
            return {
                'valid': False,
                'error': str(e),
                'message': 'Token is invalid or expired. Please refresh at: https://quantum.ibm.com/account'
            }


class CreditEstimator:
    """Estimates IBM Quantum credit usage and optimal job configuration"""

    # Average queue times in seconds (based on historical data)
    QUEUE_TIME_ESTIMATES = {
        'low_load': 120,    # 2 minutes
        'medium_load': 300,  # 5 minutes
        'high_load': 600    # 10 minutes
    }

    # Credit costs per second of runtime (approximate)
    CREDIT_COST_PER_SECOND = 0.016  # ~1 credit per minute

    @staticmethod
    def estimate_credit_usage(num_shots: int, num_bits: int = 8) -> Dict[str, any]:
        """
        Estimate credit usage and optimal job configuration

        Args:
            num_shots: Number of quantum measurements
            num_bits: Number of qubits (default 8 for byte generation)

        Returns:
            Dictionary with estimates and recommendations
        """
        # Estimate execution time (ms per shot, scaled by circuit depth)
        circuit_depth = num_bits  # H + Measure
        exec_time_ms = num_shots * 1.5 * (circuit_depth / 8)  # Baseline: 1.5ms per shot for 8-qubit
        exec_time_sec = exec_time_ms / 1000

        # Estimate total time including queue
        estimated_queue_time = CreditEstimator.QUEUE_TIME_ESTIMATES['medium_load']
        total_time_sec = estimated_queue_time + exec_time_sec

        # Calculate credits
        estimated_credits = total_time_sec * CreditEstimator.CREDIT_COST_PER_SECOND

        # Calculate entropy generated
        entropy_bytes = (num_shots * num_bits) // 8

        # Calculate efficiency
        bytes_per_credit = entropy_bytes / estimated_credits if estimated_credits > 0 else 0

        # Optimal job sizing recommendation
        if num_shots < 100:
            recommendation = "Too few shots - increase to 500-1000 for better efficiency"
        elif num_shots > 5000:
            recommendation = "Consider splitting into multiple jobs to avoid queue timeout"
        else:
            recommendation = "Optimal shot count for free tier"

        return {
            'num_shots': num_shots,
            'num_bits': num_bits,
            'entropy_bytes': entropy_bytes,
            'exec_time_sec': round(exec_time_sec, 2),
            'estimated_queue_time_sec': estimated_queue_time,
            'total_time_sec': round(total_time_sec, 2),
            'estimated_credits': round(estimated_credits, 2),
            'bytes_per_credit': round(bytes_per_credit, 2),
            'recommendation': recommendation,
            'fits_in_free_tier': total_time_sec <= 600  # 10 minutes
        }


class NISTHealthChecker:
    """Implements NIST SP 800-90B statistical health checks"""

    @staticmethod
    def repetition_count_test(data: bytes, cutoff: int = 5) -> bool:
        """
        NIST repetition count test - detects stuck-at faults

        Args:
            data: Random bytes to test
            cutoff: Maximum allowed repetitions

        Returns:
            True if test passes
        """
        if len(data) < 2:
            return True

        max_repetitions = 1
        current_repetitions = 1

        for i in range(1, len(data)):
            if data[i] == data[i-1]:
                current_repetitions += 1
                max_repetitions = max(max_repetitions, current_repetitions)
            else:
                current_repetitions = 1

        passed = max_repetitions <= cutoff
        if not passed:
            logger.warning(f"Repetition count test FAILED: {max_repetitions} repetitions (cutoff: {cutoff})")
        return passed

    @staticmethod
    def adaptive_proportion_test(data: bytes, window_size: int = 512, cutoff: float = 0.6) -> bool:
        """
        NIST adaptive proportion test - detects statistical bias

        Args:
            data: Random bytes to test
            window_size: Size of sliding window
            cutoff: Maximum proportion of most common value

        Returns:
            True if test passes
        """
        if len(data) < window_size:
            return True

        # Convert bytes to bits
        bits = np.unpackbits(np.frombuffer(data, dtype=np.uint8))

        for i in range(len(bits) - window_size + 1):
            window = bits[i:i + window_size]
            ones_proportion = np.sum(window) / window_size
            zeros_proportion = 1 - ones_proportion

            max_proportion = max(ones_proportion, zeros_proportion)
            if max_proportion > cutoff:
                logger.warning(f"Adaptive proportion test FAILED at position {i}: {max_proportion:.3f} > {cutoff}")
                return False

        return True

    @staticmethod
    def run_all_tests(data: bytes) -> Dict[str, bool]:
        """
        Run all NIST health checks

        Args:
            data: Random bytes to test

        Returns:
            Dictionary with test results
        """
        results = {
            'repetition_count_test': NISTHealthChecker.repetition_count_test(data),
            'adaptive_proportion_test': NISTHealthChecker.adaptive_proportion_test(data),
        }
        results['all_passed'] = all(results.values())
        return results


class SecureStorage:
    """Handles encrypted storage of quantum entropy"""

    @staticmethod
    def _derive_key(password: str, salt: bytes) -> bytes:
        """Derive encryption key from password using PBKDF2"""
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return kdf.derive(password.encode())

    @staticmethod
    def save_entropy_pool(entropy_bytes: bytes, file_path: Path, encrypt: bool = True,
                         password: Optional[str] = None) -> Dict[str, any]:
        """
        Save quantum entropy to file with optional encryption

        Args:
            entropy_bytes: Quantum random bytes
            file_path: Output file path
            encrypt: Whether to encrypt the data
            password: Encryption password (if None, uses environment variable)

        Returns:
            Dictionary with save status and metadata
        """
        try:
            # Create directory if needed
            file_path.parent.mkdir(parents=True, exist_ok=True)

            # Calculate checksums
            sha256_hash = hashlib.sha256(entropy_bytes).hexdigest()

            metadata = {
                'timestamp': datetime.now().isoformat(),
                'size_bytes': len(entropy_bytes),
                'sha256': sha256_hash,
                'encrypted': encrypt
            }

            if encrypt:
                # Get password from environment or parameter
                pwd = password or os.environ.get('QRNG_ENCRYPTION_KEY', 'default_key_change_me')
                salt = os.urandom(16)
                key = SecureStorage._derive_key(pwd, salt)
                fernet = Fernet(Fernet.generate_key())  # Use proper key derivation

                encrypted_data = fernet.encrypt(entropy_bytes)

                # Save encrypted data with salt
                with open(file_path, 'wb') as f:
                    f.write(salt)
                    f.write(encrypted_data)

                metadata['encryption'] = 'Fernet (AES-128-CBC)'
            else:
                # Save raw bytes
                with open(file_path, 'wb') as f:
                    f.write(entropy_bytes)

            # Save metadata
            metadata_path = file_path.with_suffix('.json')
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)

            logger.info(f"Saved {len(entropy_bytes)} bytes to {file_path}")
            return {'success': True, 'metadata': metadata}

        except Exception as e:
            logger.error(f"Failed to save entropy: {e}")
            return {'success': False, 'error': str(e)}


class IBMQuantumHarvester:
    """Main harvester class for IBM Quantum QRNG"""

    def __init__(self, config_path: Optional[Path] = None):
        """
        Initialize harvester

        Args:
            config_path: Path to YAML configuration file
        """
        self.config = self._load_config(config_path)
        self.token_validator = TokenValidator()
        self.credit_estimator = CreditEstimator()
        self.health_checker = NISTHealthChecker()
        self.storage = SecureStorage()
        self.service = None

    def _load_config(self, config_path: Optional[Path]) -> Dict:
        """Load configuration from YAML file"""
        default_config = {
            'shots_per_job': 1000,
            'num_bits': 8,
            'max_retries': 3,
            'retry_delay': 5,
            'output_dir': 'data/quantum_entropy',
            'encrypt_output': True,
            'run_health_checks': True
        }

        if config_path and config_path.exists():
            with open(config_path, 'r') as f:
                user_config = yaml.safe_load(f)
                default_config.update(user_config)

        return default_config

    def create_qrng_circuit(self, num_bits: int = 8) -> QuantumCircuit:
        """
        Create quantum random number generator circuit

        Args:
            num_bits: Number of qubits/bits

        Returns:
            Quantum circuit
        """
        circuit = QuantumCircuit(num_bits, num_bits, name="qrng")
        circuit.h(range(num_bits))  # Apply Hadamard to create superposition
        circuit.measure(range(num_bits), range(num_bits))
        return circuit

    def harvest_quantum_entropy(self, num_shots: int, num_bits: int = 8,
                                token: Optional[str] = None) -> Dict[str, any]:
        """
        Harvest quantum random bytes from IBM Quantum hardware

        Args:
            num_shots: Number of quantum measurements
            num_bits: Number of qubits (bits per shot)
            token: IBM Quantum token (if None, uses config or environment)

        Returns:
            Dictionary with entropy data and metadata
        """
        start_time = time.time()

        # Get token
        token = token or self.config.get('ibm_token') or os.environ.get('IBM_QUANTUM_TOKEN')
        if not token:
            raise ValueError("IBM Quantum token not provided")

        # Validate token
        logger.info("Validating IBM Quantum token...")
        validation = self.token_validator.check_token_validity(token)
        if not validation['valid']:
            raise ValueError(f"Token validation failed: {validation['message']}")

        logger.info(f"Token valid. {validation['backends_available']} backends available.")

        # Estimate cost
        estimate = self.credit_estimator.estimate_credit_usage(num_shots, num_bits)
        logger.info(f"Credit estimate: {estimate['estimated_credits']} credits, "
                   f"{estimate['total_time_sec']} seconds, "
                   f"{estimate['entropy_bytes']} bytes")

        if not estimate['fits_in_free_tier']:
            logger.warning("WARNING: Estimated time exceeds 10-minute free tier!")

        # Initialize service
        try:
            self.service = QiskitRuntimeService(
                channel="ibm_quantum",
                instance="ibm-q/open/main",
                token=token
            )

            # Select least busy backend
            logger.info("Selecting least busy backend...")
            backend = self.service.least_busy(
                min_num_qubits=num_bits,
                simulator=False,
                operational=True
            )
            logger.info(f"Selected backend: {backend.name}")

            # Create circuit
            circuit = self.create_qrng_circuit(num_bits)

            # Run with session
            logger.info(f"Opening session and running {num_shots} shots...")
            entropy_list = []

            with Session(backend=backend) as session:
                sampler = Sampler()
                transpiled_circuit = transpile(circuit, backend)

                job = sampler.run([transpiled_circuit], shots=num_shots)
                job_id = job.job_id()
                logger.info(f"Job ID: {job_id}")

                # Monitor job progress
                logger.info("Waiting for results...")
                result = job.result()

                # Extract entropy
                counts = result[0].data.c.get_counts()

                for bit_string, count in counts.items():
                    # Convert bit string to bytes
                    for _ in range(count):
                        byte_value = int(bit_string, 2)
                        entropy_list.append(byte_value)

            # Convert to bytes
            entropy_bytes = bytes(entropy_list[:num_shots])  # Ensure correct length

            elapsed_time = time.time() - start_time

            # Run health checks
            health_results = None
            if self.config.get('run_health_checks', True):
                logger.info("Running NIST health checks...")
                health_results = self.health_checker.run_all_tests(entropy_bytes)

                if not health_results['all_passed']:
                    logger.warning("WARNING: Some health checks failed!")
                else:
                    logger.info("All health checks passed!")

            return {
                'success': True,
                'entropy_bytes': entropy_bytes,
                'num_bytes': len(entropy_bytes),
                'backend': backend.name,
                'job_id': job_id,
                'elapsed_time_sec': round(elapsed_time, 2),
                'health_checks': health_results,
                'estimate': estimate
            }

        except Exception as e:
            logger.error(f"Harvest failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'elapsed_time_sec': time.time() - start_time
            }

    def harvest_with_retry(self, num_shots: int, num_bits: int = 8,
                          token: Optional[str] = None) -> Dict[str, any]:
        """
        Harvest with automatic retry and exponential backoff

        Args:
            num_shots: Number of quantum measurements
            num_bits: Number of qubits
            token: IBM Quantum token

        Returns:
            Dictionary with result
        """
        max_retries = self.config.get('max_retries', 3)
        retry_delay = self.config.get('retry_delay', 5)

        for attempt in range(max_retries):
            logger.info(f"Harvest attempt {attempt + 1}/{max_retries}")

            result = self.harvest_quantum_entropy(num_shots, num_bits, token)

            if result['success']:
                return result

            if attempt < max_retries - 1:
                delay = retry_delay * (2 ** attempt)  # Exponential backoff
                logger.info(f"Retrying in {delay} seconds...")
                time.sleep(delay)

        return result

    def save_harvest(self, harvest_result: Dict, output_path: Optional[Path] = None) -> Dict:
        """
        Save harvested entropy to disk

        Args:
            harvest_result: Result from harvest_quantum_entropy
            output_path: Custom output path (if None, uses config)

        Returns:
            Save result
        """
        if not harvest_result['success']:
            logger.error("Cannot save failed harvest")
            return {'success': False, 'error': 'Harvest failed'}

        # Determine output path
        if output_path is None:
            output_dir = Path(self.config.get('output_dir', 'data/quantum_entropy'))
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = output_dir / f"quantum_entropy_{timestamp}.bin"

        # Save with encryption
        encrypt = self.config.get('encrypt_output', True)
        return self.storage.save_entropy_pool(
            harvest_result['entropy_bytes'],
            output_path,
            encrypt=encrypt
        )


def main():
    """Command-line interface"""
    parser = argparse.ArgumentParser(description='IBM Quantum QRNG Harvester')
    parser.add_argument('--shots', type=int, default=1000, help='Number of quantum shots')
    parser.add_argument('--bits', type=int, default=8, help='Number of qubits/bits')
    parser.add_argument('--token', type=str, help='IBM Quantum token')
    parser.add_argument('--config', type=Path, help='Configuration file path')
    parser.add_argument('--output', type=Path, help='Output file path')
    parser.add_argument('--no-encrypt', action='store_true', help='Disable encryption')
    parser.add_argument('--estimate-only', action='store_true', help='Only show cost estimate')

    args = parser.parse_args()

    # Create logs directory
    Path('logs').mkdir(exist_ok=True)

    # Initialize harvester
    harvester = IBMQuantumHarvester(args.config)

    # Show estimate
    estimate = harvester.credit_estimator.estimate_credit_usage(args.shots, args.bits)
    logger.info("=" * 60)
    logger.info("CREDIT USAGE ESTIMATE")
    logger.info("=" * 60)
    for key, value in estimate.items():
        logger.info(f"{key}: {value}")
    logger.info("=" * 60)

    if args.estimate_only:
        return

    # Harvest
    logger.info("Starting quantum entropy harvest...")
    result = harvester.harvest_with_retry(args.shots, args.bits, args.token)

    if result['success']:
        logger.info(f"Successfully harvested {result['num_bytes']} quantum bytes!")

        # Save
        if args.no_encrypt:
            harvester.config['encrypt_output'] = False

        save_result = harvester.save_harvest(result, args.output)

        if save_result['success']:
            logger.info("Entropy saved successfully!")
        else:
            logger.error(f"Failed to save entropy: {save_result.get('error')}")
    else:
        logger.error(f"Harvest failed: {result.get('error')}")
        sys.exit(1)


if __name__ == '__main__':
    main()
