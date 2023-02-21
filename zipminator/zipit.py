import pandas as pd
import getpass
import zipfile
import os
import time
import datetime


class Zipndel:
    def __init__(self, file_name: str = 'df', file_format: str = 'csv', self_destruct_time=None):
        """
        Initialize Zipndel object.

        Parameters:
        file_name (str): the name of the file to be written, default is 'df'
        file_format (str): the file format of the file to be written, default is 'csv'
        self_destruct_time (tuple): a tuple of (hours, minutes, seconds) until self-destruct, default is None
        """
        self.file_name = file_name
        self.file_format = file_format
        self.self_destruct_time = self_destruct_time

    def zipit(self, df: pd.DataFrame) -> None:
        """
        Write the input dataframe to a file, create a zip file with the written file, set a password for the zip file, and delete the written file.

        Parameters:
        df (pd.DataFrame): the input dataframe to be written to file and zipped

        Example:
        >>> df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
        >>> Zipndel().zipit(df)
        """
        # write dataframe to a pandas supported file
        write_func = getattr(df, f'to_{self.file_format}')
        write_func(self.file_name, index=False)

        # create zip file and add the written file to it
        df_zip = f"{self.file_name}.zip"
        zf = zipfile.ZipFile(df_zip, mode='w')
        try:
            zf.write(self.file_name, compress_type=zipfile.ZIP_DEFLATED)
        finally:
            zf.close()

        # set password for zip file
        passwd = getpass.getpass('Password:')
        os.system(f'zip --password {passwd} {df_zip} {self.file_name}')

        # delete written file
        os.remove(self.file_name)

        # self-destruct timer
        if self.self_destruct_time is not None:
            hours, minutes, seconds = self.self_destruct_time
            self.self_destruct(hours, minutes, seconds)

    def self_destruct(self, hours: int, minutes: int, seconds: int) -> None:
        """
        Set the self-destruct timer for the zip file.

        Parameters:
        hours (int): number of hours until self-destruct
        minutes (int): number of minutes until self-destruct
        seconds (int): number of seconds until self-destruct
        """
        df_zip = f"{self.file_name}.zip"
        self_destruct_time = time.time() + hours * 60 * 60 + minutes * 60 + seconds
        while True:
            if time.time() > self_destruct_time:
                os.remove(df_zip)
                print(
                    f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Zip file deleted due to self-destruct timer.")
                break
            time.sleep(5)
