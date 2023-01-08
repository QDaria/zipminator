from zipminator.zipit import Zipndel
import pandas as pd
import getpass
import zipfile
import os

zipndel = Zipndel(file_name='df', file_format='csv')
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
zipndel.zipit(df)
