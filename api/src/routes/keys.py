from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import secrets
import hashlib
from src.db.database import get_db
from src.db.models import User, APIKey
from src.models.keys import APIKeyCreate, APIKeyResponse, APIKeyList
from src.middleware.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    key_data: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new API key

    Args:
        key_data: API key creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created API key (with plaintext key included)
    """
    # Generate random API key
    api_key = f"zip_{secrets.token_urlsafe(32)}"

    # Hash the API key for storage
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()

    # Create API key record
    db_key = APIKey(
        user_id=current_user.id,
        key_hash=key_hash,
        name=key_data.name,
        rate_limit=key_data.rate_limit
    )

    db.add(db_key)
    db.commit()
    db.refresh(db_key)

    # Return with plaintext key (only time it's shown)
    response = APIKeyResponse.model_validate(db_key)
    response.key = api_key  # Include plaintext key

    return response


@router.get("/", response_model=APIKeyList)
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all API keys for current user

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of API keys (without plaintext keys)
    """
    keys = db.query(APIKey).filter(APIKey.user_id == current_user.id).all()

    return {
        "keys": [APIKeyResponse.model_validate(k) for k in keys],
        "total": len(keys)
    }


@router.get("/{key_id}", response_model=APIKeyResponse)
async def get_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get API key details

    Args:
        key_id: API key ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        API key details

    Raises:
        HTTPException: If key not found or doesn't belong to user
    """
    db_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()

    if not db_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    return db_key


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an API key

    Args:
        key_id: API key ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If key not found or doesn't belong to user
    """
    db_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()

    if not db_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    db.delete(db_key)
    db.commit()

    return None


@router.patch("/{key_id}/deactivate", response_model=APIKeyResponse)
async def deactivate_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deactivate an API key

    Args:
        key_id: API key ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated API key

    Raises:
        HTTPException: If key not found or doesn't belong to user
    """
    db_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()

    if not db_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )

    db_key.is_active = False
    db.commit()
    db.refresh(db_key)

    return db_key
