import pandas as pd
import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from zipminator.anonymizer import AdvancedAnonymizer

def test_anonymizer():
    # Create sample data
    data = {
        'id': ['ID001', 'ID002', 'ID003'],
        'name': ['John Doe', 'Jane Smith', 'Bob Wilson'],
        'email': ['john@example.com', 'jane@test.org', 'bob@company.net'],
        'age': [25, 45, 68],
        'income': [50000, 120000, 85000],
        'secret_code': ['SECRET_1', 'SECRET_2', 'SECRET_3']
    }
    df = pd.DataFrame(data)
    
    anonymizer = AdvancedAnonymizer(pqc_key_seed=b"kyber768_native_seed")
    
    # Map columns to levels
    level_map = {
        'email': 1,        # Minimal Masking
        'name': 3,         # Static Masking
        'id': 4,           # PQC Pseudonymization
        'age': 5,          # Generalization
        'income': 7,       # Quantum Jitter
        'secret_code': 10  # Quantum Pseudo
    }
    
    print("--- Original DataFrame ---")
    print(df)
    
    print("\nProcessing Anonymization (L1-L10)...")
    anon_df = anonymizer.process(df, level_map)
    
    print("\n--- Anonymized DataFrame ---")
    print(anon_df)
    
    # Basic Checks
    assert "[REDACTED]" in anon_df['name'].values
    assert anon_df['email'].iloc[0].startswith("j***@")
    assert anon_df['age'].iloc[0] != 25 # Should be a range string
    
    print("\n✅ Anonymization Verification Passed!")

if __name__ == "__main__":
    test_anonymizer()
