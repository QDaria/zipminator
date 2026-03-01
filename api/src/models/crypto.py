from pydantic import BaseModel, Field
from typing import Optional


class KeyPairGenerateRequest(BaseModel):
    """Keypair generation request"""

    use_quantum: bool = Field(default=False, description="Use quantum entropy for key generation")


class KeyPairResponse(BaseModel):
    """Keypair generation response"""

    public_key: str = Field(..., description="Base64-encoded Kyber768 public key (1184 bytes)")
    secret_key: str = Field(..., description="Base64-encoded Kyber768 secret key (2400 bytes)")
    algorithm: str = Field(default="kyber768", description="Post-quantum algorithm used")
    quantum_entropy: bool = Field(default=False, description="Whether quantum entropy was used")


class EncryptRequest(BaseModel):
    """Encryption request"""

    public_key: str = Field(..., description="Base64-encoded Kyber768 public key")
    plaintext: str = Field(..., description="Base64-encoded plaintext data")


class EncryptResponse(BaseModel):
    """Encryption response"""

    ciphertext: str = Field(..., description="Base64-encoded ciphertext")
    shared_secret: str = Field(..., description="Base64-encoded shared secret (32 bytes)")
    algorithm: str = Field(default="kyber768")
    bytes_encrypted: int


class DecryptRequest(BaseModel):
    """Decryption request"""

    secret_key: str = Field(..., description="Base64-encoded Kyber768 secret key")
    ciphertext: str = Field(..., description="Base64-encoded ciphertext")


class DecryptResponse(BaseModel):
    """Decryption response"""

    plaintext: str = Field(..., description="Base64-encoded plaintext data")
    shared_secret: str = Field(..., description="Base64-encoded shared secret (32 bytes)")
    algorithm: str = Field(default="kyber768")
    bytes_decrypted: int
