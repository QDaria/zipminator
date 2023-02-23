import string
import random
import unittest
from zipminator.zipit import Zipndel
from zipminator.unzipit import Unzipndel
import pandas as pd
import numpy
from zipminator import __version__
import os


def test_version():
    assert __version__ == '0.2.0'


class Password:
    @staticmethod
    def generate(length=8):
        """
        Generates a random password with lowercase and uppercase letters and digits.

        Parameters:
        length (int): the length of the password, default is 8

        Returns:
        password (str): the generated password
        """
        letters = string.ascii_letters + string.digits
        return ''.join(random.choice(letters) for i in range(length))


def test_zipit():
    # generate a random password for testing purposes
    passwd = Password.generate()

    # create a Zipndel object with the specified parameters
    zipndel = Zipndel(file_name='test_df', file_format='csv', passwd=passwd)

    # create a test DataFrame
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})

    # test the zipit method
    zipndel.zipit(df)

    # check that the zip file was created
    assert os.path.isfile(f"{zipndel.file_name}.zip")

    # check that the zip file contains the correct file
    zf = zipfile.ZipFile(f"{zipndel.file_name}.zip", mode='r')
    assert f"{zipndel.file_name}.{zipndel.file_format}" in zf.namelist()

    # test the self_destruct method
    zipndel.self_destruct(0, 0, 1)

    # wait for the zip file to be deleted
    time.sleep(2)

    # check that the zip file was deleted
    assert not os.path.isfile(f"{zipndel.file_name}.zip")


def test_self_destruct():
    # generate a random password for testing purposes
    passwd = Password.generate()

    # create a Zipndel object with the specified parameters
    zipndel = Zipndel(file_name='test_df', file_format='csv', passwd=passwd)

    # create a test DataFrame
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})

    # test the zipit method
    zipndel.zipit(df)

    # test the self_destruct method with a short time duration (2 seconds)
    zipndel.self_destruct(0, 0, 2)

    # wait for the self-destruct timer to expire
    time.sleep(3)

    # check that the zip file has been deleted
    assert not os.path.exists('test_df.zip')


def test_unzipit():
    # generate a random password for testing purposes
    passwd = Password.generate()

    # create a Zipndel object with the specified parameters
    zipndel = Zipndel(file_name='test_df', file_format='csv', passwd=passwd)

    # create a test DataFrame
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})

    # test the zipit method
    zipndel.zipit(df)

    # test the unzipit method
    unzipndel = Unzipndel(file_name=zipndel.file_name, passwd=passwd)
    df_unzipped = unzipndel.unzipit()

    # check that the unzipped DataFrame is equal to the original DataFrame
    assert df_unzipped.equals(df)

    # test the self_destruct method
    unzipndel.self_destruct(0, 0, 2)

    # wait for the zip file to be deleted
    time.sleep(3)

    # check that the zip file was deleted
    assert not os.path.isfile(f"{unzipndel.file_name}.zip")
