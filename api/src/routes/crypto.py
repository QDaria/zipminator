from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import base64
import time
import secrets
from src.db.database import get_db
from src.db.models import EncryptionLog
from src.models.crypto import (
    KeyPairGenerateRequest,
    KeyPairResponse,
    EncryptRequest,
    EncryptResponse,
    DecryptRequest,
    DecryptResponse,
    CryptoOperation,
    Algorithm,
)
from src.services.rust_cli import get_cli_wrapper
from src.middleware.auth import verify_api_key, get_current_user
from src.db.models import User, APIKey

router = APIRouter()

# Server-side key store (in production, use encrypted DB or HSM)
_key_store: dict = {}


def _log_operation(
    db: Session, api_key: APIKey, operation: CryptoOperation,
    start_time: float, success: bool, bytes_processed: int = 0,
    error_message: str = None, use_quantum: bool = False,
):
    """Shared logging for all crypto operations."""
    log = EncryptionLog(
        user_id=api_key.user_id,
        api_key_id=api_key.id,
        operation=operation.value,
        used_quantum=use_quantum,
        bytes_processed=bytes_processed,
        duration_ms=int((time.time() - start_time) * 1000),
        success=success,
        error_message=error_message,
    )
    db.add(log)
    db.commit()


@router.post("/keygen", response_model=KeyPairResponse)
async def generate_keypair(
    request: KeyPairGenerateRequest,
    api_key: APIKey = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Generate Kyber768 keypair. Secret key is stored server-side."""
    start_time = time.time()

    try:
        cli = get_cli_wrapper()
        public_key, secret_key = cli.generate_keypair(use_quantum=request.use_quantum)

        # Store secret key server-side, return opaque key_id
        key_id = secrets.token_hex(16)
        _key_store[key_id] = secret_key

        _log_operation(db, api_key, CryptoOperation.KEYGEN, start_time, True, use_quantum=request.use_quantum)

        return KeyPairResponse(
            public_key=public_key,
            key_id=key_id,
            algorithm=Algorithm.KYBER768,
            quantum_entropy=request.use_quantum,
        )

    except Exception as e:
        _log_operation(db, api_key, CryptoOperation.KEYGEN, start_time, False, error_message=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Keypair generation failed: {str(e)}"
        )


@router.post("/encrypt", response_model=EncryptResponse)
async def encrypt_data(
    request: EncryptRequest,
    api_key: APIKey = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Encrypt data using Kyber768. Shared secret is kept server-side."""
    start_time = time.time()

    try:
        plaintext = base64.b64decode(request.plaintext)
        cli = get_cli_wrapper()
        ciphertext, _shared_secret = cli.encrypt(request.public_key, plaintext)

        _log_operation(db, api_key, CryptoOperation.ENCRYPT, start_time, True, bytes_processed=len(plaintext))

        return EncryptResponse(
            ciphertext=ciphertext,
            algorithm=Algorithm.KYBER768,
            bytes_encrypted=len(plaintext),
        )

    except Exception as e:
        _log_operation(db, api_key, CryptoOperation.ENCRYPT, start_time, False, error_message=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Encryption failed: {str(e)}"
        )


@router.post("/decrypt", response_model=DecryptResponse)
async def decrypt_data(
    request: DecryptRequest,
    api_key: APIKey = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Decrypt data using Kyber768. Retrieves secret key by key_id."""
    start_time = time.time()

    try:
        secret_key = _key_store.get(request.key_id)
        if not secret_key:
            raise ValueError("Invalid or expired key_id")

        cli = get_cli_wrapper()
        plaintext, _shared_secret = cli.decrypt(secret_key, request.ciphertext)

        plaintext_b64 = base64.b64encode(plaintext).decode('utf-8')

        _log_operation(db, api_key, CryptoOperation.DECRYPT, start_time, True, bytes_processed=len(plaintext))

        return DecryptResponse(
            plaintext=plaintext_b64,
            algorithm=Algorithm.KYBER768,
            bytes_decrypted=len(plaintext),
        )

    except Exception as e:
        _log_operation(db, api_key, CryptoOperation.DECRYPT, start_time, False, error_message=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Decryption failed: {str(e)}"
        )
