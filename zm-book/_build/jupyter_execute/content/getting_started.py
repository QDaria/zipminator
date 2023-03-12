#!/usr/bin/env python
# coding: utf-8

# # Virtual Environments
# 
# First, prior to installation it is highly recomended to create a virtual environment. A virtual environment is a tool that allows you to create an isolated Python environment for your project, separate from your system's global Python environment and other Python projects. This means that you can install specific versions of Python packages and dependencies that your project needs without affecting other Python projects or the system's global Python environment.
# 
# Creating a virtual environment is especially useful when you are working on multiple Python projects simultaneously that require different versions of the same package or library. It also allows you to easily switch between different Python versions and dependencies for each project.
# 
# Using a virtual environment also helps you to avoid conflicts with other Python projects or system libraries. It ensures that your project runs on a consistent and isolated environment, which can help to prevent potential bugs and errors caused by incompatible package versions. Buletting some of the benefits of using virtual environments:
# 
# - `Isolation:` Keeps your project dependencies and packages separate from other Python projects and system libraries.
# - `Consistency:` Ensures that your project runs on a consistent and isolated environment.
# - `Flexibility:` Allows you to easily switch between different Python versions and dependencies for each project.
# - `Stability:` Helps to prevent potential bugs and errors caused by incompatible package versions.
# 
# To create a virtual environment called `zenv` with `Python` `3.8` using conda, you can follow these steps:
# 
# 1. Open your favourite terminal (check out Hyper ;)) and activate conda environment, if it is not already activated.
# 2. Run the following command to create a new virtual environment with the name zenv and Python 3.8:
# 
# ```lua
# conda create -n zenv python=3.8
# ```
# 
# 3. Once the environment is created, activate it using the following command:
# 
# ```bash
# conda activate zenv
# ```
# 
# This will activate the zenv virtual environment and you should see (zenv) prefix in your terminal prompt.
# Now you can install and use zipminator library in this virtual environment.
# 
# ## Installation with pip
# 
# To install zipminator using pip, run the following command in your terminal:
# 
# ```bash
# pip install zipminator
# ```
# 
# ## Installation with conda
# 
# To install zipminator using conda, run the following command in your terminal:
# 
# ```bash
# conda install -c conda-forge zipminator
# ```
# 
# Note that conda installation will install additional dependencies required by the package, while pip installation assumes that these dependencies are already installed in your system.
# 
# ## Installation from source
# 
# To install Zipminator from source, follow these steps:
# 
# Clone the Zipminator repository from GitHub:
# 
# ```bash
# git clone https://github.com/QDaria/zipminator.git
# ```
# 
# Navigate to the cloned repository directory:
# 
# ```bash
# cd zipminator
# ```
# 
# Create a virtual environment:
# 
# ```shell
# python -m venv venv
# ```
# 
# Activate the virtual environment:
# On Windows:
# 
# ```
# venv\Scripts\activate.bat
# ```
# 
# On Unix or Linux:
# 
# ```bash
# source venv/bin/activate
# ```
# 
# Install the required dependencies:
# 
# ```bash
# pip install -r requirements.txt
# ```
# 
# Install Zipminator using pip:
# 
# ```bash
# pip install .
# ```
# 
# Zipminator should now be installed on your system. You can verify the installation by running the tests:
# 
# ```bash
# python -m unittest discover tests
# ```
# 
# If all tests pass, you are ready to use Zipminator.
# 
# # Zipndel class
# 
# The Zipndel class is used to create an encrypted zip file from a Pandas DataFrame, and optionally delete the original file. The class contains the following methods:
# 
# `__init__(self, file_name: str, file_format: str = 'csv')`: Initializes a new instance of the Zipndel class with the specified file name and format. The file_name parameter is required and specifies the name of the file to be zipped. The file_format parameter is optional and specifies the format of the file to be zipped. If no format is specified, it defaults to `csv`.
# `zipit(self, df: pd.DataFrame, password: str = None, delete_original: bool = True) -> None:` Zips a Pandas DataFrame with optional password protection and file deletion. The `df` parameter is required and specifies the DataFrame to be zipped. The password parameter is optional and specifies the password to be used for encryption. If no password is specified, the user will be prompted to enter one. The delete_original parameter is optional and specifies whether or not to delete the original file after it has been zipped. If `True`, the original file will be deleted.
# To create an instance of the Zipndel class, you need to specify the name of the file to be zipped:
# 
# ```{eval-rst}
# .. autoclass:: zipminator.zipit.Zipndel
#     :members:
#     :undoc-members:
#     :show-inheritance:
# ```
# 
# The Zipndel class is a Python class that provides a simple way to compress, encrypt and delete Pandas DataFrames.
# 
# **Attributes**
# `file_name (str):` The name of the file to be written, default is 'df'.
# `file_format (str):` The file format of the file to be written, default is 'csv'.
# `self_destruct_time` (tuple): A tuple of (hours, minutes, seconds) until self-destruct, default is (672, 0, 0).
# `password (str):` The password to use for the zip file, default is None.
# `encryption_algorithm (str):` The encryption algorithm to use for the zip file, default is 'AES'.
# `mask_columns (list):` The list of columns to mask, default is None.
# `anonymize_columns (list):` The list of columns to anonymize, default is None.
# `compliance_check (bool):` Whether to perform a compliance check on the data, default is False.
# `audit_trail (bool):` Whether to keep an audit trail, default is False.
# **Methods**
# `zipit(df: pd.DataFrame) -> None:` Compresses and encrypts the given pandas DataFrame and writes it to a zip file.
# `self_destruct(hours: int, minutes: int, seconds: int) -> None:` Deletes the compressed and encrypted file after a specified amount of time.
# `mask(df: pd.DataFrame, columns: list) -> pd.DataFrame:` Masks sensitive data in the specified DataFrame columns by applying a SHA-256 hash function.
# `anonymize(df: pd.DataFrame, columns: list) -> pd.DataFrame:` Anonymizes sensitive data in the specified DataFrame columns by replacing it with random characters.

# In[1]:


import pandas as pd
from zipminator import Zipndel

df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
Zipndel(file_name='my_file', password='my_password', mask_columns=['B'], anonymize_columns=['C']).zipit(df)

