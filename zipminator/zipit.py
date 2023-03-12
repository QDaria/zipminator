import pandas as pd
import pyzipper
import time
import threading
import getpass
import os
import hashlib
import random
import string
from typing import List


class Zipndel:
    """Class for compressing and encrypting Pandas DataFrames and deleting the original file.

    Attributes:
        file_name (str): The name of the file to be written, default is 'df'.
        file_format (str): The file format of the file to be written, default is 'csv'.
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

    def __init__(self, file_name='df', file_format='csv', self_destruct_time=(672, 0, 0), password=None, encryption_algorithm='AES', mask_columns=None, anonymize_columns=None, compliance_check=False, audit_trail=False):
        self.file_name = file_name
        self.file_format = file_format
        self.self_destruct_time = self_destruct_time
        self.password = password
        self.encryption_algorithm = encryption_algorithm
        self.mask_columns = mask_columns
        self.anonymize_columns = anonymize_columns
        self.compliance_check = compliance_check
        self.audit_trail = audit_trail

        """
        Initialize the Zipndel object.

        Args:
            file_name (str): The name of the file to be written, default is 'df'.
            file_format (str): The file format of the file to be written, default is 'csv'.
            self_destruct_time (tuple): A tuple of (hours, minutes, seconds) until self-destruct, default is (672, 0, 0).
            password (str): The password to use for the zip file, default is None.
            encryption_algorithm (str): The encryption algorithm to use for the zip file, default is 'AES'.
            mask_columns (list): The list of columns to mask, default is None.
            anonymize_columns (list): The list of columns to anonymize, default is None.
            compliance_check (bool): Whether to perform a compliance check on the data, default is False.
            audit_trail (bool): Whether to keep an audit trail, default is False.
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
        if self.mask_columns is not None:
            df = self._mask_columns(df, self.mask_columns)

        if self.anonymize_columns is not None:
            df = self._anonymize_columns(df, self.anonymize_columns)

        write_func = getattr(df, f'to_{self.file_format}')
        write_func(self.file_name, index=False)

        df_zip = f"{self.file_name}.zip"
        with pyzipper.AESZipFile(df_zip, 'w', compression=pyzipper.ZIP_DEFLATED, encryption=getattr(pyzipper, f'WZ_{self.encryption_algorithm}')) as zf:
            if self.password is None:
                self.password = getpass.getpass('Enter password: ')
            zf.setpassword(self.password.encode('utf-8'))
            zf.write(self.file_name)

        os.remove(self.file_name)

        if self.self_destruct_time and self.self_destruct_time != False:
            t = threading.Thread(target=self._self_destruct,
                                 args=self.self_destruct_time)
            t.start()

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
                random.choices(string.ascii_uppercase + string.digits, k=10)))
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
        self_destruct_time = time.time() + hours * 60 * 60 + minutes * 60 + seconds
        while True:
            if time.time() > self_destruct_time:
                os.remove(df_zip)
                break
            time.sleep(5)
