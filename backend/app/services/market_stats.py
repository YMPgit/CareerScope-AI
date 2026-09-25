"""Deterministic, Python-computed job-market statistics.

The LLM (Groq) is intentionally used only to *interpret* these numbers,
never to calculate them.
"""
from __future__ import annotations

import re
from collections import Counter
from typing import Any

# --------------------------------------------------------------------- #
# Skill catalog: canonical name -> (category, [known aliases])
# --------------------------------------------------------------------- #
SKILLS: dict[str, tuple[str, list[str]]] = {
    # Data & Analytics
    "SQL": ("Data", ["ms sql", "sql server", "t-sql", "structured query language"]),
    "Python": ("Data", ["py3", "python3"]),
    "Excel": ("Tools", ["ms excel", "microsoft excel", "spreadsheet"]),
    "Power BI": ("Tools", ["powerbi", "power bi desktop"]),
    "Tableau": ("Tools", []),
    "Statistics": ("Data", ["statistical analysis", "statistics"]),
    "R": ("Data", ["r programming"]),
    "Pandas": ("Data", []),
    "NumPy": ("Data", []),
    "Matplotlib": ("Data", []),
    "Seaborn": ("Data", []),
    "Snowflake": ("Cloud", []),
    "Google Sheets": ("Tools", ["gsheets"]),
    "Looker": ("Tools", []),
    "ETL": ("Data", ["extract transform load"]),
    "Data Warehousing": ("Data", ["data warehouse", "dwh"]),
    "Data Modeling": ("Data", ["data model"]),
    "Data Visualization": ("Data", ["data viz", "visualization"]),
    "Data Cleaning": ("Data", ["data cleaning", "data cleansing"]),
    "A/B Testing": ("Data", ["ab testing", "a/b test"]),
    "Hypothesis Testing": ("Data", []),
    "Regression Analysis": ("Data", ["regression"]),
    "Time Series": ("Data", ["time series analysis"]),
    "Machine Learning": ("Data", ["ml", "machine learning"]),
    "Deep Learning": ("Data", ["deep learning", "dl"]),
    "NLP": ("Data", ["natural language processing"]),
    "Computer Vision": ("Data", ["cv", "computer vision"]),
    "TensorFlow": ("Data", []),
    "PyTorch": ("Data", []),
    "Keras": ("Data", []),
    "Scikit-learn": ("Data", ["sklearn", "scikit learn"]),
    "XGBoost": ("Data", []),
    "LLM": ("Data", ["large language model", "large language models"]),
    "GenAI": ("Data", ["generative ai", "genai"]),
    "Prompt Engineering": ("Data", []),
    "RAG": ("Data", ["retrieval augmented generation"]),
    "BERT": ("Data", []),
    "LangChain": ("Data", []),
    "LangGraph": ("Data", []),
    "OpenAI API": ("Data", ["openai", "chatgpt api"]),
    # Big data / Engineering
    "Spark": ("Data", ["apache spark", "pyspark"]),
    "Hadoop": ("Data", []),
    "Airflow": ("Data", ["apache airflow"]),
    "Kafka": ("Data", ["apache kafka"]),
    "Databricks": ("Cloud", []),
    "dbt": ("Data", []),
    "Kubernetes": ("Cloud", ["k8s"]),
    "Docker": ("Cloud", []),
    "AWS": ("Cloud", ["amazon web services"]),
    "Azure": ("Cloud", ["microsoft azure", "azure cloud"]),
    "GCP": ("Cloud", ["google cloud platform", "google cloud"]),
    "Terraform": ("Cloud", []),
    "Linux": ("Technical", []),
    "Git": ("Tools", ["github", "gitlab", "bitbucket"]),
    "CI/CD": ("Technical", ["cicd", "continuous integration", "continuous delivery"]),
    # Programming / Backend
    "Java": ("Technical", []),
    "JavaScript": ("Technical", ["js", "node.js", "nodejs"]),
    "TypeScript": ("Technical", ["ts"]),
    "Go": ("Technical", ["golang"]),
    "C++": ("Technical", []),
    "C#": ("Technical", ["csharp", ".net", "dotnet"]),
    "Scala": ("Technical", []),
    "Shell Scripting": ("Technical", ["bash", "shell scripting", "unix"]),
    "REST APIs": ("Technical", ["rest api", "restful", "api development"]),
    "GraphQL": ("Technical", []),
    "FastAPI": ("Technical", []),
    "Flask": ("Technical", []),
    "Django": ("Technical", []),
    "Node.js": ("Technical", []),
    "React": ("Technical", []),
    "PostgreSQL": ("Data", ["postgres"]),
    "MySQL": ("Data", []),
    "MongoDB": ("Data", []),
    "Redis": ("Data", []),
    "NoSQL": ("Data", []),
    "Airbyte": ("Data", []),
    # Domain & Soft skills
    "Communication": ("Soft skills", ["communication skills"]),
    "Stakeholder Management": ("Soft skills", ["stakeholder management", "stakeholders"]),
    "Business Acumen": ("Domain", ["business acumen", "business sense"]),
    "Data Storytelling": ("Domain", ["storytelling", "data storytelling"]),
    "Problem Solving": ("Soft skills", ["problem-solving", "problem solving"]),
    "Analytical Thinking": ("Soft skills", ["analytical skills", "analytical thinking"]),
    "Finance": ("Domain", ["financial analysis", "finance"]),
    "Marketing Analytics": ("Domain", ["marketing analytics"]),
    "CRM": ("Tools", ["salesforce", "hubspot"]),
    "Google Analytics": ("Tools", ["ga4", "google analytics"]),
    "Agile": ("Soft skills", ["agile methodology", "scrum"]),
    "Project Management": ("Soft skills", ["project management", "pm"]),
    "Leadership": ("Soft skills", []),
    "Teamwork": ("Soft skills", []),
    "Presentation": ("Soft skills", ["presentation skills"]),
}

