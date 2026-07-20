import re
import httpx
from typing import Dict, List, Any


async def parse_job_description(raw_text: str) -> Dict[str, Any]:
    """
    Parses a raw job description using Ollama if running, 
    otherwise falls back to a regex/keyword-based heuristic parser.
    """
    # 1. Try Ollama (Qwen) first
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            prompt = (
                f"Extract the following properties from this Job Description as JSON. "
                f"Properties: title, experience (e.g. '5+ Years'), mandatory_skills (list), "
                f"preferred_skills (list), industry (e.g. 'Banking Domain'), location (e.g. 'Tokyo'), "
                f"language (e.g. 'N2 Japanese'), salary (e.g. 'under 10M'), joining_timeline (e.g. 'within 30 Days').\n\n"
                f"Job Description: {raw_text}"
            )
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "qwen",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
            )
            if response.status_code == 200:
                result = response.json()
                # Parse response text to json
                import json
                parsed_data = json.loads(result.get("response", "{}"))
                # Verify key fields
                if "title" in parsed_data:
                    parsed_data["hidden_skills"] = ["Multi-threading", "SQL optimization"]
                    return parsed_data
    except Exception:
        # Silently fall back to heuristics
        pass

    # 2. Heuristic Heuristic Heuristic Parser
    # Extract Title
    title = "Software Engineer"
    title_matches = [
        (r"(java\s+developer|backend\s+architect|spring\s+developer)", "Java Developer"),
        (r"(frontend|react|typescript\s+developer)", "Frontend Engineer"),
        (r"(python|django|fastapi\s+developer)", "Python Developer"),
        (r"(aws|devops|cloud\s+engineer)", "DevOps Engineer"),
    ]
    for pattern, name in title_matches:
        if re.search(pattern, raw_text, re.IGNORECASE):
            title = name
            break

    # Extract Experience
    exp = "2+ Years"
    exp_match = re.search(r"(\d+)\+?\s*(years?|yrs?)", raw_text, re.IGNORECASE)
    if exp_match:
        exp = f"{exp_match.group(1)}+ Years"

    # Extract Skills
    tech_pool = [
        "Spring Boot", "Spring", "Java", "React", "TypeScript", "Python", "FastAPI",
        "AWS", "Docker", "Kubernetes", "PostgreSQL", "MySQL", "MongoDB", "Redis",
        "Microservices", "REST API", "GraphQL", "Next.js", "Tailwind CSS"
    ]
    mandatory_skills = []
    for tech in tech_pool:
        if re.search(r"\b" + re.escape(tech) + r"\b", raw_text, re.IGNORECASE):
            mandatory_skills.append(tech)

    # Defaults if no matches
    if not mandatory_skills:
        mandatory_skills = ["Software Engineering"]

    preferred_skills = []
    if "AWS" in raw_text or "Docker" in raw_text:
        preferred_skills = ["AWS", "Docker"]
    else:
        preferred_skills = ["CI/CD"]

    # Extract Industry
    industry = "General Tech"
    if re.search(r"(banking|finance|fintech|bank)", raw_text, re.IGNORECASE):
        industry = "Banking Domain"
    elif re.search(r"(ecommerce|retail|shop)", raw_text, re.IGNORECASE):
        industry = "E-Commerce"

    # Extract Location
    location = "Remote"
    loc_match = re.search(r"\b(tokyo|pune|mumbai|bangalore|london|new\s+york|delhi)\b", raw_text, re.IGNORECASE)
    if loc_match:
        location = loc_match.group(1).capitalize()
        if re.search(r"\b(remote|hybrid)\b", raw_text, re.IGNORECASE):
            location = f"{location} (Hybrid)"

    # Extract Language
    language = "English"
    lang_match = re.search(r"\b(N1|N2|N3|N4|N5|japanese|english|german|spanish)\b", raw_text, re.IGNORECASE)
    if lang_match:
        val = lang_match.group(1)
        if val.upper() in ["N1", "N2", "N3", "N4", "N5"]:
            language = f"{val.upper()} Japanese"
        else:
            language = val.capitalize()

    # Extract Salary
    salary = "Open"
    sal_match = re.search(r"(under|below|max|up\s+to)?\s*(\d+)\s*(m|lpa|k|million|lakhs?)", raw_text, re.IGNORECASE)
    if sal_match:
        prefix = sal_match.group(1) or "Up to"
        salary = f"{prefix.capitalize()} {sal_match.group(2)}{sal_match.group(3).upper()}"

    # Extract Joining
    joining = "Immediate"
    join_match = re.search(r"(30\s*days|immediate|immediate\s+joiner|1\s*month|notice\s+period)", raw_text, re.IGNORECASE)
    if join_match:
        val = join_match.group(1)
        if "30" in val:
            joining = "Within 30 Days"
        elif "immediate" in val:
            joining = "Immediate Joiner"
        else:
            joining = "Notice Period Dependent"

    return {
        "title": title,
        "experience": exp,
        "mandatory_skills": mandatory_skills,
        "preferred_skills": preferred_skills,
        "industry": industry,
        "location": location,
        "language": language,
        "salary": salary,
        "joining_timeline": joining,
        "hidden_skills": ["Performance tuning", "Agile methodology"]
    }
