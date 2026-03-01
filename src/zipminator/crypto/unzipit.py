# zipminator/unzipit.py
import pandas as pd
import pyzipper
import time
import threading
import getpass
import os
import hashlib
import random
import string
import re


# zipminator/unzipit.py

class Unzipndel:

    def __init__(self, file_name='df', file_format='csv'):
        self.file_name = file_name
        self.file_format = file_format

    def unzipit(self):
        """Unzip the file, read it using pandas, and delete the unzipped file.

        Returns:
            pd.DataFrame: A pandas dataframe containing the unzipped and read data.

        Raises:
            RuntimeError: If the password is incorrect or the file cannot be unzipped.
        """
        password = getpass.getpass('Password: ')
        with pyzipper.AESZipFile(f"{self.file_name}.zip") as zf:
            zf.setpassword(password.encode())
            zf.extract(self.file_name)

        read_func = getattr(pd, f'read_{self.file_format}')
        df = read_func(self.file_name)

        os.remove(self.file_name)

        return df
