from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class Algorithm(str, Enum):
    KYBER768 = "kyber768"


class CryptoOperation(str, Enum):
    KEYGEN = "keygen"
    ENCRYPT = "encrypt"
    DECRYPT = "decrypt"


class KeyPairGenerateRequest(BaseModel):
    """Keypair generation request"""

    use_quantum: bool = Field(default=False, description="Use quantum entropy for key generation")


class KeyPairResponse(BaseModel):
    """Keypair generation response -- secret key is stored server-side, not returned"""

    public_key: str = Field(..., description="Base64-encoded Kyber768 public key (1184 bytes)")
    key_id: str = Field(..., description="Opaque reference to the server-stored secret key")
    algorithm: str = Field(default=Algorithm.KYBER768, description="Post-quantum algorithm used")
    quantum_entropy: bool = Field(default=False, description="Whether quantum entropy was used")


class EncryptRequest(BaseModel):
    """Encryption request"""

    public_key: str = Field(..., description="Base64-encoded Kyber768 public key")
    plaintext: str = Field(..., description="Base64-encoded plaintext data")


class EncryptResponse(BaseModel):
    """Encryption response -- shared secret is used server-side, not returned"""

    ciphertext: str = Field(..., description="Base64-encoded ciphertext")
    algorithm: str = Field(default=Algorithm.KYBER768)
    bytes_encrypted: int


class DecryptRequest(BaseModel):
    """Decryption request"""

    key_id: str = Field(..., description="Key ID from keypair generation")
    ciphertext: str = Field(..., description="Base64-encoded ciphertext")


class DecryptResponse(BaseModel):
    """Decryption response"""

    plaintext: str = Field(..., description="Base64-encoded plaintext data")
    algorithm: str = Field(default=Algorithm.KYBER768)
    bytes_decrypted: int
