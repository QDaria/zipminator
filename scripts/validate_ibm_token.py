#!/usr/bin/env python3
"""
IBM Quantum Token Validator
Validates IBM Quantum API tokens for expiration, permissions, and connectivity.
"""

import sys
import os
from datetime import datetime
from typing import Dict, Tuple
import json

try:
    from qiskit_ibm_runtime import QiskitRuntimeService
except ImportError:
    print("ERROR: qiskit-ibm-runtime not installed. Run: pip install qiskit-ibm-runtime")
    sys.exit(1)


class IBMTokenValidator:
    """Validates IBM Quantum tokens and checks permissions."""

    def __init__(self, token: str = None):
        """
        Initialize validator with token from parameter or environment.

        Args:
            token: IBM Quantum API token (optional, reads from env if not provided)
        """
        self.token = token or os.getenv("IBM_QUANTUM_TOKEN")
        if not self.token:
            raise ValueError(
                "No token provided. Set IBM_QUANTUM_TOKEN environment variable or pass token parameter."
            )

        self.validation_results = {}

    def validate_token(self) -> Tuple[bool, Dict]:
        """
        Comprehensive token validation.

        Returns:
            Tuple of (is_valid, details_dict)
        """
        results = {
            "timestamp": datetime.now().isoformat(),
            "token_length": len(self.token),
            "token_format": "valid" if len(self.token) >= 100 else "invalid (too short)",
            "tests": {}
        }

        # Test 1: Authentication
        auth_valid, auth_msg = self._test_authentication()
        results["tests"]["authentication"] = {
            "passed": auth_valid,
            "message": auth_msg
        }

        if not auth_valid:
            results["overall_status"] = "FAILED"
            results["recommendation"] = "Token authentication failed. Generate a new token."
            return False, results

        # Test 2: Backend Access
        backend_valid, backend_msg, backend_list = self._test_backend_access()
        results["tests"]["backend_access"] = {
            "passed": backend_valid,
            "message": backend_msg,
            "available_backends": backend_list
        }

        # Test 3: Permissions
        perms_valid, perms_msg, perms_details = self._test_permissions()
        results["tests"]["permissions"] = {
            "passed": perms_valid,
            "message": perms_msg,
            "details": perms_details
        }

        # Overall assessment
        all_passed = auth_valid and backend_valid and perms_valid
        results["overall_status"] = "PASSED" if all_passed else "PARTIAL"

        if all_passed:
            results["recommendation"] = "Token is valid and fully functional."
        else:
            results["recommendation"] = "Token works but has limited access. Consider regenerating for full permissions."

        return all_passed, results

    def _test_authentication(self) -> Tuple[bool, str]:
        """Test if token authenticates successfully."""
        try:
            service = QiskitRuntimeService(
                channel="ibm_quantum",
                token=self.token
            )
            # If we get here, authentication succeeded
            return True, "Authentication successful"
        except Exception as e:
            error_msg = str(e)
            if "401" in error_msg or "Unauthorized" in error_msg:
                return False, f"Authentication failed: Invalid or expired token"
            elif "403" in error_msg or "Forbidden" in error_msg:
                return False, f"Authentication failed: Token lacks permissions"
            else:
                return False, f"Authentication error: {error_msg}"

    def _test_backend_access(self) -> Tuple[bool, str, list]:
        """Test access to quantum backends."""
        try:
            service = QiskitRuntimeService(
                channel="ibm_quantum",
                token=self.token
            )

            # Get available backends
            backends = service.backends()
            backend_names = [b.name for b in backends]

            if not backend_names:
                return False, "No backends accessible with this token", []

            # Check for real hardware (non-simulator)
            real_backends = [b for b in backends if not b.simulator]

            if real_backends:
                return True, f"Access to {len(backend_names)} backends ({len(real_backends)} real hardware)", backend_names
            else:
                return True, f"Access to {len(backend_names)} backends (simulators only)", backend_names

        except Exception as e:
            return False, f"Backend access error: {str(e)}", []

    def _test_permissions(self) -> Tuple[bool, str, Dict]:
        """Test token permissions and capabilities."""
        perms = {
            "can_run_jobs": False,
            "can_access_hardware": False,
            "instance": None,
            "plan": None
        }

        try:
            service = QiskitRuntimeService(
                channel="ibm_quantum",
                token=self.token
            )

            # Check instance
            try:
                instances = service.instances()
                if instances:
                    perms["instance"] = instances[0] if isinstance(instances, list) else str(instances)
            except:
                perms["instance"] = "Unable to determine"

            # Check hardware access
            backends = service.backends()
            real_backends = [b for b in backends if not b.simulator]
            perms["can_access_hardware"] = len(real_backends) > 0

            # Basic job capability (we have backends)
            perms["can_run_jobs"] = len(backends) > 0

            # Determine plan type from instance
            if perms["instance"]:
                if "open/main" in str(perms["instance"]):
                    perms["plan"] = "Open Plan (Free Tier)"
                elif "premium" in str(perms["instance"]):
                    perms["plan"] = "Premium Plan"
                else:
                    perms["plan"] = "Standard Plan"

            msg = f"Token has {'full' if perms['can_access_hardware'] else 'limited'} permissions"
            return True, msg, perms

        except Exception as e:
            return False, f"Permission check error: {str(e)}", perms


