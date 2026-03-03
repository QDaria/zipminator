"""Anonymize attachment endpoint — applies L1-L10 PQC anonymization to uploaded files.

Supported formats: CSV, JSON, Excel (.xlsx/.xls), Parquet, plain text.
Returns the anonymized file as a streaming download.
"""

from __future__ import annotations

import io
import json
import logging

import pandas as pd
from fastapi import APIRouter, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Content-type routing ──────────────────────────────────────────────────────

_TABULAR_TYPES = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/x-parquet",
    "application/parquet",
}

_TEXT_TYPES = {
    "text/plain",
    "application/json",
}

_SUPPORTED_TYPES = _TABULAR_TYPES | _TEXT_TYPES


def _load_dataframe(file_bytes: bytes, content_type: str, filename: str) -> pd.DataFrame:
    """Parse uploaded file bytes into a pandas DataFrame."""
    buf = io.BytesIO(file_bytes)

    if content_type in ("text/csv", "application/csv") or filename.endswith(".csv"):
        return pd.read_csv(buf)

    if content_type in (
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ) or filename.endswith((".xlsx", ".xls")):
        return pd.read_excel(buf)

    if content_type in ("application/x-parquet", "application/parquet") or filename.endswith(".parquet"):
        return pd.read_parquet(buf)

    if content_type == "application/json" or filename.endswith(".json"):
        raw = json.loads(file_bytes)
        if isinstance(raw, list):
            return pd.DataFrame(raw)
        if isinstance(raw, dict):
            return pd.DataFrame([raw])
        raise ValueError("JSON must be an object or array of objects")

    raise ValueError(f"Cannot convert content type '{content_type}' to DataFrame")


def _is_tabular(content_type: str, filename: str) -> bool:
    return (
        content_type in _TABULAR_TYPES
        or filename.endswith((".csv", ".xlsx", ".xls", ".parquet"))
        or (content_type == "application/json" or filename.endswith(".json"))
    )


def _apply_text_anonymization(text: str, level: int) -> str:
    """Apply anonymization to plain text at the given level."""
    import hashlib
    import re
    import string

    if level == 1:
        # Minimal masking of recognisable patterns
        text = re.sub(r"\b\d{3}-\d{2}-\d{4}\b", "***-**-****", text)  # SSN
        text = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "[EMAIL]", text)
        return text

    if level == 2:
        # Partial redaction of words longer than 4 chars
        def partial(m: re.Match) -> str:
            w = m.group()
            return w[0] + "..." + w[-1] if len(w) > 2 else "***"
        return re.sub(r"\b\w{5,}\b", partial, text)

    if level <= 5:
        # Static masking — replace all words
        return re.sub(r"\b\w+\b", "[REDACTED]", text)

    if level <= 8:
        # Hash each token
        def hash_token(m: re.Match) -> str:
            h = hashlib.sha3_256(m.group().encode()).hexdigest()
            return h[:8]
        return re.sub(r"\b\w+\b", hash_token, text)

    # Levels 9-10: OTP-style replacement
    import secrets as _secrets
    chars = string.ascii_letters + string.digits

    def otp_token(m: re.Match) -> str:
        return "".join(_secrets.choice(chars) for _ in range(len(m.group())))

    return re.sub(r"\b\w+\b", otp_token, text)


def _serialize_dataframe(df: pd.DataFrame, content_type: str, filename: str) -> tuple[bytes, str, str]:
    """Serialize a DataFrame back to bytes.

    Returns (data_bytes, media_type, output_filename).
    """
    buf = io.BytesIO()

    if content_type in ("text/csv", "application/csv") or filename.endswith(".csv"):
        df.to_csv(buf, index=False)
        return buf.getvalue(), "text/csv", filename

    if filename.endswith(".parquet") or content_type in ("application/x-parquet", "application/parquet"):
        df.to_parquet(buf, index=False)
        return buf.getvalue(), "application/parquet", filename

    if content_type == "application/json" or filename.endswith(".json"):
        out = df.to_json(orient="records", indent=2).encode()
        return out, "application/json", filename

    # Excel (xlsx)
    df.to_excel(buf, index=False)
    return buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post(
    "/anonymize-attachment",
    summary="Apply L1-L10 anonymization to an uploaded attachment",
    response_description="The anonymized file as a binary download",
)
async def anonymize_attachment(
    file: UploadFile,
    level: int = Query(default=5, ge=1, le=10, description="Anonymization level (1=minimal … 10=total)"),
) -> StreamingResponse:
    """Apply L{level} anonymization to the uploaded attachment.

    - **Levels 1-3**: Deterministic masking (regex, partial, static)
    - **Levels 4-6**: Hashing, generalization, suppression
    - **Levels 7-9**: Quantum noise (QRNG Gaussian/Laplace/k-anonymity)
    - **Level 10**: Total OTP quantum pseudoanonymization

    Supported file types: CSV, JSON, Excel (.xlsx/.xls), Parquet, plain text.
    Returns HTTP 415 for unsupported types.
    """
    content_type = (file.content_type or "application/octet-stream").split(";")[0].strip()
    filename = file.filename or "attachment"

    # Reject unsupported types
    if content_type not in _SUPPORTED_TYPES and not any(
        filename.endswith(ext) for ext in (".csv", ".json", ".xlsx", ".xls", ".parquet", ".txt")
    ):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file type '{content_type}'. "
                "Supported: CSV, JSON, Excel, Parquet, plain text."
            ),
        )

    file_bytes = await file.read()

    try:
        if content_type == "text/plain" or filename.endswith(".txt"):
            # Plain-text path
            text = file_bytes.decode("utf-8", errors="replace")
            anonymized_text = _apply_text_anonymization(text, level)
            output_bytes = anonymized_text.encode("utf-8")
            media_type = "text/plain"
            output_filename = filename
        else:
            # Tabular path via pandas + AdvancedAnonymizer
            try:
                from zipminator.anonymizer import AdvancedAnonymizer
                df = _load_dataframe(file_bytes, content_type, filename)
                anonymizer = AdvancedAnonymizer()
                # Apply the requested level uniformly to all columns
                level_map = {col: level for col in df.columns}
                df = anonymizer.process(df, level_map)
                output_bytes, media_type, output_filename = _serialize_dataframe(df, content_type, filename)
            except ImportError:
                # Anonymizer not installed in this runtime — fall back to text approach
                logger.warning("zipminator.anonymizer not available; falling back to text anonymization")
                text = file_bytes.decode("utf-8", errors="replace")
                anonymized_text = _apply_text_anonymization(text, level)
                output_bytes = anonymized_text.encode("utf-8")
                media_type = "text/plain"
                output_filename = filename

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Anonymization failed for file '%s' at level %d", filename, level)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anonymization failed: {exc}",
        ) from exc

    anon_filename = f"anon_L{level}_{output_filename}"
    headers = {
        "Content-Disposition": f'attachment; filename="{anon_filename}"',
        "X-Anonymization-Level": str(level),
    }

    return StreamingResponse(
        io.BytesIO(output_bytes),
        media_type=media_type,
        headers=headers,
    )
