from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import base64
import time
from src.db.database import get_db
from src.db.models import EncryptionLog
from src.models.crypto import (
    KeyPairGenerateRequest,
    KeyPairResponse,
    EncryptRequest,
    EncryptResponse,
    DecryptRequest,
    DecryptResponse
)
from src.services.rust_cli import cli_wrapper
from src.middleware.auth import verify_api_key, get_current_user
from src.db.models import User, APIKey

router = APIRouter()


@router.post("/keygen", response_model=KeyPairResponse)
async def generate_keypair(
    request: KeyPairGenerateRequest,
    api_key: APIKey = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Generate Kyber768 keypair

    Args:
        request: Keypair generation options
        api_key: API key for authentication
        db: Database session

    Returns:
        Public and secret keys (base64-encoded)
    """
    start_time = time.time()

    try:
        # Generate keypair using Rust CLI
        public_key, secret_key = cli_wrapper.generate_keypair(use_quantum=request.use_quantum)

        duration_ms = int((time.time() - start_time) * 1000)

        # Log operation
        log = EncryptionLog(
            user_id=api_key.user_id,
            api_key_id=api_key.id,
            operation="keygen",
            used_quantum=request.use_quantum,
            duration_ms=duration_ms,
            success=True
        )
        db.add(log)
        db.commit()

        return KeyPairResponse(
            public_key=public_key,
            secret_key=secret_key,
            algorithm="kyber768",
            quantum_entropy=request.use_quantum
        )

    except Exception as e:
        # Log failure
        log = EncryptionLog(
            user_id=api_key.user_id,
            api_key_id=api_key.id,
            operation="keygen",
            used_quantum=request.use_quantum,
            duration_ms=int((time.time() - start_time) * 1000),
            success=False,
            error_message=str(e)
        )
        db.add(log)
        db.commit()

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
    """
    Encrypt data using Kyber768

    Args:
        request: Encryption request with public key and plaintext
        api_key: API key for authentication
        db: Database session

    Returns:
        Ciphertext and shared secret
    """
    start_time = time.time()

    try:
        # Decode plaintext from base64
        plaintext = base64.b64decode(request.plaintext)

        # Encrypt using Rust CLI
        ciphertext, shared_secret = cli_wrapper.encrypt(request.public_key, plaintext)

        duration_ms = int((time.time() - start_time) * 1000)

        # Log operation
        log = EncryptionLog(
            user_id=api_key.user_id,
            api_key_id=api_key.id,
            operation="encrypt",
            bytes_processed=len(plaintext),
            duration_ms=duration_ms,
            success=True
        )
        db.add(log)
        db.commit()

        return EncryptResponse(
            ciphertext=ciphertext,
            shared_secret=shared_secret,
            algorithm="kyber768",
            bytes_encrypted=len(plaintext)
        )

    except Exception as e:
        # Log failure
        log = EncryptionLog(
            user_id=api_key.user_id,
            api_key_id=api_key.id,
            operation="encrypt",
            duration_ms=int((time.time() - start_time) * 1000),
            success=False,
            error_message=str(e)
        )
        db.add(log)
        db.commit()

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
    """
    Decrypt data using Kyber768

    Args:
        request: Decryption request with secret key and ciphertext
        api_key: API key for authentication
        db: Database session

    Returns:
        Plaintext and shared secret
    """
    start_time = time.time()

    try:
        # Decrypt using Rust CLI
        plaintext, shared_secret = cli_wrapper.decrypt(request.secret_key, request.ciphertext)

        duration_ms = int((time.time() - start_time) * 1000)

        # Encode plaintext to base64
        plaintext_b64 = base64.b64encode(plaintext).decode('utf-8')

        # Log operation
        log = EncryptionLog(
            user_id=api_key.user_id,
            api_key_id=api_key.id,
            operation="decrypt",
            bytes_processed=len(plaintext),
            duration_ms=duration_ms,
            success=True
        )
        db.add(log)
        db.commit()

        return DecryptResponse(
            plaintext=plaintext_b64,
            shared_secret=shared_secret,
            algorithm="kyber768",
            bytes_decrypted=len(plaintext)
        )

    except Exception as e:
        # Log failure
        log = EncryptionLog(
            user_id=api_key.user_id,
            api_key_id=api_key.id,
            operation="decrypt",
            duration_ms=int((time.time() - start_time) * 1000),
            success=False,
            error_message=str(e)
        )
        db.add(log)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Decryption failed: {str(e)}"
        )
