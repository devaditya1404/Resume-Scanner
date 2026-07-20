import io
import zipfile
import pytest
from httpx import AsyncClient
from fastapi import status

pytestmark = pytest.mark.asyncio


def create_test_zip() -> bytes:
    """
    Dynamically constructs a mock ZIP archive containing 
    a PDF and DOCX resume block for testing.
    """
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as z:
        # Mock PDF
        z.writestr(
            "rahul_sharma.pdf",
            "Rahul Sharma\nEmail: rahul@example.com\nPhone: 9998887777\n"
            "Skills: Java, Spring Boot, Microservices, Hibernate, REST APIs, SQL.\n"
            "Experience: 6 years Java Developer at ICICI Bank.\n"
            "Location: Tokyo.\n"
            "Notice Period: 30 days."
        )
        # Mock DOCX
        z.writestr(
            "priya_verma.docx",
            "Priya Verma\nEmail: priya@example.com\nPhone: 8887776666\n"
            "Skills: ServiceNow, ITSM, ITOM, CMDB, Discovery, Flow Designer.\n"
            "Experience: 4 years ServiceNow developer with Incident Management.\n"
            "Location: Pune."
        )
    return zip_buffer.getvalue()


async def get_auth_headers(client: AsyncClient, email: str = "candtest@example.com") -> dict:
    signup_data = {
        "email": email,
        "password": "candpassword123",
        "full_name": "Vault Recruiter",
        "company_name": "Vault Co"
    }
    await client.post("/api/v1/auth/signup", json=signup_data)
    
    login_data = {
        "email": email,
        "password": "candpassword123"
    }
    login_response = await client.post("/api/v1/auth/login", json=login_data)
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def test_upload_zip_and_search_candidates(client: AsyncClient):
    headers = await get_auth_headers(client, "recruiter_vault@example.com")
    
    # 1. Ingest Mock ZIP file
    zip_data = create_test_zip()
    files = {"file": ("resumes.zip", zip_data, "application/zip")}
    
    upload_response = await client.post("/api/v1/candidates/upload-zip", files=files, headers=headers)
    assert upload_response.status_code == status.HTTP_201_CREATED
    upload_result = upload_response.json()
    
    assert upload_result["status"] == "COMPLETED"
    assert upload_result["processed"] == 2
    assert upload_result["duplicates_merged"] == 0

    # 2. Perform Semantic Search for Java
    search_payload = {"query": "Find Java Developers", "limit": 5}
    search_response = await client.post("/api/v1/candidates/search", json=search_payload, headers=headers)
    assert search_response.status_code == status.HTTP_200_OK
    search_results = search_response.json()
    
    # Assert Rahul Sharma is ranked high
    assert len(search_results) >= 1
    java_candidate = next((c for c in search_results if "Rahul Sharma" in c["name"]), None)
    assert java_candidate is not None
    assert "Java" in java_candidate["top_skills"]
    assert "Strong backend Java experience" in java_candidate["reason_why"]

    # 3. Perform Semantic Search for ServiceNow
    sn_payload = {"query": "ServiceNow Developers with ITSM", "limit": 5}
    sn_response = await client.post("/api/v1/candidates/search", json=sn_payload, headers=headers)
    assert sn_response.status_code == status.HTTP_200_OK
    sn_results = sn_response.json()
    
    # Assert Priya Verma is matched
    assert len(sn_results) >= 1
    sn_candidate = next((c for c in sn_results if "Priya Verma" in c["name"]), None)
    assert sn_candidate is not None
    assert "ServiceNow" in sn_candidate["top_skills"]
    assert "ITSM" in sn_candidate["top_skills"]
    assert "ServiceNow profile" in sn_candidate["reason_why"]
