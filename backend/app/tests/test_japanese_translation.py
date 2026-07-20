import pytest
from httpx import AsyncClient
from fastapi import status
from sqlalchemy import select

from app.core.resume_parser import (
    detect_language,
    translate_to_english,
    normalize_date,
    calculate_duration_months,
    format_duration_string,
    validate_candidate_data,
    extract_candidate_info,
    get_resume_experience_years
)
from app.models.candidate import ResumeHistory, Candidate
from app.tests.test_candidates import get_auth_headers

pytestmark = pytest.mark.asyncio


def test_language_detection():
    # 1. English Text
    eng_text = (
        "John Doe\nEmail: john@example.com\n"
        "Experience: 5 years as a backend engineer working with Python, Django, and PostgreSQL."
    )
    assert detect_language(eng_text) == "English"

    # 2. Japanese Text
    jp_text = (
        "履歴書\n氏名：田中太郎\n連絡先：tanaka@example.com\n"
        "職務経歴書：株式会社サンプルに入社。現在に至る。開発業務に従事。"
    )
    assert detect_language(jp_text) == "Japanese"

    # 3. Unsupported Language (e.g. Cyrillic)
    ru_text = (
        "Иван Иванов\nРезюме\n"
        "Опыт работы: 5 лет ведущим разработчиком программного обеспечения."
    )
    assert detect_language(ru_text) == "Unsupported"


def test_translation_and_mock_fallback():
    jp_text = (
        "履歴書\n氏名：田中太郎\n連絡先：tanaka@example.com\n"
        "会社名：株式会社サンプル"
    )
    # Since Ollama isn't running in tests, this will trigger the heuristic mock fallback
    res = translate_to_english(jp_text)
    assert res["original_language"] == "Japanese"
    assert res["translation_status"] == "completed"
    assert "Work History" in res["translated_text"] or "Name" in res["translated_text"] or "Company" in res["translated_text"]
    assert res["translation_model"] == "Heuristic Mock"


def test_date_normalization():
    assert normalize_date("Jan 2021") == "2021-01"
    assert normalize_date("2021/05") == "2021-05"
    assert normalize_date("Present") == "Present"
    assert normalize_date("Current") == "Present"
    assert normalize_date("2020") == "2020-01"
    assert normalize_date(None) is None


def test_duration_calculation_and_formatting():
    # Jan 2020 to Mar 2022 = 2 years 2 months = 26 months
    m1 = calculate_duration_months("Jan 2020", "Mar 2022")
    assert m1 == 26
    assert format_duration_string(m1) == "2 Years 2 Months"

    # Single month
    m2 = calculate_duration_months("Jan 2021", "Feb 2021")
    assert m2 == 1
    assert format_duration_string(m2) == "1 Month"


def test_candidate_data_validation():
    # 1. Technology as company error
    bad_data = {
        "name": "Jane Smith",
        "companies": ["Java"],  # Forbidden tech
        "experience": [
            {
                "company": "Spring Boot",  # Forbidden tech
                "start_date": "2020-01",
                "end_date": "2021-01"
            }
        ]
    }
    errors = validate_candidate_data(bad_data)
    assert any("Forbidden company name" in e for e in errors)

    # 2. Chronological error (start > end)
    chrono_bad = {
        "name": "Jane Smith",
        "experience": [
            {
                "company": "Google",
                "start_date": "2022-01",
                "end_date": "2021-01"  # end is before start
            }
        ]
    }
    errors = validate_candidate_data(chrono_bad)
    assert any("are not chronological" in e for e in errors)

    # 3. Multiple current employers error
    multi_current = {
        "name": "Jane Smith",
        "experience": [
            {
                "company": "Google",
                "start_date": "2020-01",
                "end_date": "Present",
                "is_current": True
            },
            {
                "company": "Amazon",
                "start_date": "2021-01",
                "end_date": "Present",
                "is_current": True
            }
        ]
    }
    errors = validate_candidate_data(multi_current)
    assert any("Multiple current employers" in e for e in errors)


def test_extraction_and_fallback():
    # Verify the fallback parser is chronological and enforces tech exclusions
    raw_resume = (
        "Jane Smith\nEmail: jane@example.com\nPhone: 1234567890\n"
        "Worked at Java developer at Spring Boot in Jan 2020 - Dec 2021.\n"
        "Worked at Google in Jan 2022 - Present.\n"
        "Skills: Java, React, SQL."
    )
    profile = extract_candidate_info(raw_resume)
    assert profile["name"] == "Jane Smith"
    assert profile["email"] == "jane@example.com"
    # Tech companies like 'Spring Boot' should be excluded from final companies list
    assert "Spring Boot" not in profile["companies"]
    assert "Java" not in profile["companies"]
    assert "Google" in profile["companies"]
    # Check chronological ordering (Google should be present)
    assert len(profile["experience"]) >= 1
    assert profile["experience"][0]["company"] == "Google"
    assert profile["experience_years"] >= 4


