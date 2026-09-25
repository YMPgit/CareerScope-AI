from fastapi import APIRouter

from app.api import analyses, auth, dashboard, jobs, market, profile, resumes, roadmaps, settings, skills

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(analyses.router, prefix="/analyses", tags=["analyses"])
api_router.include_router(market.router, prefix="/market", tags=["market"])
api_router.include_router(skills.router, prefix="/skills", tags=["skills"])
api_router.include_router(roadmaps.router, prefix="/roadmaps", tags=["roadmaps"])
api_router.include_router(jobs.router, tags=["jobs"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])