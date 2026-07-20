import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.candidate import Upload
from app.schemas.user import UserResponse

router = APIRouter()


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_file(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...)
) -> Any:
    """
    Upload a resume file or ZIP folder containing resumes.
    Creates an Upload database entry.
    """
    # Read file properties
    contents = await file.read()
    file_size = len(contents)
    
    # Validation
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )
        
    if not (file.filename.endswith(".zip") or file.filename.endswith(".pdf") or file.filename.endswith(".docx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only ZIP, PDF, or DOCX are accepted."
        )

    # Save tracking entry to database
    db_upload = Upload(
        user_id=current_user.id,
        file_name=file.filename,
        file_size=file_size,
        status="PROCESSING"
    )
    
    db.add(db_upload)
    await db.commit()
    await db.refresh(db_upload)

    return {
        "id": str(db_upload.id),
        "file_name": db_upload.file_name,
        "file_size": db_upload.file_size,
        "status": db_upload.status,
        "created_at": db_upload.created_at.isoformat()
    }


@router.get("", response_model=List[dict])
async def list_uploads(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get all uploads logged by the current user.
    """
    result = await db.execute(
        select(Upload)
        .where(Upload.user_id == current_user.id)
        .order_by(Upload.created_at.desc())
    )
    uploads = result.scalars().all()
    
    return [
        {
            "id": str(u.id),
            "file_name": u.file_name,
            "file_size": u.file_size,
            "status": u.status,
            "created_at": u.created_at.isoformat()
        }
        for u in uploads
    ]
