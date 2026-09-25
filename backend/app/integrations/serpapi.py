"""Direct HTTP client for the SerpApi JSON API (Google Jobs / Search / News)."""
from __future__ import annotations

import re
from datetime import datetime

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("serpapi")

DEFAULT_NUM = 20


class SerpApiError(Exception):
    """Raised when SerpApi cannot be reached or returns an error."""


class SerpApiClient:
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: float = 40.0,
    ) -> None:
        self.api_key = api_key or settings.SERPAPI_API_KEY
        self.base_url = base_url or settings.SERPAPI_BASE_URL
        self.timeout = timeout

    # ------------------------------------------------------------------ #
    def _get(self, params: dict) -> dict:
        if not self.api_key:
            raise SerpApiError(
                "SerpApi API key is not configured. Add SERPAPI_API_KEY to your .env file."
            )
        params = {**params, "api_key": self.api_key}
        try:
            resp = httpx.get(self.base_url + "/search", params=params, timeout=self.timeout)
            resp.raise_for_status()
        except httpx.TimeoutException:
            raise SerpApiError("SerpApi request timed out. Please try again later.")
        except httpx.HTTPStatusError as exc:
            raise SerpApiError(_friendly_http_error(exc))
        except httpx.HTTPError as exc:
            logger.warning("SerpApi network error: %s", exc)
            raise SerpApiError("Could not reach SerpApi. Check your internet connection.")

        try:
            data = resp.json()
        except ValueError:
            raise SerpApiError("SerpApi returned an unreadable response.")

        if data.get("error"):
            raise SerpApiError(f"SerpApi error: {data['error']}")
        return data

    # ------------------------------------------------------------------ #
    def google_jobs(self, query: str, location: str | None = None, num: int = DEFAULT_NUM) -> list[dict]:
        params: dict = {
            "engine": "google_jobs",
            "q": query,
            "num": min(num, 50),
            "hl": "en",
        }
        if location:
            params["location"] = location
        data = self._get(params)

        raw_jobs = data.get("jobs_results") or []
        jobs = [normalize_job(j) for j in raw_jobs]
        jobs = dedupe_jobs(jobs)
        logger.info("SerpApi google_jobs returned %d jobs (after dedupe)", len(jobs))
        return jobs

    def web_search(self, query: str, num: int = 10) -> list[dict]:
        params = {
            "engine": "google",
            "q": query,
            "num": min(num, 20),
            "hl": "en",
        }
        data = self._get(params)
        results = []
        for r in (data.get("organic_results") or []):
            results.append({
                "title": r.get("title"),
                "link": r.get("link"),
                "snippet": r.get("snippet"),
                "source": "Google Search",
            })
        return results

    def news(self, query: str, num: int = 8) -> list[dict]:
        params = {
            "engine": "google_news",
            "q": query,
            "num": min(num, 15),
            "hl": "en",
            "gl": "us",
        }
        data = self._get(params)
        results = []
        for r in (data.get("news_results") or []):
            source = (r.get("source") or {})
            results.append({
                "title": r.get("title"),
                "link": r.get("link"),
                "snippet": r.get("snippet") or r.get("description"),
                "source": source.get("name") or "Google News",
                "date": r.get("date"),
            })
        return results


# ---------------------------------------------------------------------- #
def _friendly_http_error(exc: httpx.HTTPStatusError) -> str:
    status = exc.response.status_code
    if status == 401 or status == 403:
        return "SerpApi rejected the API key. Check SERPAPI_API_KEY in your .env file."
    if status == 429:
        return "SerpApi rate limit reached (429). Wait a moment and try again."
    body = ""
    try:
        body = exc.response.json().get("error", "")
    except Exception:  # noqa: BLE001
        body = exc.response.text[:200]
    return f"SerpApi responded with status {status}: {body}"


def _to_datetime(repr_str: str | None) -> datetime | None:
    if not repr_str:
        return None
    repr_str = repr_str.strip()
    if repr_str.lower().startswith("posted") or repr_str.lower().startswith("just"):
        return None
    try:
        return datetime.strptime(repr_str, "%Y-%m-%d")
    except (ValueError, TypeError):
        return None


def apply_url_from_raw(raw: dict) -> str | None:
    """Resolve the best direct application link straight from cached SerpApi data."""
    if not isinstance(raw, dict):
        return None
    link, _ = _resolve_apply(raw)
    return link


def apply_platform_from_raw(raw: dict) -> str | None:
    """Name of the platform the job post lives on (from cached SerpApi data)."""
    if not isinstance(raw, dict):
        return None
    _, label = _resolve_apply(raw)
    return label


