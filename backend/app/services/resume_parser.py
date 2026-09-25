"""Parse resume text into structured data using Groq, with anti-hallucination guards."""
from __future__ import annotations

from app.integrations.groq_client import GroqClient, GroqError
from app.services.market_stats import normalize_skill
from app.services.prompts import RESUME_PARSE_SYSTEM, resume_parse_user_prompt


def parse_resume(text: str) -> dict:
    client = GroqClient()
    prompt = resume_parse_user_prompt(text)
    raw = client.chat_json(RESUME_PARSE_SYSTEM, prompt)

    skills = _extract_list(raw.get("skills"))
    tools = _extract_list(raw.get("tools"))
    education = _extract_list(raw.get("education"))
    experience = _extract_list(raw.get("experience"))
    projects = _extract_list(raw.get("projects"))
    certifications = _extract_list(raw.get("certifications"))
    roles = _extract_list(raw.get("roles"))
    summary = (raw.get("summary") or "").strip() or None

    # ---- Anti-hallucination: every skill/tool must appear in the resume text.
    skills = [s for s in skills if _in_text(s, text)]
    tools = [t for t in tools if _in_text(t, text)]

    # ---- Normalize skills to canonical names where possible.
    normalized_skills: list[str] = []
    for s in skills:
        canonical = normalize_skill(s)
        if canonical:
            if canonical not in normalized_skills:
                normalized_skills.append(canonical)
        else:
            if s not in normalized_skills:
                normalized_skills.append(s)

    # ---- Validate free-text lines weakly: keep only when tokens appear in text.
    education = _filter_lines(education, text)
    experience = _filter_lines(experience, text)
    projects = _filter_lines(projects, text)
    certifications = _filter_lines(certifications, text)
    roles = _filter_lines(roles, text)

    return {
        "skills": normalized_skills,
        "tools": tools,
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": certifications,
        "roles": roles,
        "summary": summary,
    }


def _extract_list(value) -> list[str]:
    if not isinstance(value, list):
        return []
    out = []
    for item in value:
        if isinstance(item, str) and item.strip():
            out.append(item.strip())
    return out


def _in_text(name: str, text: str) -> bool:
    import re

    name = name.strip()
    if not name:
        return False
    needle = re.escape(name)
    pattern = rf"\b{needle}\b" if " " not in name else rf"{needle}"
    return bool(re.search(pattern, text, re.IGNORECASE))


def _filter_lines(lines: list[str], text: str) -> list[str]:
    good = []
    for line in lines:
        tokens = [t for t in line.split() if len(t) > 3]
        if not tokens:
            continue
        matched = sum(1 for token in tokens[:8] if _in_text(token, text))
        if matched >= max(2, min(3, len(tokens))):
            good.append(line)
    return good