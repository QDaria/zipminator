# Zipndel class

The **`Zipndel class`** is used to create an encrypted zip file from a Pandas DataFrame, and optionally delete the original file. The class contains the following methods:

**`__init__(self, file_name: str, file_format: str = 'csv'):`** <br> Initializes a new instance of the Zipndel class with the specified file name and format. The file_name parameter is required and specifies the name of the file to be zipped. The file_format parameter is optional and specifies the format of the file to be zipped. If no format is specified, it defaults to `csv`.
**`zipit(self, df: pd.DataFrame, password: str = None, delete_original: bool = True) -> None:`** <br> Zips a Pandas DataFrame with optional password protection and file deletion. The `df` parameter is required and specifies the DataFrame to be zipped. The password parameter is optional and specifies the password to be used for encryption. If no password is specified, the user will be prompted to enter one. The delete_original parameter is optional and specifies whether or not to delete the original file after it has been zipped. If `True`, the original file will be deleted.
To create an instance of the Zipndel class, you need to specify the name of the file to be zipped:

```{eval-rst}
.. autoclass:: zipminator.zipit.Zipndel
    :members:
    :undoc-members:
    :show-inheritance:
```

The Zipndel class is a Python class that provides a simple way to compress, encrypt and delete Pandas DataFrames.

**Attributes**
`file_name (str):` The name of the file to be written, default is 'df'.
`file_format (str):` The file format of the file to be written, default is 'csv'.
`self_destruct_time` (tuple): A tuple of (hours, minutes, seconds) until self-destruct, default is (672, 0, 0).
`password (str):` The password to use for the zip file, default is None.
`encryption_algorithm (str):` The encryption algorithm to use for the zip file, default is 'AES'.
`mask_columns (list):` The list of columns to mask, default is None.
`anonymize_columns (list):` The list of columns to anonymize, default is None.
`compliance_check (bool):` Whether to perform a compliance check on the data, default is False.
`audit_trail (bool):` Whether to keep an audit trail, default is False.
**Methods**
`zipit(df: pd.DataFrame) -> None:` Compresses and encrypts the given pandas DataFrame and writes it to a zip file.
`self_destruct(hours: int, minutes: int, seconds: int) -> None:` Deletes the compressed and encrypted file after a specified amount of time.
`mask(df: pd.DataFrame, columns: list) -> pd.DataFrame:` Masks sensitive data in the specified DataFrame columns by applying a SHA-256 hash function.
`anonymize(df: pd.DataFrame, columns: list) -> pd.DataFrame:` Anonymizes sensitive data in the specified DataFrame columns by replacing it with random characters.

```python
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
        zipit(df: pd.DataFrame) -> None:
            Write the input DataFrame to a file, create a zip file with the written file, set a password for the zip file,
            and delete the written file.

        self_destruct(hours: int, minutes: int, seconds: int) -> None:
            Delete the compressed and encrypted file after a specified amount of time.

        mask(df: pd.DataFrame, columns: list) -> pd.DataFrame:
            Mask sensitive data in the specified columns with a SHA-256 hash.

        anonymize(df: pd.DataFrame, columns: list) -> pd.DataFrame:
            Anonymize sensitive data in the specified columns with random characters.

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

    def zipit(self, df):
        """
        Compresses and encrypts the given pandas DataFrame and writes it to a zip file.

        Args:
            df (pandas.DataFrame): The DataFrame to compress and encrypt.

        Returns:
            None

        Raises:
            None

        Example:
            >>> df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
            >>> Zipndel().zipit(df)
        """
        if self.mask_columns is not None:
            df = self.mask(df, self.mask_columns)

        if self.anonymize_columns is not None:
            df = self.anonymize(df, self.anonymize_columns)

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
            t = threading.Thread(target=self.self_destruct,
                                 args=self.self_destruct_time)
            t.start()

    def self_destruct(self, hours, minutes, seconds):
        """Deletes the compressed file after a specified amount of time has elapsed.

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

    def mask(self, df, columns):
        """Masks sensitive data in the specified DataFrame columns by applying a SHA-256 hash function.

        Args:
            df (pandas.DataFrame): The DataFrame to mask sensitive data in.
            columns (list): A list of strings specifying the names of the columns to mask.

        Returns:
            pandas.DataFrame: A copy of the input DataFrame with the specified columns masked.
        """

        for col in columns:
            df[col] = df[col].apply(
                lambda x: hashlib.sha256(str(x).encode()).hexdigest())
        return df

    def anonymize(self, df, columns):
        """Anonymizes sensitive data in the specified DataFrame columns by replacing it with random characters.

        Args:
            df (pandas.DataFrame): The DataFrame to anonymize sensitive data in.
            columns (list): A list of strings specifying the names of the columns to anonymize.

        Returns:
            pandas.DataFrame: A copy of the input DataFrame with the specified columns anonymized.
        """
        for col in columns:
            df[col] = df[col].apply(lambda x: ''.join(
                random.choices(string.ascii_uppercase + string.digits, k=10)))
        return df
```

# Unzipndel class

```{eval-rst}
.. autoclass:: zipminator.unzipit.Unzipndel
    :members:
    :undoc-members:
    :show-inheritance:
```

```python
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

class Unzipndel:
"""Class for unzipping and reading a file using Zipminator.

    Attributes:
        file_name (str): The name of the file to be unzipped and read, default is 'df'.
        file_format (str): The file format of the file to be unzipped and read, default is 'csv'.

    Methods:
        unzipit(): Unzip the file, read it using pandas, and delete the unzipped file.
    """

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
```

# Examples

