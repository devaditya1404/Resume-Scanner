import pytest
from httpx import AsyncClient
from fastapi import status

pytestmark = pytest.mark.asyncio


async def test_signup_user(client: AsyncClient):
    signup_data = {
        "email": "testuser@example.com",
        "password": "strongpassword123",
        "full_name": "Test User",
        "company_name": "Test Company"
    }
    response = await client.post("/api/v1/auth/signup", json=signup_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == signup_data["email"]
    assert data["full_name"] == signup_data["full_name"]
    assert "id" in data
    assert data["is_active"] is True
    assert data["is_verified"] is False


async def test_signup_duplicate_email(client: AsyncClient):
    signup_data = {
        "email": "testuser@example.com",
        "password": "strongpassword123",
        "full_name": "Test User",
        "company_name": "Test Company"
    }
    # First signup
    await client.post("/api/v1/auth/signup", json=signup_data)
    
    # Second signup with same email
    response = await client.post("/api/v1/auth/signup", json=signup_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"]


async def test_login_json(client: AsyncClient):
    signup_data = {
        "email": "testuser@example.com",
        "password": "strongpassword123",
        "full_name": "Test User",
        "company_name": "Test Company"
    }
    await client.post("/api/v1/auth/signup", json=signup_data)

    # Login via JSON
    login_data = {
        "email": "testuser@example.com",
        "password": "strongpassword123"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == signup_data["email"]


async def test_login_form_data(client: AsyncClient):
    signup_data = {
        "email": "testuser@example.com",
        "password": "strongpassword123",
        "full_name": "Test User",
        "company_name": "Test Company"
    }
    await client.post("/api/v1/auth/signup", json=signup_data)

    # Login via Form Data (OAuth2 standard)
    login_data = {
        "username": "testuser@example.com",
        "password": "strongpassword123"
    }
    response = await client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data


async def test_login_incorrect_password(client: AsyncClient):
    signup_data = {
        "email": "testuser@example.com",
        "password": "strongpassword123",
        "full_name": "Test User",
        "company_name": "Test Company"
    }
    await client.post("/api/v1/auth/signup", json=signup_data)

    # Incorrect login
    login_data = {
        "email": "testuser@example.com",
        "password": "wrongpassword"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Incorrect email or password" in response.json()["detail"]


async def test_read_user_me(client: AsyncClient):
    signup_data = {
        "email": "testuser@example.com",
        "password": "strongpassword123",
        "full_name": "Test User",
        "company_name": "Test Company"
    }
    await client.post("/api/v1/auth/signup", json=signup_data)

    # Login to get token
    login_data = {
        "email": "testuser@example.com",
        "password": "strongpassword123"
    }
    login_response = await client.post("/api/v1/auth/login", json=login_data)
    token = login_response.json()["access_token"]

    # Get user profile
    headers = {"Authorization": f"Bearer {token}"}
    me_response = await client.get("/api/v1/auth/me", headers=headers)
    assert me_response.status_code == status.HTTP_200_OK
    me_data = me_response.json()
    assert me_data["email"] == signup_data["email"]


async def test_read_user_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
