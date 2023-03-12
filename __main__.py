# zipminator/__main__.py

import string
import random
import unittest
import zipfile
import time
from src.zipit import Zipndel
from src.unzipit import Unzipndel
import pandas as pd
import numpy
from src import __version__
import os
import getpass


if __name__ == '__main__':
    # create dataframe and zip file with self-destruct timer
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
    zipndel = Zipndel(file_name='df', file_format='csv',
                      self_destruct_time=(0, 0, 18))
    zipndel.zipit(df)

    # unzip file and read into dataframe
    unzipndel = Unzipndel(file_name='df', file_format='csv')
    passwd = getpass.getpass('Password:')
    zf = zipfile.ZipFile(f"{unzipndel.file_name}.zip", mode='r')
    zf.setpassword(passwd.encode('utf-8'))
    zf.extract(f"{unzipndel.file_name}.{unzipndel.file_format}")
    df = pd.read_csv(f"{unzipndel.file_name}.{unzipndel.file_format}")
    zf.close()
    os.remove(f"{unzipndel.file_name}.{unzipndel.file_format}")
    os.remove(f"{unzipndel.file_name}.zip")
    print(df.head())

    # create dataframe and zip file without self-destruct timer
    df = pd.DataFrame({'A': [4, 5, 6], 'B': [7, 8, 9], 'C': [10, 11, 12]})
    zipndel = Zipndel(file_name='df2', file_format='csv')
    zipndel.zipit(df)

    # unzip file and read into dataframe
    unzipndel = Unzipndel(file_name='df2', file_format='csv')
    passwd = getpass.getpass('Password:')
    zf = zipfile.ZipFile(f"{unzipndel.file_name}.zip", mode='r')
    zf.setpassword(passwd.encode('utf-8'))
    zf.extract(f"{unzipndel.file_name}.{unzipndel.file_format}")
    df = pd.read_csv(f"{unzipndel.file_name}.{unzipndel.file_format}")
    zf.close()
    os.remove(f"{unzipndel.file_name}.{unzipndel.file_format}")
    os.remove(f"{unzipndel.file_name}.zip")
    print(df.head())

    # set self-destruct timer for existing zip file
    zipndel = Zipndel(file_name='df3', file_format='csv')
    zipndel.self_destruct(0, 0, 30)