async def test_japanese_upload_pipeline(client: AsyncClient, db):
    headers = await get_auth_headers(client, "recruiter_jp@example.com")
    
    # 1. Mock Japanese Resume Text Ingestion
    jp_resume_raw = (
        "氏名：鈴木一郎\nEmail: ichiro@example.com\nPhone: 09012345678\n"
        "職務経歴書：\n"
        "会社名：株式会社ソニー (Sony) において 2021-01 から 2023-12 まで開発業務を担当。\n"
        "会社名：株式会社任天堂 (Nintendo) において 2024-01 から 現在 まで勤務。\n"
        "スキル：Java, Python, AWS"
    )
    
    files = {"file": ("suzuki_ichiro.pdf", jp_resume_raw, "application/pdf")}
    upload_response = await client.post("/api/v1/candidates/upload", files=files, headers=headers)
    assert upload_response.status_code == status.HTTP_201_CREATED
    upload_result = upload_response.json()
    assert upload_result["status"] == "COMPLETED"
    candidate_id = upload_result["candidate_id"]

    # 2. Assert translated English candidate details
    detail_response = await client.get(f"/api/v1/candidates/{candidate_id}", headers=headers)
    assert detail_response.status_code == status.HTTP_200_OK
    details = detail_response.json()
    
    # Candidate details should be in English (Name, Summary, Companies, etc.)
    assert details["name"] == "Suzuki Ichiro" or "鈴木一郎" in details["name"] or details["name"] != "Unknown Candidate"
    assert "Sony" in details["companies"] or "Nintendo" in details["companies"]
    assert "Java" in details["top_skills"]
    assert "Python" in details["top_skills"]
    assert details["experience_years"] >= 5

    # 3. Verify Database Translation columns
    # Re-fetch from db manually
    async with db as session:
        result = await session.execute(
            select(ResumeHistory)
            .where(ResumeHistory.candidate_id == details["id"])
            .order_by(ResumeHistory.version.desc())
        )
        history = result.scalars().first()
        assert history is not None
        assert history.original_language == "Japanese"
        assert "任天堂" in history.original_text
        assert history.translation_status == "completed"
        assert history.translation_model is not None
        
        # Verify the new name columns in DB
        assert history.full_name_original == "鈴木一郎"
        assert history.full_name_romanized == "Suzuki Ichiro"
        assert history.display_name == "Suzuki Ichiro"
        
        # Verify candidate object name fields
        db_cand_result = await session.execute(select(Candidate).where(Candidate.id == history.candidate_id))
        db_cand = db_cand_result.scalars().first()
        assert db_cand.name == "Suzuki Ichiro"
        assert db_cand.full_name_original == "鈴木一郎"
        assert db_cand.full_name_romanized == "Suzuki Ichiro"
        assert db_cand.display_name == "Suzuki Ichiro"


def test_name_extraction_rules():
    # 1. Test original Japanese name & English transliteration extraction
    jp_resume = (
        "氏名：山田 太郎\n"
        "Email: yamada@example.com\n"
        "Worked at Sony from 2020-01 to 2022-01"
    )
    profile = extract_candidate_info(jp_resume)
    assert profile["full_name_original"] == "山田 太郎"
    assert profile["full_name_romanized"] == "Yamada Taro" or "Yamada" in profile["full_name_romanized"]
    assert profile["display_name"] == profile["full_name_romanized"]

    # 2. Test name validation logic (cannot be a company, technology, skill, etc.)
    bad_name_resume = (
        "氏名：Sony\n"  # Invalid name (matches company)
        "氏名：Java\n"  # Invalid name (matches tech)
        "氏名：山田 太郎\n"  # Valid name
        "Worked at Sony in Jan 2020 - Dec 2021.\n"
        "Skills: Java, React."
    )
    profile_fixed = extract_candidate_info(bad_name_resume)
    assert profile_fixed["full_name_original"] == "山田 太郎"
    assert "Sony" not in profile_fixed["full_name_original"]
    assert "Java" not in profile_fixed["full_name_original"]


async def test_needs_review_on_name_not_found(client: AsyncClient, db):
    headers = await get_auth_headers(client, "recruiter_jp@example.com")
    
    # Ingest a Japanese resume where the candidate name cannot be found
    # (Since it only contains company, skills, and numbers, it fails all name strategies)
    nameless_jp_resume = (
        "職務経歴書：\n"
        "会社名：株式会社ソニー (Sony) において 2021-01 から 2023-12 まで勤務。\n"
        "スキル：Java, Python, AWS\n"
        "Email: missing@example.com\n"
        "Phone: 09000000000"
    )
    
    files = {"file": ("nameless.pdf", nameless_jp_resume, "application/pdf")}
    upload_response = await client.post("/api/v1/candidates/upload", files=files, headers=headers)
    assert upload_response.status_code == status.HTTP_200_OK or upload_response.status_code == status.HTTP_201_CREATED
    upload_result = upload_response.json()
    
    # Assert status is NEEDS_REVIEW and error reason is NAME_NOT_FOUND
    assert upload_result["status"] == "NEEDS_REVIEW"
    assert upload_result["error_reason"] == "NAME_NOT_FOUND"
    
    # Assert no candidate is created in DB
    from app.models.candidate import Upload
    async with db as session:
        result = await session.execute(
            select(Upload)
            .where(Upload.id == upload_result["upload_id"])
        )
        upload_entry = result.scalars().first()
        assert upload_entry is not None
        assert upload_entry.status == "NEEDS_REVIEW"
        assert upload_entry.extracted_text == nameless_jp_resume
        assert upload_entry.error_reason == "NAME_NOT_FOUND"
        
        # Verify no candidate with this email exists
        cand_res = await session.execute(
            select(Candidate).where(Candidate.email == "missing@example.com")
        )
        assert cand_res.scalars().first() is None


