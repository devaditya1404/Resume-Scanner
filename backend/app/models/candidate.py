import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, Float, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name_original: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    full_name_romanized: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    current_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    preferred_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notice_period: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    expected_salary: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    last_contact_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    resumes: Mapped[List["ResumeHistory"]] = relationship("ResumeHistory", back_populates="candidate", cascade="all, delete-orphan")
    changes: Mapped[List["ResumeChanges"]] = relationship("ResumeChanges", back_populates="candidate", cascade="all, delete-orphan")
    duplicate_logs: Mapped[List["DuplicateLog"]] = relationship("DuplicateLog", back_populates="matched_candidate", cascade="all, delete-orphan")
    notes: Mapped[List["RecruiterNote"]] = relationship("RecruiterNote", back_populates="candidate", cascade="all, delete-orphan")
    timeline: Mapped[List["CandidateTimeline"]] = relationship("CandidateTimeline", back_populates="candidate", cascade="all, delete-orphan")
    job_matches: Mapped[List["JobMatch"]] = relationship("JobMatch", back_populates="candidate", cascade="all, delete-orphan")


class ResumeHistory(Base):
    __tablename__ = "resume_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False
    )
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    file_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    resume_text: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Parsed structured data saved as JSON
    skills: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    experience: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    education: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    companies: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    projects: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    certifications: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    languages: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    
    # Translation metadata
    original_language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    original_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    translated_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    translation_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    translation_model: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # New name fields for multi-language tracking
    full_name_original: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    full_name_romanized: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="resumes")


class ResumeChanges(Base):
    __tablename__ = "resume_changes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False
    )
    from_resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resume_history.id", ondelete="CASCADE"),
        nullable=False
    )
    to_resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resume_history.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Details of changes detected
    skills_added: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    experience_increased: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    companies_added: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    certifications_added: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    notice_period_changed: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    salary_updated: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="changes")


class DuplicateLog(Base):
    __tablename__ = "duplicate_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    similarity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    matched_candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False
    )
    action_taken: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "VERSION_CREATED", "IGNORED"
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    matched_candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="duplicate_logs")


class RecruiterNote(Base):
    __tablename__ = "recruiter_notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    note: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="notes")


class CandidateTimeline(Base):
    __tablename__ = "candidate_timeline"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "IMPORT", "UPDATE", "NOTE", "MATCH"
    event_details: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="timeline")


class JobRequirement(Base):
    __tablename__ = "job_requirements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Extracted fields from Raw text using AI Recruiter Brain
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    mandatory_skills: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    preferred_skills: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    experience: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    salary: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    joining_timeline: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    job_matches: Mapped[List["JobMatch"]] = relationship("JobMatch", back_populates="job_requirement", cascade="all, delete-orphan")


class JobMatch(Base):
    __tablename__ = "job_matches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("job_requirements.id", ondelete="CASCADE"),
        nullable=False
    )
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False
    )
    
    overall_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    skill_match: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    experience_match: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    location_match: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    salary_fit: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    joining_probability: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    strengths: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    weaknesses: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    missing_skills: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    risk_analysis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reason_why: Mapped[str] = mapped_column(Text, nullable=False)
    recommended_action: Mapped[str] = mapped_column(String(255), nullable=False) # e.g. "CONTACT_IMMEDIATELY"
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    job_requirement: Mapped["JobRequirement"] = relationship("JobRequirement", back_populates="job_matches")
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="job_matches")


class Upload(Base):
    __tablename__ = "uploads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(100), default="PENDING", nullable=False) # "PENDING", "PROCESSING", "COMPLETED", "FAILED", "NEEDS_REVIEW"
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
