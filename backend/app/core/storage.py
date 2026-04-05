"""
File storage abstraction.
Uses local filesystem by default, switches to S3 when AWS credentials are configured.
"""
import os
import shutil
import uuid
from pathlib import Path
from datetime import datetime, timezone, timedelta

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


def _use_s3() -> bool:
    return bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY)


def _get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.S3_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


async def upload_file(file_bytes: bytes, s3_key: str, content_type: str) -> str:
    """Upload file and return the storage key."""
    if _use_s3():
        client = _get_s3_client()
        client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type,
        )
    else:
        # Local fallback
        local_path = UPLOAD_DIR / s3_key
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(file_bytes)

    return s3_key


async def generate_presigned_url(s3_key: str, expires_in: int = 900) -> str:
    """Generate a presigned URL (or local file URL for dev)."""
    if _use_s3():
        client = _get_s3_client()
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET_NAME, "Key": s3_key},
            ExpiresIn=expires_in,
        )
        return url
    else:
        # Local fallback — serve via backend endpoint
        return f"/api/v1/documents/file/{s3_key}"


async def delete_file(s3_key: str) -> None:
    """Delete a file from storage."""
    if _use_s3():
        client = _get_s3_client()
        client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=s3_key)
    else:
        local_path = UPLOAD_DIR / s3_key
        if local_path.exists():
            local_path.unlink()


def get_local_file_path(s3_key: str) -> Path | None:
    """Get local file path (only for local fallback)."""
    local_path = UPLOAD_DIR / s3_key
    if local_path.exists():
        return local_path
    return None
