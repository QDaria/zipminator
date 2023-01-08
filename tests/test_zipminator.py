import unittest
from zipminator.zipit import Zipndel
import pandas as pd
import numpy
from zipminator import __version__


def test_version():
    assert __version__ == '0.1.0'


def test_zipndel():
    # create an instance of Zipndel
    zipndel = Zipndel(file_name='df', file_format='csv')
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})

    # set password for zip file
    password = "test_password"
    zipndel.set_password(password)

    # call zipit method on the instance
    zipndel.zipit(df)

    # check if zip file was created
    zip_file_path = f"{zipndel.file_name}.zip"
    assert os.path.exists(zip_file_path)

    # clean up (delete zip file)
    os.remove(zip_file_path)


def test_unzipndel():
    # create an instance of Unzipndel
    unzipndel = Unzipndel(file_name='df', file_format='csv')

    # pass password to unzipit method
    password = "test_password"
    unzipped_df = unzipndel.unzipit(password)

    # check if the returned dataframe is equal to the original dataframe
    assert unzipped_df.equals(df)

    # delete df.csv file
    csv_file_path = f"{unzipndel.file_name}.{unzipndel.file_format}"
    os.remove(csv_file_path)