ALIAS_TO_CANONICAL: dict[str, str] = {}
for canonical, (_cat, aliases) in SKILLS.items():
    ALIAS_TO_CANONICAL[canonical.lower()] = canonical
    for alias in aliases:
        ALIAS_TO_CANONICAL[alias.lower()] = canonical

INDUSTRY_HINTS: list[tuple[str, list[str]]] = [
    ("IT Services", ["technology", "software", "it services", "information technology"]),
    ("Banking & Finance", ["bank", "finance", "fintech", "insurance", "investment", "payments"]),
    ("E-commerce", ["e-commerce", "ecommerce", "retail", "amazon", "flipkart", "myntra"]),
    ("Healthcare", ["healthcare", "health", "hospital", "pharma", "biotech"]),
    ("Media & Entertainment", ["media", "entertainment", "streaming", "advertising"]),
    ("Consumer Goods", ["consumer", "fmcg", "d2c"]),
    ("Consulting", ["consulting", "advisory"]),
    ("Education", ["education", "edtech", "university", "learning"]),
    ("Manufacturing", ["manufacturing", "automotive", "industrial"]),
    ("Travel & Hospitality", ["travel", "hospitality", "airline", "hotel"]),
]

REMOTE_KEYWORDS = ["remote", "work from home", "wfh"]
HYBRID_KEYWORDS = ["hybrid"]
ONSITE_KEYWORDS = ["on-site", "onsite", "on site", "in-office", "in office"]


def normalize_skill(name: str) -> str | None:
    key = name.strip().lower()
    return ALIAS_TO_CANONICAL.get(key)


def skill_token_patterns(canonical: str) -> list[re.Pattern]:
    patterns = [re.escape(canonical)]
    _cat, aliases = SKILLS[canonical]
    patterns += [re.escape(a) for a in aliases]
    out = []
    for p in patterns:
        if " " in p:
            out.append(re.compile(rf"\b{p}\b", re.IGNORECASE))
        else:
            out.append(re.compile(rf"\b{p}s?\b", re.IGNORECASE))
    return out


