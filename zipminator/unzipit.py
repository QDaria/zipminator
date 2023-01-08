import pandas as pd
import getpass
import zipfile
import os


class Unzipndel:
    def __init__(self, file_name: str = 'df', file_format: str = 'csv'):
        """
        Initialize Unzipndel object.

        Parameters:
        file_name (str): the name of the file to be extracted, default is 'df'
        file_format (str): the file format of the file to be extracted, default is 'csv'
        """
        self.file_name = file_name
        self.file_format = file_format

    def unzipit(self) -> pd.DataFrame:
        """
        Unzip the zip file, extract the written file, read the extracted file into a DataFrame, and delete the extracted file.

        Returns:
        df (pd.DataFrame): the dataframe extracted from the zip file

        Example:
        >>> df = Unzipndel().unzipit()
        """
        # prompt user for password
        passwd = getpass.getpass('Password:')

        # unzip zip file and extract written file
        df_zip = f"{self.file_name}.zip"
        zf = zipfile.ZipFile(df_zip, mode='r')
        zf.extractall(pwd=passwd.encode())

        # read extracted file into a DataFrame
        read_func = getattr(pd, f'read_{self.file_format}')
        df = read_func(self.file_name)

        # delete extracted file
        os.remove(self.file_name)

        return df
