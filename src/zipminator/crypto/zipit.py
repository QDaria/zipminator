import pandas as pd
import pyzipper
import time
import threading
import getpass
import os
import hashlib
import random
import string
import json
from typing import List, Optional
from .quantum_random import QuantumRandom, getrandbits, choice

# Initialize Quantum Random Generator
qrand = QuantumRandom()

# Import PII Scanner
try:
    from .pii_scanner import PIIScanner
    PII_SCANNER_AVAILABLE = True
except ImportError:
    PII_SCANNER_AVAILABLE = False

# Import Anonymization Engine
try:
    from .anonymization import AnonymizationEngine
    ANONYMIZATION_ENGINE_AVAILABLE = True
except ImportError:
    ANONYMIZATION_ENGINE_AVAILABLE = False

# Import PQC
try:
    from .pqc import PQC
    PQC_AVAILABLE = True
except ImportError:
    PQC_AVAILABLE = False


class Zipndel:
    """Class for compressing and encrypting Pandas DataFrames and deleting the original file.

    Attributes:
        file_name (str): The name of the file to be written, default is 'df'.
        file_format (str): The file format of the file to be written, default is 'csv'.
        self_destruct_enabled (bool): Whether to enable auto-activating self-destruct timer, default is False.
        self_destruct_time (tuple): A tuple of (hours, minutes, seconds) until self-destruct, default is (672, 0, 0).
        password (str): The password to use for the zip file, default is None.
        encryption_algorithm (str): The encryption algorithm to use for the zip file, default is 'AES'.
        mask_columns (list): The list of columns to mask, default is None.
        anonymize_columns (list): The list of columns to anonymize, default is None.
        compliance_check (bool): Whether to perform a compliance check on the data, default is False.
        audit_trail (bool): Whether to keep an audit trail, default is False.

    Methods:
        mask_columns(df: pd.DataFrame, columns: List[str]) -> pd.DataFrame:
            Mask sensitive data in the specified DataFrame columns by applying a SHA-256 hash function.

        anonymize_columns(df: pd.DataFrame, columns: List[str]) -> pd.DataFrame:
            Anonymize sensitive data in the specified DataFrame columns by replacing it with random characters.

        zipit(df: pd.DataFrame) -> None:
            Write the input DataFrame to a file, create a zip file with the written file, set a password for the zip file,
            and delete the written file.

        self_destruct(hours: int, minutes: int, seconds: int) -> None:
            Delete the compressed and encrypted file after a specified amount of time.

        decompress_and_read() -> pd.DataFrame:
            Unzip the file, read it using pandas, and delete the unzipped file.

    Example:
        >>> df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
        >>> Zipndel(file_name='my_file', password='my_password', mask_columns=['B'], anonymize_columns=['C']).zipit(df)
    """

    def __init__(self, file_name='df', file_format='csv', self_destruct_enabled=False, self_destruct_time=(672, 0, 0), password=None, encryption_algorithm='AES', mask_columns=None, anonymize_columns=None, compliance_check=False, audit_trail=False, auto_pii_scan=True, anonymization_level=1,
                 public_key_file=None):
        self.file_name = file_name
        self.file_format = file_format
        self.self_destruct_enabled = self_destruct_enabled
        self.self_destruct_time = self_destruct_time
        self.password = password
        self.encryption_algorithm = encryption_algorithm
        self.mask_columns = mask_columns
        self.anonymize_columns = anonymize_columns
        self.compliance_check = compliance_check
        self.audit_trail = audit_trail
        self.auto_pii_scan = auto_pii_scan
        self.anonymization_level = anonymization_level
        self.public_key_file = public_key_file
        self.last_pii_scan_results = None

        if self.public_key_file and PQC_AVAILABLE:
            self.pqc = PQC(level=768)  # Default to Kyber768
            print(f"🛡️ PQC Enabled: Using Kyber768 for key encapsulation")
        elif self.public_key_file and not PQC_AVAILABLE:
            print(
                "⚠️ PQC requested but kyber-py not available. Falling back to standard password.")
            self.public_key_file = None
            self.pqc = None
        else:
            self.pqc = None

        # Initialize anonymization engine
        if ANONYMIZATION_ENGINE_AVAILABLE:
            self._anonymization_engine = AnonymizationEngine()
        else:
            self._anonymization_engine = None
        self.last_pii_scan_results = None

        print(
            f"🔒 Secure Zip initialized with Quantum Entropy Support (Tier: {qrand.license_tier})")

        """
        Initialize the Zipndel object.

        Args:
            file_name (str): The name of the file to be written, default is 'df'.
            file_format (str): The file format of the file to be written, default is 'csv'.
            self_destruct_enabled (bool): Whether to enable auto-activating self-destruct timer, default is False.
            self_destruct_time (tuple): A tuple of (hours, minutes, seconds) until self-destruct, default is (672, 0, 0).
            password (str): The password to use for the zip file, default is None.
            encryption_algorithm (str): The encryption algorithm to use for the zip file, default is 'AES'.
            mask_columns (list): The list of columns to mask, default is None.
            anonymize_columns (list): The list of columns to anonymize, default is None.
            compliance_check (bool): Whether to perform a compliance check on the data, default is False.
            audit_trail (bool): Whether to keep an audit trail, default is False.
            auto_pii_scan (bool): Whether to automatically scan for PII before encryption, default is True.
            anonymization_level (int): Current anonymization level (1-10), default is 1.
        """

    def zipit(self, df: pd.DataFrame) -> None:
        """
        Write the input DataFrame to a file, create a zip file with the written file, set a password for the zip file,
        and delete the written file.

        Args:
            df (pandas.DataFrame): The DataFrame to compress and encrypt.

        Returns:
            None

        Raises:
            None
        """
        # Perform automatic PII scanning before encryption
        if self.auto_pii_scan and PII_SCANNER_AVAILABLE:
            self._perform_pii_scan(df)

        # Apply anonymization using the engine if available
        if self.mask_columns is not None:
            if self._anonymization_engine:
                df = self._anonymization_engine.apply_anonymization(
                    df, self.mask_columns, self.anonymization_level)
            else:
                df = self._mask_columns(df, self.mask_columns)

        if self.anonymize_columns is not None:
            if self._anonymization_engine:
                df = self._anonymization_engine.apply_anonymization(
                    df, self.anonymize_columns, self.anonymization_level)
            else:
                df = self._anonymize_columns(df, self.anonymize_columns)

        write_func = getattr(df, f'to_{self.file_format}')
        write_func(self.file_name, index=False)

        df_zip = f"{self.file_name}.zip"
        # PQC Key Encapsulation
        kyber_ciphertext = None
        if self.pqc and self.public_key_file:
            try:
                with open(self.public_key_file, 'rb') as f:
                    pk = f.read()

                ciphertext, shared_secret = self.pqc.encapsulate(pk)
                self.password = shared_secret.hex()
                kyber_ciphertext = ciphertext
                print(f"🔑 Generated Quantum-Safe Password using Kyber768")
                print(
                    f"   Password (Shared Secret Hex): {self.password[:16]}...")
            except Exception as e:
                print(f"❌ PQC Encapsulation Failed: {e}")
                # Fallback? Or raise? Raise is safer.
                raise e

        with pyzipper.AESZipFile(df_zip, 'w', compression=pyzipper.ZIP_DEFLATED, encryption=getattr(pyzipper, f'WZ_{self.encryption_algorithm}')) as zf:
            if self.password is None:
                self.password = getpass.getpass('Enter password: ')
            zf.setpassword(self.password.encode('utf-8'))
            zf.write(self.file_name)

            # Save Kyber ciphertext if applicable
            if kyber_ciphertext:
                kyber_file = f"{df_zip}.kyber"
                with open(kyber_file, 'wb') as f:
                    f.write(kyber_ciphertext)
                print(f"🔒 Saved Kyber Encapsulated Key to: {kyber_file}")
                # Add comment to zip
                zf.comment = f"Encrypted with Kyber768. Key file: {os.path.basename(kyber_file)}".encode(
                    'utf-8')
            # Explicitly close the zip file to release file handles
            zf.close()

        # Ensure original file is removed after zip creation
        if self.self_destruct_enabled:
            # Use secure delete if self-destruct is enabled
            from .self_destruct import SelfDestruct
            sd = SelfDestruct(log_operations=self.audit_trail)
            sd.secure_delete_file(self.file_name)
        else:
            # Standard delete
            os.remove(self.file_name)

        # Auto-activate self-destruct if enabled
        if self.self_destruct_enabled and self.self_destruct_time:
            hours, minutes, seconds = self.self_destruct_time
            print(
                f"⏰ Self-destruct timer activated: {hours}h {minutes}m {seconds}s")

            # Store metadata for persistent timer
            metadata_file = f"{self.file_name}.metadata.json"
            metadata = {
                'encrypted_at': time.time(),
                'self_destruct_at': time.time() + (hours*3600 + minutes*60 + seconds),
                'self_destruct_enabled': True,
                'file': f"{self.file_name}.zip",
                'hours': hours,
                'minutes': minutes,
                'seconds': seconds
            }

            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)

            # Start async timer thread
            timer_thread = threading.Thread(
                target=self._self_destruct,
                args=self.self_destruct_time,
                daemon=True
            )
            timer_thread.start()

            print(
                f"💣 File will self-destruct in {hours} hours, {minutes} minutes, {seconds} seconds")
            print(f"📝 Metadata saved to {metadata_file}")

    def _mask_columns(self, df: pd.DataFrame, columns: List[str]) -> pd.DataFrame:
        """Mask sensitive data in the specified DataFrame columns by applying a SHA-256 hash function.

        Args:
            df (pandas.DataFrame): The DataFrame to mask sensitive data in.
            columns (list): A list of strings specifying the names of the columns to mask.

        Returns:
            pandas.DataFrame: A copy of the input DataFrame with the specified columns masked.
        """
        df = df.copy()
        for col in columns:
            df[col] = df[col].apply(
                lambda x: hashlib.sha256(str(x).encode()).hexdigest())
        return df

    def _anonymize_columns(self, df: pd.DataFrame, columns: List[str]) -> pd.DataFrame:
        """Anonymize sensitive data in the specified DataFrame columns by replacing it with random characters.

        Args:
            df (pandas.DataFrame): The DataFrame to anonymize sensitive data in.
            columns (list): A list of strings specifying the names of the columns to anonymize.

        Returns:
            pandas.DataFrame: A copy of the input DataFrame with the specified columns anonymized.
        """
        df = df.copy()
        for col in columns:
            df[col] = df[col].apply(lambda x: ''.join(
                [choice(string.ascii_uppercase + string.digits) for _ in range(10)]))
        return df

    def _self_destruct(self, hours: int, minutes: int, seconds: int) -> None:
        """Delete the compressed and encrypted file after a specified amount of time has elapsed.

        Args:
            hours (int): The number of hours until file deletion.
            minutes (int): The number of minutes until file deletion.
            seconds (int): The number of seconds until file deletion.

        Returns:
        None
        """
        df_zip = f"{self.file_name}.zip"
        metadata_file = f"{self.file_name}.metadata.json"
        self_destruct_time = time.time() + hours * 60 * 60 + minutes * 60 + seconds

        while True:
            if time.time() > self_destruct_time:
                # Delete files with secure deletion
                from .self_destruct import SelfDestruct
                sd = SelfDestruct(log_operations=self.audit_trail)

                # Securely delete the zip file
                try:
                    sd.secure_delete_file(df_zip)
                    print(f"✅ Securely deleted: {df_zip}")
                except Exception as e:
                    print(f"❌ Failed to securely delete {df_zip}: {e}")
                    # Fallback to standard delete with retry
                    self._delete_with_retry(df_zip)

                # Delete metadata file (standard delete is fine for metadata)
                self._delete_with_retry(metadata_file)
                break
            time.sleep(5)

    def _delete_with_retry(self, file_path: str, max_retries: int = 5, initial_delay: float = 0.1) -> None:
        """Delete a file with retry mechanism and exponential backoff.

        Args:
            file_path (str): Path to the file to delete
            max_retries (int): Maximum number of retry attempts
            initial_delay (float): Initial delay in seconds before first retry

        Returns:
            None
        """
        if not os.path.exists(file_path):
            return

        delay = initial_delay
        for attempt in range(max_retries):
            try:
                # Ensure file is closed by attempting to open and close it
                # This releases any lingering file handles
                try:
                    with open(file_path, 'rb') as f:
                        pass
                except (IOError, OSError):
                    pass

                # Attempt deletion
                os.remove(file_path)
                print(f"✅ Successfully deleted: {file_path}")
                return

            except PermissionError as e:
                if attempt < max_retries - 1:
                    print(
                        f"⚠️  File locked, retrying in {delay}s... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                    delay *= 2  # Exponential backoff
                else:
                    print(
                        f"❌ Failed to delete {file_path} after {max_retries} attempts: {e}")

            except FileNotFoundError:
                # File already deleted
                return

            except Exception as e:
                print(f"❌ Unexpected error deleting {file_path}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(delay)
                    delay *= 2
                else:
                    raise

    def _perform_pii_scan(self, df: pd.DataFrame) -> None:
        """
        Perform automatic PII scanning on DataFrame before encryption.
        Warns user and suggests anonymization level based on detected PII.

        Args:
            df (pandas.DataFrame): The DataFrame to scan for PII

        Returns:
            None
        """
        scanner = PIIScanner()
        scan_results = scanner.scan_dataframe(df)
        self.last_pii_scan_results = scan_results

        if scan_results['pii_detected']:
            print("\n" + "="*80)
            print("⚠️  PII DETECTION WARNING")
            print("="*80)
            print(f"Risk Level: {scan_results['risk_level'].value.upper()}")
            print(f"Columns with PII: {len(scan_results['columns_with_pii'])}")
            print(
                f"Recommended Anonymization Level: {scan_results['recommended_anonymization_level']}/10")
            print()

            # Display detailed warnings
            for warning in scan_results['warnings']:
                print(f"  {warning}")

            print()
            print("Affected columns:")
            for col, matches in scan_results['columns_with_pii'].items():
                pii_types = [m.pii_type.value for m in matches]
                print(f"  - {col}: {', '.join(pii_types)}")

            # Suggest anonymization level increase
            if self.anonymization_level < scan_results['recommended_anonymization_level']:
                print()
                print(f"💡 RECOMMENDATION:")
                print(
                    f"   Current anonymization level: {self.anonymization_level}")
                print(
                    f"   Suggested anonymization level: {scan_results['recommended_anonymization_level']}")
                print(
                    f"   Consider using: Zipndel(anonymization_level={scan_results['recommended_anonymization_level']})")

            # Suggest specific columns to mask/anonymize
            high_risk_columns = [
                col for col, matches in scan_results['columns_with_pii'].items()
                if any(m.confidence > 0.7 for m in matches)
            ]
            if high_risk_columns and not self.mask_columns and not self.anonymize_columns:
                print()
                print(f"💡 SUGGESTION:")
                print(f"   Consider masking these high-risk columns:")
                print(f"   mask_columns={high_risk_columns}")

            print("="*80)
            print()

    def get_pii_scan_results(self) -> Optional[dict]:
        """
        Get the results of the last PII scan performed.

        Returns:
            dict or None: The scan results if available, None otherwise
        """
        return self.last_pii_scan_results