def extract_skill_frequencies(jobs: list[dict]) -> list[dict[str, Any]]:
    """Count how many jobs mention each known skill."""
    n = len(jobs)
    counts: Counter[str] = Counter()
    for job in jobs:
        text = " ".join(filter(None, [job.get("title", ""), job.get("description", "")]))
        text_low = text.lower()
        for canonical, (_cat, aliases) in SKILLS.items():
            patterns = skill_token_patterns(canonical)
            if any(p.search(text_low) for p in patterns):
                counts[canonical] += 1

    ranked = counts.most_common()
    items = []
    for rank, (name, count) in enumerate(ranked, start=1):
        if count < max(1, n // 20) and len(items) >= 10:
            continue
        items.append({
            "name": name,
            "category": SKILLS[name][0],
            "market_frequency": count,
            "market_percentage": round((count / n) * 100, 1) if n else 0.0,
            "market_rank": rank,
        })
    return items


def classify_work_mode(job: dict) -> str | None:
    text = " ".join(filter(None, [job.get("employment_type", ""), job.get("description", "")])).lower()
    if any(k in text for k in REMOTE_KEYWORDS):
        return "Remote"
    if any(k in text for k in HYBRID_KEYWORDS):
        return "Hybrid"
    if any(k in text for k in ONSITE_KEYWORDS):
        return "On-site"
    return None


def _parse_salary(text: str | None) -> str | None:
    if not text:
        return None
    return text.strip()[:150]


def experience_bucket(text: str) -> str:
    m = re.search(r"(\d+)\s*[-to–]?\s*(\d+)?\s*\+?\s*(?:years|yrs|year)", text.lower())
    if not m:
        return "Not stated"
    years = int(m.group(1))
    if years <= 2:
        return "Entry (0-2 yrs)"
    if years <= 5:
        return "Mid (3-5 yrs)"
    return "Senior (6+ yrs)"


def compute_market_stats(jobs: list[dict]) -> dict[str, Any]:
    n = len(jobs)
    if not n:
        return {
            "total_jobs": 0,
            "top_skills": [],
            "employment_types": {},
            "remote": {"Remote": 0, "Hybrid": 0, "On-site": 0, "Unknown": 0},
            "locations": [],
            "top_companies": [],
            "top_industries": [],
            "experience_distribution": {},
            "avg_experience": None,
            "salary": None,
            "sources": [],
        }

    salaries: list[str] = []
    exp_years: list[int] = []
    exp_buckets: Counter[str] = Counter()
    work_modes: Counter[str] = Counter()
    locations: Counter[str] = Counter()
    companies: Counter[str] = Counter()
    industries: Counter[str] = Counter()

    for job in jobs:
        text = " ".join(filter(None, [job.get("title", ""), job.get("description", "")]))
        sal = job.get("salary") or _parse_salary(text)
        if sal:
            salaries.append(sal)

        bucket = experience_bucket(text)
        exp_buckets[bucket] += 1

        m = re.search(r"(\d+)\s*[-to–]?\s*(\d+)?\s*\+?\s*(?:years|yrs)", text.lower())
        if m:
            exp_years.append(int(m.group(1)))

        mode = classify_work_mode(job)
        work_modes[mode or "Unknown"] += 1

        loc = job.get("location")
        if loc:
            label = loc
            locations[label] += 1

        company = job.get("company")
        if company:
            companies[company] += 1

        low = text.lower()
        for industry, hints in INDUSTRY_HINTS:
            if any(h in low for h in hints):
                industries[industry] += 1
                break

    skill_items = extract_skill_frequencies(jobs)
    return {
        "total_jobs": n,
        "processed_jobs": n,
        "top_skills": skill_items,
        "employment_types": dict(exp_types_from_jobs(jobs)),
        "remote": dict(work_modes),
        "locations": [{"location": k, "count": v} for k, v in locations.most_common(8)],
        "top_companies": [{"name": k, "count": v} for k, v in companies.most_common(8)],
        "top_industries": [{"name": k, "count": v} for k, v in industries.most_common(5)],
        "experience_distribution": dict(exp_buckets),
        "avg_experience": round(sum(exp_years) / len(exp_years), 1) if exp_years else None,
        "salary": {"mentioned": len(salaries), "examples": salaries[:5]} if salaries else None,
        "sources": [],
    }


def exp_types_from_jobs(jobs: list[dict]) -> Counter:
    c: Counter[str] = Counter()
    for job in jobs:
        mode = classify_work_mode(job)
        if mode:
            c[mode] += 1
        elif job.get("employment_type"):
            c[str(job["employment_type"])] += 1
        else:
            c["Not specified"] += 1
    return c


def cover_ratio(user_has: bool) -> float:
    return 100.0 if user_has else 0.0