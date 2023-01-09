# Zipminator

Zipminator is a lightweight python package with two main functionalities; Zipndel or Unzipndel, for zipping or unzipping a password-protected pandas DataFrame file, and then deleting the original file.


# Example usage
`pip  install zipminator`
## zipit

```python
from zipminator.zipit import Zipndel
import pandas as pd
import getpass
import zipfile
import os
```

### create instance of Zipndel and call zipit method

```python
zipndel = Zipndel(file_name='df', file_format='csv')
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
zipndel.zipit(df)
```

## unzipit

```python
from zipminator.unzipit import Unzipndel
```

### create instance of Unzipndel and call unzipit method

```python
unzipndel = Unzipndel(file_name='df', file_format='csv')
df = unzipndel.unzipit()
df
```
