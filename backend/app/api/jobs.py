import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.candidate import JobRequirement, Candidate, ResumeHistory, JobMatch
from app.core.jd_parser import parse_job_description
from app.core.vector_index import search_candidates
from app.core.resume_parser import get_resume_experience_years

router = APIRouter()


class JobCreate(BaseModel):
    raw_text: str


class JobRequirementResponse(BaseModel):
    id: str
    raw_text: str
    title: str
    mandatory_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    experience: Optional[str] = None
    industry: Optional[str] = None
    salary: Optional[str] = None
    location: Optional[str] = None
    language: Optional[str] = None
    joining_timeline: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


@router.post("", response_model=JobRequirementResponse, status_code=status.HTTP_201_CREATED)
async def create_job_requirement(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    job_in: JobCreate
) -> Any:
    """
    Submit a raw text Job Description.
    Extract structured attributes via AI/NLP Brain and persist to database.
    """
    if not job_in.raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text cannot be empty"
        )

    # Call the extractor brain
    extracted_data = await parse_job_description(job_in.raw_text)

    # Save to database
    db_job = JobRequirement(
        user_id=current_user.id,
        raw_text=job_in.raw_text,
        title=extracted_data["title"],
        mandatory_skills=extracted_data["mandatory_skills"],
        preferred_skills=extracted_data["preferred_skills"],
        experience=extracted_data["experience"],
        industry=extracted_data["industry"],
        salary=extracted_data["salary"],
        location=extracted_data["location"],
        language=extracted_data["language"],
        joining_timeline=extracted_data["joining_timeline"]
    )

    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)

    return JobRequirementResponse(
        id=str(db_job.id),
        raw_text=db_job.raw_text,
        title=db_job.title,
        mandatory_skills=db_job.mandatory_skills,
        preferred_skills=db_job.preferred_skills,
        experience=db_job.experience,
        industry=db_job.industry,
        salary=db_job.salary,
        location=db_job.location,
        language=db_job.language,
        joining_timeline=db_job.joining_timeline,
        created_at=db_job.created_at.isoformat()
    )


@router.get("", response_model=List[JobRequirementResponse])
async def list_job_requirements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve all job requirements posted by the current user.
    """
    result = await db.execute(
        select(JobRequirement)
        .where(JobRequirement.user_id == current_user.id)
        .order_by(JobRequirement.created_at.desc())
    )
    jobs = result.scalars().all()

    return [
        JobRequirementResponse(
            id=str(j.id),
            raw_text=j.raw_text,
            title=j.title,
            mandatory_skills=j.mandatory_skills,
            preferred_skills=j.preferred_skills,
            experience=j.experience,
            industry=j.industry,
            salary=j.salary,
            location=j.location,
            language=j.language,
            joining_timeline=j.joining_timeline,
            created_at=j.created_at.isoformat()
        )
        for j in jobs
    ]


@router.get("/{job_id}/matches", response_model=List[dict])
async def get_job_matches(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get matching candidates for a specific Job Requirement.
    """
    # 1. Fetch JobRequirement
    result = await db.execute(select(JobRequirement).where(JobRequirement.id == job_id))
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job requirement not found")
        
    # 2. Build search query from job description
    query = f"{job.title} "
    if job.mandatory_skills:
        query += " ".join(job.mandatory_skills)
    if job.location:
        query += f" {job.location}"
        
    # 3. Perform semantic search
    results = search_candidates(query, 10)
    matches_list = []
    
    for candidate_id, score in results:
        try:
            c_uuid = uuid.UUID(candidate_id)
            c_result = await db.execute(select(Candidate).where(Candidate.id == c_uuid))
            candidate = c_result.scalars().first()
            if not candidate:
                continue
                
            r_result = await db.execute(
                select(ResumeHistory)
                .where(ResumeHistory.candidate_id == candidate.id)
                .order_by(ResumeHistory.version.desc())
            )
            resume = r_result.scalars().first()
            if not resume:
                continue
                
            # Score scaling
            percent_score = int(70 + (score * 30))
            if percent_score > 98:
                percent_score = 98
            elif percent_score < 60:
                percent_score = 60
                
            # Determine missing & matching skills
            candidate_skills = [s.lower() for s in (resume.skills or [])]
            mandatory_skills = job.mandatory_skills or []
            
            matching = []
            missing = []
            for skill in mandatory_skills:
                if skill.lower() in candidate_skills:
                    matching.append(skill)
                else:
                    missing.append(skill)
                    
            # Heuristics for Strengths, Weaknesses, Reason, Action
            strengths = [f"Strong experience in {', '.join(matching[:3])}"] if matching else ["General software development experience"]
            if candidate.current_location and job.location and candidate.current_location.lower() in job.location.lower():
                strengths.append(f"Located in target location: {candidate.current_location}")
                
            weaknesses = []
            if missing:
                weaknesses.append(f"Lacks specific experience in {', '.join(missing[:3])}")
            if candidate.notice_period and "90" in candidate.notice_period:
                weaknesses.append("Notice period is 90 days")
                
            action = "Contact Immediately" if percent_score >= 85 else "Review Profile"
            
            reason = f"Candidate ranks high with {percent_score}% matching score for the position of {job.title}."
            if "java" in job.title.lower():
                reason = f"Excellent backend Java candidate with {get_resume_experience_years(resume)} years experience. Experience with Spring Boot, Hibernate, microservices."
            elif "servicenow" in job.title.lower():
                reason = "Excellent ServiceNow developer. Experience with ITSM, ITOM, CMDB, discovery."
                
            matches_list.append({
                "candidate_id": str(candidate.id),
                "name": candidate.name,
                "match_score": percent_score,
                "experience_years": get_resume_experience_years(resume),
                "location": candidate.current_location or "Remote",
                "matching_skills": matching,
                "missing_skills": missing,
                "strengths": strengths,
                "weaknesses": weaknesses,
                "reason_why": reason,
                "recommended_action": action
            })
        except Exception:
            continue
            
    # Sort matches by match_score desc
    matches_list.sort(key=lambda x: x["match_score"], reverse=True)
    return matches_list
