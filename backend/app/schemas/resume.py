from typing import Any, Optional

from pydantic import BaseModel, Field


class ParsedResume(BaseModel):
    skills: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    education: list[str] = Field(default_factory=list)
    experience: list[str] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    roles: list[str] = Field(default_factory=list)
    summary: Optional[str] = None


class ResumeOut(BaseModel):
    id: int
    file_name: str
    parsed_data: Optional[dict[str, Any]] = None
    raw_preview: Optional[str] = None
    created_at: Optional[str] = None


class ResumeListOut(BaseModel):
    id: int
    file_name: str
    parsed_count: Optional[int] = None
    created_at: Optional[str] = None