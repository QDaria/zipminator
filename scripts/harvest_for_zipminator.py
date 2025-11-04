#!/usr/bin/env python3
"""
Quick Quantum Harvest for Zipminator
Generates 100 bytes of quantum entropy and saves to production-ready format
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'python'))

from multi_provider_harvester import MultiProviderHarvester
import datetime
import hashlib

def main():
    print("🔮 Quantum Entropy Harvester for Zipminator")
    print("=" * 60)

    # Initialize harvester
    harvester = MultiProviderHarvester()

    # Show status
    status = harvester.get_provider_status()
    print(f"\n✅ Initialized providers: {status['initialized_providers']}")
    print(f"✅ Available backends: {status['total_backends']}")

    # Harvest 100 bytes
    print("\n🌌 Harvesting 100 bytes of quantum entropy...")
    try:
        entropy = harvester.harvest_quantum_entropy(100)

        # Save to multiple formats
        timestamp = datetime.datetime.utcnow().isoformat()

        # 1. Raw binary format
        output_dir = os.path.join(os.path.dirname(__file__), '..', 'production', 'entropy_pool')
        os.makedirs(output_dir, exist_ok=True)

        raw_file = os.path.join(output_dir, f'quantum_entropy_{timestamp}.bin')
        with open(raw_file, 'wb') as f:
            f.write(entropy)

        # 2. Hex format for verification
        hex_file = os.path.join(output_dir, f'quantum_entropy_{timestamp}.hex')
        with open(hex_file, 'w') as f:
            f.write(entropy.hex())

        # 3. Metadata
        sha256 = hashlib.sha256(entropy).hexdigest()
        meta_file = os.path.join(output_dir, f'quantum_entropy_{timestamp}.meta')
        with open(meta_file, 'w') as f:
            f.write(f"timestamp: {timestamp}\n")
            f.write(f"bytes: {len(entropy)}\n")
            f.write(f"sha256: {sha256}\n")
            f.write(f"provider: {status['initialized_providers'][0] if status['initialized_providers'] else 'simulator'}\n")

        print(f"\n✅ Successfully harvested {len(entropy)} bytes!")
        print(f"📁 Saved to: {output_dir}")
        print(f"   - {os.path.basename(raw_file)}")
        print(f"   - {os.path.basename(hex_file)}")
        print(f"   - {os.path.basename(meta_file)}")
        print(f"\n🔐 SHA-256: {sha256}")

        # Show sample (first 16 bytes)
        print(f"\n📊 Sample (first 16 bytes): {entropy[:16].hex()}")

        return 0

    except Exception as e:
        print(f"\n❌ Harvest failed: {e}")
        print("💡 This is likely because IBM credentials are not set")
        print("   The harvester will use simulator as fallback")
        return 1

if __name__ == "__main__":
    sys.exit(main())
