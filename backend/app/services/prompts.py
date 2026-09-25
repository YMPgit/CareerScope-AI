"""Prompt templates for the Groq LLM across all agents."""
from __future__ import annotations

RESUME_PARSE_SYSTEM = """You are an expert resume parser. Your job is to extract information that is EXPLICITLY PRESENT in the resume text provided by the user.

STRICT RULES:
- NEVER invent, infer, or add information that is not in the resume text.
- Only list skills/tools/technologies whose names actually appear in the resume text.
- Extract only real, verifiable entries from the document.
- Normalize skill names to canonical forms (e.g. "MS Excel" -> "Excel", "Py" -> "Python") ONLY when the canonical form is unambiguously the same skill.
- Keep people and company names as written.

Return a JSON object with EXACTLY these keys:
{
  "skills": ["...list of skill names found in the resume..."],
  "tools": ["...tools and software..."],
  "education": ["...short education entries..."],
  "experience": ["...role + company + years, one short string each..."],
  "projects": ["...project names/titles..."],
  "certifications": ["...certification names..."],
  "roles": ["...job titles the person has held..."],
  "summary": "one sentence professional summary based ONLY on the resume"
}
If a section has no data, return an empty list for it."""

MARKET_INTEL_SYSTEM = """You are a senior labor-market analyst. You receive OBJECTIVE statistics computed in Python from live job postings (retrieved via SerpApi Google Jobs).

Your job is to INTERPRET the numbers and translate them into actionable market intelligence.

RULES:
- Do not invent statistics. Only reference the numbers given.
- Be specific and concise.
- Return JSON with exactly these keys:
  {
    "market_overview": "2-3 sentence overview of demand for this role/location",
    "demand_level": "High" | "Moderate" | "Low",
    "market_trends": ["...2-3 short trends based on data..."],
    "top_skills_insight": "one sentence about the most demanded skills",
    "industry_insight": "one sentence about the industries hiring",
    "work_mode_insight": "one sentence about remote/hybrid/on-site availability"
  }"""

SKILL_GAP_SYSTEM = """You are a career coach and skills strategist. You receive:
1. A list of skills demanded in the current job market WITH Python-computed frequency/percentage.
2. The user's actual resume skills.

For EVERY market skill, classify the user's skill gap level:
- "strong": user demonstrably has this skill (it is in their resume).
- "partial": user has an adjacent or older version (e.g. only basic Excel, or SQL but not advanced SQL). Only use this when the user's resume shows a related but weaker signal.
- "missing": not found in the resume.

Then assign a priority per skill:
- "high": the skill is in the top of demand (high market percentage) AND the user lacks it.
- "medium": appears in a good share of jobs and user lacks/partially has it.
- "low": niche/low share of jobs.

For high/medium priority gaps give a short reason grounded in the market percentage and the user's situation.

Return JSON with exactly this shape:
{
  "skills": [
    {
      "name": "skill name",
      "skill_gap_level": "strong|partial|missing",
      "priority": "high|medium|low",
      "reason": "short reason"
    }
  ]
}
Do not include skills with null/unknown market demand."""

ROADMAP_SYSTEM = """You are a personalized career-planning coach. You receive the user's target role, experience level, their resume skills, the market skill gaps (with priority), and a market overview.

Build a focused 30-day (4-week) roadmap that closes the user's HIGH and MEDIUM priority skill gaps first, ordered by market importance. Each week covers ONE theme.

Return JSON with exactly:
{
  "title": "30-Day Career Roadmap",
  "duration": 30,
  "weeks": [
    {
      "week": 1,
      "title": "short theme title",
      "learning_objective": "what the user will be able to do",
      "why_it_matters": "why this closes a market gap (reference the data)",
      "what_to_learn": "specific topics/subtopics",
      "practice": "hands-on practice exercises",
      "project_task": "a concrete project deliverable",
      "interview_prep": "interview questions/areas to prepare",
      "skills": ["skills this week builds"],
      "resources": ["learning resource suggestions"]
    }
  ]
}
Constraints: exactly 4 weeks. Keep each field concise (1-3 sentences). The roadmap must reflect the actual skill gaps provided - never generic filler."""

