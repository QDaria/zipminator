# Package overview

Zipminator is a Python package that provides a simple and convenient way to create and extract password-protected zip files. The package includes two main classes, `Zipndel` and `Unzipndel`, which respectively handle the creation and extraction of zip files.

The Zipndel class allows users to create password-protected zip files from data stored in pandas dataframes. The `Unzipndel` class can be used to extract data from password-protected zip files and convert it into a pandas dataframe.

Zipminator is designed to be simple and easy to use, with minimal configuration required. The package is compatible with Python 3.8 and above, and can be installed via pip or conda.

```bash
.
├── LICENSE
├── README.md
├── poetry.lock
├── pyproject.toml
├── tests
│   ├── __init__.py
│   └── test_zipminator.py
├── zipminator
│   ├── __init__.py
│   ├── __version__.py
│   ├── unzipit.py
│   └── zipit.py
```

# Installation with pip

To install zipminator using pip, run the following command in your terminal:

```bash
pip install zipminator
```

# Installation with conda

To install zipminator using conda, run the following command in your terminal:

```bash
conda install -c conda-forge zipminator
```

Note that conda installation will install additional dependencies required by the package, while pip installation assumes that these dependencies are already installed in your system.

# Installation from source

Alternatively, you can also install zipminator from source by cloning the GitHub repository and running the following command in your terminal:

```bash
python setup.py install
```

This will install the package and its dependencies in your system.

# Package overview

Zipminator is a Python package that provides a simple and convenient way to create and extract password-protected zip files. The package includes two main classes, `Zipndel` and `Unzipndel`, which respectively handle the creation and extraction of zip files.

The Zipndel class allows users to create password-protected zip files from data stored in pandas dataframes. The `Unzipndel` class can be used to extract data from password-protected zip files and convert it into a pandas dataframe.

Zipminator is designed to be simple and easy to use, with minimal configuration required. The package is compatible with Python 3.8 and above, and can be installed via pip or conda.

```bash
.
├── LICENSE
├── README.md
├── poetry.lock
├── pyproject.toml
├── tests
│   ├── __init__.py
│   └── test_zipminator.py
├── zipminator
│   ├── __init__.py
│   ├── __version__.py
│   ├── unzipit.py
│   └── zipit.py
```

## Zipndel class

The Zipndel class is used to create an encrypted zip file from a Pandas DataFrame, and optionally delete the original file. The class contains the following methods:

`__init__`(self, file_name: str, file_format: str = 'csv'): Initializes a new instance of the Zipndel class with the specified file name and format. The file_name parameter is required and specifies the name of the file to be zipped. The file_format parameter is optional and specifies the format of the file to be zipped. If no format is specified, it defaults to csv.
zipit(self, df: pd.DataFrame, password: str = None, delete_original: bool = True) -> None: Zips a Pandas DataFrame with optional password protection and file deletion. The df parameter is required and specifies the DataFrame to be zipped. The password parameter is optional and specifies the password to be used for encryption. If no password is specified, the user will be prompted to enter one. The delete_original parameter is optional and specifies whether or not to delete the original file after it has been zipped. If True, the original file will be deleted.
To create an instance of the Zipndel class, you need to specify the name of the file to be zipped:

```{eval-rst}
.. autoclass:: zipminator.zipit.Zipndel
    :members:
    :undoc-members:
    :show-inheritance:
```

.. autoclass:: zipminator.zipit.Zipndel
:members:

````{toggle} Zipndel class
```python
```zipit.py
# zipminator/zipit.py
import os
import getpass
import threading
import time
import pandas as pd
import pyzipper
import datetime


class Zipndel:
    def __init__(self, file_name: str = 'df', file_format: str = 'csv', self_destruct_time: tuple = (672, 0, 0), password: str = None):
        """
        Initialize Zipndel object.

        Parameters:
        file_name (str): the name of the file to be written, default is 'df'
        file_format (str): the file format of the file to be written, default is 'csv'
        self_destruct_time (tuple): a tuple of (hours, minutes, seconds) until self-destruct, default is (672, 0, 0)
        password (str): the password to use for the zip file, default is None
        """
        self.file_name = file_name
        self.file_format = file_format
        self.self_destruct_time = self_destruct_time
        self.password = password

    def zipit(self, df: pd.DataFrame) -> None:
        """
        Write the input dataframe to a file, create a zip file with the written file, set a password for the zip file,
        and delete the written file.

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
        with pyzipper.AESZipFile(df_zip, 'w', compression=pyzipper.ZIP_DEFLATED, encryption=pyzipper.WZ_AES) as zf:
            if self.password is None:
                self.password = getpass.getpass('Enter password: ')
            zf.setpassword(self.password.encode('utf-8'))
            zf.write(self.file_name)

        # delete written file
        os.remove(self.file_name)

        # self-destruct timer
        if self.self_destruct_time and self.self_destruct_time != False:
            t = threading.Thread(target=self.self_destruct,
                                 args=self.self_destruct_time)
            t.start()

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
```
```
````

```python

# zipminator/zipit.py
import os
import getpass
import threading
import time
import pandas as pd
import pyzipper
import datetime

class Zipndel:
    def __init__(self, file_name: str = 'df', file_format: str = 'csv', self_destruct_time: tuple = (672, 0, 0), password: str = None):
        """
        Initialize Zipndel object.

        Parameters:
        file_name (str): the name of the file to be written, default is 'df'
        file_format (str): the file format of the file to be written, default is 'csv'
        self_destruct_time (tuple): a tuple of (hours, minutes, seconds) until self-destruct, default is (672, 0, 0)
        password (str): the password to use for the zip file, default is None
        """
        self.file_name = file_name
        self.file_format = file_format
        self.self_destruct_time = self_destruct_time
        self.password = password

    def zipit(self, df: pd.DataFrame) -> None:
        """
        Write the input dataframe to a file, create a zip file with the written file, set a password for the zip file,
        and delete the written file.

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
        with pyzipper.AESZipFile(df_zip, 'w', compression=pyzipper.ZIP_DEFLATED, encryption=pyzipper.WZ_AES) as zf:
            if self.password is None:
                self.password = getpass.getpass('Enter password: ')
            zf.setpassword(self.password.encode('utf-8'))
            zf.write(self.file_name)

        # delete written file
        os.remove(self.file_name)

        # self-destruct timer
        if self.self_destruct_time and self.self_destruct_time != False:
            t = threading.Thread(target=self.self_destruct,
                                 args=self.self_destruct_time)
            t.start()

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
```

.. autoclass:: zipit.Zipndel
:members:
:undoc-members:
:show-inheritance:

.. autoclass:: myst_nb.core.lexers.AnsiColorLexer
:members:
:undoc-members:
:show-inheritance:

```{eval-rst}
.. autoclass:: zipminator.zipit.Zipndel
    :members:
    :undoc-members:
    :show-inheritance:
```