def print_validation_report(results: Dict):
    """Print formatted validation report."""
    print("\n" + "="*70)
    print("IBM QUANTUM TOKEN VALIDATION REPORT")
    print("="*70)
    print(f"\nTimestamp: {results['timestamp']}")
    print(f"Token Length: {results['token_length']} characters")
    print(f"Token Format: {results['token_format']}")
    print(f"\nOverall Status: {results['overall_status']}")

    print("\n" + "-"*70)
    print("DETAILED TEST RESULTS")
    print("-"*70)

    for test_name, test_data in results["tests"].items():
        status = "✓ PASS" if test_data["passed"] else "✗ FAIL"
        print(f"\n{test_name.upper()}: {status}")
        print(f"  Message: {test_data['message']}")

        if "available_backends" in test_data and test_data["available_backends"]:
            print(f"  Available Backends: {', '.join(test_data['available_backends'][:5])}")
            if len(test_data["available_backends"]) > 5:
                print(f"  ... and {len(test_data['available_backends']) - 5} more")

        if "details" in test_data:
            details = test_data["details"]
            print(f"  Permissions:")
            print(f"    - Can run jobs: {details.get('can_run_jobs', 'Unknown')}")
            print(f"    - Hardware access: {details.get('can_access_hardware', 'Unknown')}")
            print(f"    - Instance: {details.get('instance', 'Unknown')}")
            print(f"    - Plan: {details.get('plan', 'Unknown')}")

    print("\n" + "-"*70)
    print("RECOMMENDATION")
    print("-"*70)
    print(f"{results['recommendation']}")

    print("\n" + "="*70)


def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Validate IBM Quantum API tokens",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Validate token from environment variable
  export IBM_QUANTUM_TOKEN="your_token_here"
  python validate_ibm_token.py

  # Validate specific token
  python validate_ibm_token.py --token "your_token_here"

  # Output JSON format
  python validate_ibm_token.py --json
        """
    )

    parser.add_argument(
        "--token",
        help="IBM Quantum token to validate (or set IBM_QUANTUM_TOKEN env var)",
        default=None
    )

    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results in JSON format"
    )

    parser.add_argument(
        "--output",
        help="Save results to file",
        default=None
    )

    args = parser.parse_args()

    try:
        validator = IBMTokenValidator(token=args.token)
        is_valid, results = validator.validate_token()

        if args.json:
            print(json.dumps(results, indent=2))
        else:
            print_validation_report(results)

        if args.output:
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"\nResults saved to: {args.output}")

        # Exit with appropriate code
        sys.exit(0 if results["overall_status"] == "PASSED" else 1)

    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        print("\nPlease provide a token via --token parameter or IBM_QUANTUM_TOKEN environment variable.")
        sys.exit(2)
    except Exception as e:
        print(f"UNEXPECTED ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(3)


if __name__ == "__main__":
    main()
