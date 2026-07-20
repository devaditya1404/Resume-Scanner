import pytest
from httpx import AsyncClient
from fastapi import status

pytestmark = pytest.mark.asyncio


async def get_auth_headers(client: AsyncClient, email: str = "jobtest@example.com") -> dict:
    signup_data = {
        "email": email,
        "password": "jobtestpassword123",
        "full_name": "Job Recruiter",
        "company_name": "Recruiter Co"
    }
    await client.post("/api/v1/auth/signup", json=signup_data)
    
    login_data = {
        "email": email,
        "password": "jobtestpassword123"
    }
    login_response = await client.post("/api/v1/auth/login", json=login_data)
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def test_create_job_requirement(client: AsyncClient):
    headers = await get_auth_headers(client, "recruiter1@example.com")
    
    jd_payload = {
        "raw_text": "Need a Senior Java Developer with 5+ years of experience in Spring Boot and AWS in Tokyo. Notice period: 30 days."
    }
    
    response = await client.post("/api/v1/jobs", json=jd_payload, headers=headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    
    assert "id" in data
    assert data["title"] == "Java Developer"
    assert "Spring Boot" in data["mandatory_skills"]
    assert "AWS" in data["preferred_skills"]
    assert data["experience"] == "5+ Years"
    assert "Tokyo" in data["location"]


async def test_create_job_requirement_unauthorized(client: AsyncClient):
    jd_payload = {
        "raw_text": "Looking for React developer."
    }
    response = await client.post("/api/v1/jobs", json=jd_payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


async def test_list_job_requirements(client: AsyncClient):
    headers = await get_auth_headers(client, "recruiter2@example.com")
    
    jd_payload = {
        "raw_text": "Need a Python developer with 3+ years experience using FastAPI."
    }
    
    # Create one
    await client.post("/api/v1/jobs", json=jd_payload, headers=headers)
    
    # List them
    response = await client.get("/api/v1/jobs", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Python Developer"
    assert "FastAPI" in data[0]["mandatory_skills"]