def normalize_job(raw: dict) -> dict:
    title = (raw.get("title") or "").strip()
    company = (raw.get("company_name") or raw.get("company") or "").strip()
    location = (raw.get("location") or "").strip()
    description = (raw.get("description") or "").strip()

    # Prefer the direct application link; fall back to the Google Jobs page.
    url = _pick_apply_link(raw, company)
    if not url:
        url = raw.get("job_google_url") or raw.get("share_link")
    if not url:
        rel = raw.get("related_links") or []
        for item in rel:
            if isinstance(item, dict) and item.get("link"):
                url = item.get("link")
                break

    posted_text = None
    posted_at = None
    employment_type = None
    ext = raw.get("detected_extensions") or {}
    if ext.get("posted_at"):
        posted_text = str(ext.get("posted_at"))
    if ext.get("schedule_type"):
        employment_type = str(ext.get("schedule_type"))

    if not employment_type:
        exts = raw.get("extensions") or []
        if exts:
            employment_type = exts[0]

    return {
        "external_job_id": raw.get("job_id") or raw.get("job_listing_id"),
        "title": title,
        "company": company,
        "location": location,
        "description": description,
        "salary": raw.get("salary"),
        "employment_type": employment_type,
        "experience": _extract_experience(description),
        "url": url,
        "posted_text": posted_text,
        "posted_at": posted_at,
        "raw_data": raw,
    }


def _pick_apply_link(raw: dict, company: str = "") -> str | None:
    link, _ = _resolve_apply(raw, company)
    return link


def _resolve_apply(raw: dict, company: str = "") -> tuple[str | None, str | None]:
    """Best direct application link + the platform label for a raw job result.

    Priority:
      1. the platform the job was sourced from (`via` - e.g. Shine, BeBee,
         LinkedIn) so the post opens where it lives;
      2. the company's own portal (matching name or domain);
      3. the first non-Google application partner.
    """
    company = company or raw.get("company_name") or raw.get("company") or ""
    via = raw.get("via") or ""
    options = raw.get("apply_options") or []
    candidates = []
    for option in options:
        if not isinstance(option, dict):
            continue
        link = option.get("link") if isinstance(option.get("link"), str) else None
        if not link or _is_google_link(link):
            continue
        candidates.append((link, str(option.get("title") or "").strip()))
    if not candidates:
        return None, None

    via_norm = _norm_text(via)
    company_norm = _norm_text(company)
    via_tokens = _company_tokens(via)
    company_tokens = _company_tokens(company)

    def matches(link: str, tokens: list[str], norm: str) -> bool:
        base = _hostname(link)
        if norm and _norm_text(base) == norm:
            return True
        if tokens and any(tok in base for tok in tokens):
            return True
        if norm:
            toks = [t for t in norm.split() if t]
            return bool(toks) and any(t in base for t in toks)
        return False

    # 1. The platform the job was sourced from (e.g. Shine, BeBee, LinkedIn).
    for link, title in candidates:
        if _norm_text(title) == via_norm or matches(link, via_tokens, via_norm):
            return link, title or via or None

    # 2. The company's own portal (matching name or domain).
    for link, title in candidates:
        if _norm_text(title) == company_norm or matches(link, company_tokens, company_norm):
            return link, title or company or None

    # 3. Explicit "company site" style partner.
    for link, title in candidates:
        if any(kw in title.lower() for kw in ("company site", "company website", "official")):
            return link, title or None

    return candidates[0][0], candidates[0][1] or None


def _norm_text(value: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", value.lower()).strip()


def _hostname(url: str) -> str:
    host = re.sub(r"^[a-z]+://", "", url.lower(), flags=re.IGNORECASE).split("/")[0]
    return re.sub(r"^www\.", "", host).split(":")[0]


_COMPANY_STOPWORDS = {
    "the", "of", "and", "at", "for", "in", "co", "corp", "corporation", "inc",
    "llc", "ltd", "limited", "pvt", "private", "group", "international", "india",
    "technologies", "technology", "systems", "system", "solutions", "services",
    "service", "company", "companies", "labs", "global", "llp", "plc", "bank",
}


def _company_tokens(company: str) -> list[str]:
    words = re.findall(r"[a-z0-9]+", company.lower())
    return [w for w in words if len(w) >= 3 and w not in _COMPANY_STOPWORDS]


def _is_google_link(url: str) -> bool:
    host = re.sub(r"^[a-z]+://", "", url.lower(), flags=re.IGNORECASE).split("/")[0]
    host = re.sub(r"^www\.", "", host)
    return host == "google.com" or host.endswith(".google.com")


def _extract_experience(description: str) -> str | None:
    import re

    if not description:
        return None
    for pattern in [
        r"(\d+)\s*[-–]\s*(\d+)\s*\+?\s*years?",
        r"(\d+)\s*\+?\s*years?",
        r"(\d+)\s*to\s*(\d+)\s*years?",
        r"(\d+)\s*-\s*(\d+)\s*yrs",
    ]:
        m = re.search(pattern, description, re.IGNORECASE)
        if m:
            return m.group(0).strip()
    return None


def dedupe_jobs(jobs: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for job in jobs:
        key = (job.get("title", "").lower(), job.get("company", "").lower())
        if key in seen:
            continue
        seen.add(key)
        out.append(job)
    return out