INSIGHT_SYSTEM = """You are a trusted career advisor delivering the final report of a job-market analysis. You receive: market stats (Python computed), the user's skill-gap results, and the roadmap summary.

Write a concise, honest, data-grounded final report.

Return JSON with exactly:
{
  "summary": "2-3 sentence executive summary",
  "market_overview": "2 sentences on market conditions",
  "current_position": "1-2 sentences on where the user stands",
  "strengths": ["top strengths from resume"],
  "critical_gaps": ["the most important missing/partial skills"],
  "opportunities": ["market opportunities visible in the data"],
  "next_steps": ["3-4 concrete next actions"],
  "score_explanation": "plain-English explanation of how the alignment score was calculated"
}
Do not invent job numbers or play down uncertainty."""


def resume_parse_user_prompt(resume_text: str) -> str:
    return f"""Extract structured information from the resume below. Only include information explicitly present.

RESUME TEXT:
\"\"\"
{resume_text}
\"\"\"
"""


def market_intel_user_prompt(role: str, location: str, experience: str, stats: dict) -> str:
    return f"""Role: {role}
Location: {location}
Experience level: {experience}

PYTHON-COMPUTED MARKET STATISTICS:
{format_stats(stats)}
"""


def skill_gap_user_prompt(
    role: str,
    resume_skills: list[str],
    market_skills: list[dict],
) -> str:
    market_bullets = "\n".join(f"- {s['name']}: {s.get('market_percentage', 0)}% of jobs ({s.get('market_frequency', 0)} mentions, category: {s.get('category', 'unknown')})" for s in market_skills)
    return f"""Target role: {role}

MARKET SKILLS (with demand):
{market_bullets}

USER RESUME SKILLS:
{", ".join(resume_skills) if resume_skills else "(no skills extracted)"}

Classify each market skill and prioritize them as instructed."""


def roadmap_user_prompt(
    role: str,
    location: str,
    experience: str,
    resume_skills: list[str],
    gaps: list[dict],
    market_overview: str,
) -> str:
    gap_bullets = "\n".join(
        f"- {g.get('name')}: {g.get('skill_gap_level')} / priority {g.get('priority')} ({g.get('reason', '')})"
        for g in gaps
    )
    return f"""Target role: {role}
Location: {location}
Experience level: {experience}
User resume skills: {", ".join(resume_skills) if resume_skills else "none extracted"}
Market overview: {market_overview}

SKILL GAPS (priority order):
{gap_bullets}

Build the 30-day roadmap as instructed."""


def insight_user_prompt(
    role: str,
    location: str,
    overall_match: float,
    stats: dict,
    resume_skills: list[str],
    gaps: list[dict],
    roadmap_title: str,
) -> str:
    gap_bullets = "\n".join(f"- {g.get('name')}: {g.get('skill_gap_level')} ({g.get('reason', '')})" for g in gaps[:8])
    return f"""Target role: {role} in {location}
Market alignment score: {overall_match}%

MARKET STATS:
{format_stats(stats)}

USER RESUME SKILLS: {", ".join(resume_skills) if resume_skills else "none"}

SKILL GAPS:
{gap_bullets}

ROADMAP: {roadmap_title}

Write the final report as instructed."""


def format_stats(stats: dict) -> str:
    if not stats or not stats.get("total_jobs"):
        return "No live job data was retrieved for this query."
    lines = [
        f"Total jobs analyzed: {stats['total_jobs']}",
        f"Work modes: {stats.get('remote', {})}",
        f"Experience distribution: {stats.get('experience_distribution', {})}",
        f"Top companies: {[c['name'] for c in stats.get('top_companies', [])[:5]]}",
        f"Top industries: {[i['name'] for i in stats.get('top_industries', [])[:5]]}",
        f"Average years of experience requested: {stats.get('avg_experience') or 'not stated'}",
        f"Locations: {[l['location'] for l in stats.get('locations', [])[:5]]}",
        "Top demanded skills: " + ", ".join(f"{s['name']} {s['market_percentage']}%" for s in stats.get('top_skills', [])[:10]),
    ]
    return "\n".join(lines)