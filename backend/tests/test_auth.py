import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration endpoint."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "Password123!",
            "full_name": "Charlie Brown",
            "currency": "USD",
            "timezone": "UTC"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "Charlie Brown"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test that registering duplicate email fails with 400."""
    user_payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "full_name": "Dave Miller",
    }
    resp1 = await client.post("/api/v1/auth/register", json=user_payload)
    assert resp1.status_code == 201

    resp2 = await client.post("/api/v1/auth/register", json=user_payload)
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test login with valid credentials."""
    # First register
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "login_test@example.com",
            "password": "CorrectPassword123!",
            "full_name": "Login Tester",
        }
    )
    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "login_test@example.com",
            "password": "CorrectPassword123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "login_test@example.com"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    """Test login with invalid password."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "testuser@example.com",
            "password": "WrongPassword!"
        }
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient, test_user_token: str):
    """Test retrieving user profile with valid Bearer token."""
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {test_user_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["full_name"] == "Alice Smith"


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    """Test accessing protected route without Bearer token."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
