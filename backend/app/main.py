from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.uploads import router as uploads_router
from app.api.jobs import router as jobs_router
from app.api.candidates import router as candidates_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(uploads_router, prefix=f"{settings.API_V1_STR}/uploads", tags=["uploads"])
app.include_router(jobs_router, prefix=f"{settings.API_V1_STR}/jobs", tags=["jobs"])
app.include_router(candidates_router, prefix=f"{settings.API_V1_STR}/candidates", tags=["candidates"])


from app.core.database import SessionLocal
from app.models.candidate import Candidate, ResumeHistory
from app.core.vector_index import add_candidate_to_index
from app.core.resume_parser import get_resume_experience_years
from sqlalchemy import select

@app.on_event("startup")
async def startup_event():
    # Hydrate candidate vector index from database
    try:
        async with SessionLocal() as db:
            result = await db.execute(select(Candidate))
            candidates = result.scalars().all()
            for candidate in candidates:
                r_res = await db.execute(
                    select(ResumeHistory)
                    .where(ResumeHistory.candidate_id == candidate.id)
                    .order_by(ResumeHistory.version.desc())
                )
                resume = r_res.scalars().first()
                if resume:
                    candidate_data = {
                        "name": candidate.name,
                        "skills": resume.skills or [],
                        "experience_years": get_resume_experience_years(resume),
                        "current_location": candidate.current_location,
                        "preferred_location": candidate.preferred_location,
                        "notice_period": candidate.notice_period,
                        "companies": resume.companies or [],
                        "education": resume.education or [],
                        "certifications": resume.certifications or [],
                        "summary": resume.resume_text[:200]
                    }
                    add_candidate_to_index(str(candidate.id), candidate_data)
    except Exception as e:
        print(f"Failed to hydrate candidates vector index: {e}")


@app.get("/")
def read_root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "healthy",
        "api_docs": "/docs"
    }