```python
import pandas as pd
from zipminator import Zipndel

df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
Zipndel(file_name='my_file', password='my_password', mask_columns=['B'], anonymize_columns=['C']).zipit(df)
```

# Appendix

https://www.datatilsynet.no/globalassets/global/dokumenter-pdfer-skjema-ol/regelverk/veiledere/anonymisering-veileder-041115.pdf


* Differential Privacy
* k-anonymity
* l-diversity
* t-closeness
* Generalization
* Suppression
* Aggregation
* Pseudonymization
* Encryption
* Hashing
* Tokenization
* Masking
* De-identification
* Anonymization
* Data minimization
* Data retention
* Data deletion
* Data destruction
* Data obfuscation
* Data aggregation
* Data generalization
* Data suppression
* Data masking
* Data tokenization
* Data encryption
* Data hashing
* Data pseudonymization
* Data de-identification



Her skulle vi nevnte bakgrunnen (restrisiko er akseptert fra Hans Petter + dette gjelder pilot om tilstedeværelse i bygg + hvilke datafelter trenger vi + begrensninger i uttrekkene.

Here is a breakdown of the fields in the provided dictionary:

_id: This is an identifier assigned by MongoDB to uniquely identify the document.
client: This is a dictionary containing information about the WiFi client.
clientmac: This is the MAC address of the client device.
details: This is a list containing additional details about the client's WiFi connection.
seenonap: This is the name of the access point (AP) on which the client was last seen.
ssid: This is the Service Set Identifier (SSID) of the wireless network that the client was connected to.
clientip: This is the IP address assigned to the client device by the network.
username: This is the username associated with the client device, if applicable.
lastSeen: This is the timestamp indicating when the client was last seen on the network.
It seems like the dictionary contains information about a specific WiFi client, including details about their connection to the network, such as the access point they were last seen on, the SSID of the network they were connected to, their IP address, and the timestamp of their last connection.



**`Det bes om Wifi data av typen:`** 

{'_id': ObjectId('6335d2cc454b6283b947e2c3'), 'client': {'clientmac': '046c.59d9.115b', 'details': [{'seenonap': 'NAV-B06-09', 'ssid': 'NAV', 'clientip': '172.28.160.196', 'username': 'navn@nav.no', 'lastSeen': '2022-09-29 19:15:05'}]}}

**`Formål:`** *Pilot om tilstedeværelse i bygg.* Hennsikten med forespørselen er å kartlegge tilstedeværelse i alle oppholdsrom Fystikkalleen 1 for å gi økt innsikt til beslutningstøtte og optimalisering av ressurser. Derfor er vi mere opptatt av aggregerte data, pseudoanonymisert, anonymisert eller maskerte personopplysninger med tidspunkt, lokasjon på NAV ansatte på dedikerte ansatt-wifi og ikke noe interesse i NAV-guest for eksempel. Nedenfor gis nivå av viktighet hva de forskjellige feltene er for oss fra 1-10, der 1 har bortimot ingen viktighet og 10 er kritisk viktig <br>
**`Gjennomføring`:** <br> Wifi data ønskes overført fra Flowscape til Azure plattformen for renskning, behandling og preparering til maskinlæringsalgoritmer, analyser og eller visualisering. <br>
**`Periode`:** <br> 2. januar 2023 - DD og fremtiden <br>
**`Risikoeier:`** Hans Petter ... (Har godkjent restrisiko) <br>
**`Prosjektleder:`** Eric Bortzmeyer <br>
**`Teamleder:`** Lars Røed Hansen <br>
**`Data Scientist:`** Daniel Mo Houshmand <br>
**`Begrensninger i uttrekkene: - Hva er det vi trenger å vite om:`** <br>
    * **brukeren?** `1/10` <br>
    * **tilstedeværelsen?** `10/10` <br>
    * **bygget?** `10/10`<br>
    * **tilgangspunktet?** `10/10`<br>
    * **nettverket?** `8/10`<br>
    * **IP-adressen?** `3/10`<br>
    * **brukernavnet?** `1/10`<br>
    * **datoen og klokkeslettet?**`9/10` <br>

**Jeg ber om tilgang til wifi data av formen:**
{`'_id'`: ObjectId('6335d2cc454b6283b947e2c3'), `'client':` {`'clientmac':` '046c.59d9.115b', `'details':` [{`'seenonap':` 'NAV-B06-09', `ssid':` 'NAV-gjest', `'clientip':` '172.28.160.196', `'username':` 'navn@nav.no', `'lastSeen':` '2022-09-29 19:15:05'}]}} <br>


`'_id':` ObjectId('6335d2cc454b6283b947e2c3') <br>
Dette feltet kan ignoreres da det bare er en unik identifikator generert av databasen. <br>

`'client':` {'clientmac': '046c.59d9.115b', 'details': [{'seenonap': 'NAV-B06-09', 'ssid': 'NAV'<br>
`'clientip':` '172.28.160.196', 'username': 'navn@nav.no', 'lastSeen': '2022-09-29 19:15:05'}]} <br>
`'clientmac'` er MAC-adressen til enheten som brukte Wi-Fi-tilgangspunktet. <br>
`'seenonap'` er navnet på tilgangspunktet enheten var tilkoblet. <br>
`'ssid'` er navnet på Wi-Fi-nettverket som enheten brukte. <br>
`'clientip'` er IP-adressen som enheten ble tildelt av Wi-Fi-tilgangspunktet. <br>
`'username'` er brukernavnet til personen som er knyttet til enheten. <br>
`'lastSeen'` er datoen og klokkeslettet for når enheten sist ble observert på Wi-Fi-tilgangspunktet <br>