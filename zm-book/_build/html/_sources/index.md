---
jupytext:
  formats: md:myst
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.12
    jupytext_version: 1.6.0
kernelspec:
  display_name: Python 3
  language: python
  name: python3
---

```{nb-exec-table}

```

# Zipminator

**`Zipminator`**  is a versatile and powerful Python package designed to simplify and streamline file compression and decompression tasks, while also enhancing security and privacy protection. With Zipminator, users have a wide range of advanced features at their disposal, including multiple encryption algorithms such as AES, Blowfish, and RSA, as well as masking capabilities to hide sensitive information in files. In addition, the package provides anonymization techniques, including hashing, pseudonymization, and data suppression, to remove personal identifying information from files.

Zipminator is user-friendly, efficient, and highly customizable, making it suitable for a wide range of use cases. Originally intended for - and written by data scientists in **`The Norwegian Labour and Welfare Administration`** `NAV`, however nonetheless useful for developers and IT professionals dealing with large volumes of data that need to be compressed and transmitted efficiently Zipminator is also useful for anyone who needs to send or receive large files over email or other file-sharing services. The package includes compliance checks to ensure that files comply with **`GDPR`**, **`CCPA`**, and **`HIPAA`** regulations. It scans files for personal data and flags any data that may violate regulations, and an audit trail is kept to track who has accessed compressed files and when.

Zipminator offers a range of features that simplify and streamline file compression and decompression tasks. Its capabilities include creating zip files from single or multiple files or directories, extracting files from zip files, and deleting extracted files after use. Password protection for zip files ensures that sensitive data is kept secure during transmission or storage.

Zipminator is a powerful and flexible tool for protecting sensitive data and ensuring compliance with data privacy regulations. The package can be used as a Python library or from the command line, making it easy to integrate with other Python projects or automate the compression and decompression of files. It supports various compression algorithms, including **`ZIP_DEFLATED`**, **`LZMA`**, and **`BZIP2`**, and multiple encryption algorithms, including **`AES`**, **`Blowfish`**, and **`RSA`**.

Zipminator includes features for masking sensitive columns, enabling users to hide specific information in a file, such as social security numbers, email addresses, or phone numbers. The package also supports anonymization of sensitive data, allowing users to remove personal identifying information from a file using techniques such as **`hashing`**, **`pseudonymization`**, and **`data suppression`**.

Finally, Zipminator includes a **`self-destruct`** feature that automatically deletes compressed files after a specified period. This ensures that files are only available for a limited time, providing an extra layer of security.

```{tableofcontents}

```
