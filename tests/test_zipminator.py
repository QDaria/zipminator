import os
import pytest
import pandas as pd
import getpass
from src.zipit import Zipndel
from src.unzipit import Unzipndel
import pyzipper
import getpass
import unittest.mock

from src import Zipndel, Unzipndel


def test_zipminator(tmp_path):
    # Create a test dataframe
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})

    # Set the file path and name
    file_path = os.path.join(tmp_path, 'test_file.csv')

    # Create a Zipndel object
    zipndel = Zipndel(file_name=file_path, file_format='csv')

    # Zip the test dataframe
    zipndel.zipit(df)

    # Check that the zip file exists and that the csv file has been deleted
    assert os.path.exists(f'{file_path}.zip')
    assert not os.path.exists(file_path)

    # Create an Unzipndel object
    unzipndel = Unzipndel(file_name=file_path)

    # Extract the contents of the specified zip file
    with unittest.mock.patch('getpass.getpass', return_value='password'):
        df_extracted = unzipndel.unzipit()

    # Check that the extracted contents match the original dataframe
    pd.testing.assert_frame_equal(df_extracted, df)
