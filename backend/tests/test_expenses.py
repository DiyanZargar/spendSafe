import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_read_expense(client: AsyncClient, test_user_token: str):
    """Test creating an expense and retrieving it."""
    headers = {"Authorization": f"Bearer {test_user_token}"}
    create_payload = {
        "amount": 450.50,
        "currency": "USD",
        "category": "Food & Dining",
        "merchant": "Olive Garden",
        "description": "Dinner with team"
    }

    create_resp = await client.post("/api/v1/expenses", json=create_payload, headers=headers)
    assert create_resp.status_code == 201
    expense = create_resp.json()
    assert float(expense["amount"]) == 450.50
    assert expense["category"] == "Food & Dining"
    assert expense["merchant"] == "Olive Garden"
    expense_id = expense["id"]

    # Read back by ID
    get_resp = await client.get(f"/api/v1/expenses/{expense_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == expense_id


@pytest.mark.asyncio
async def test_update_and_delete_expense(client: AsyncClient, test_user_token: str):
    """Test updating and deleting an expense."""
    headers = {"Authorization": f"Bearer {test_user_token}"}
    create_resp = await client.post(
        "/api/v1/expenses",
        json={"amount": 100.0, "category": "Shopping", "merchant": "Bookstore"},
        headers=headers
    )
    expense_id = create_resp.json()["id"]

    # Update amount to 150.0
    update_resp = await client.patch(
        f"/api/v1/expenses/{expense_id}",
        json={"amount": 150.0},
        headers=headers
    )
    assert update_resp.status_code == 200
    assert float(update_resp.json()["amount"]) == 150.0

    # Delete
    del_resp = await client.delete(f"/api/v1/expenses/{expense_id}", headers=headers)
    assert del_resp.status_code == 204

    # Verify deleted
    get_resp = await client.get(f"/api/v1/expenses/{expense_id}", headers=headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_user_isolation(client: AsyncClient, test_user_token: str, second_user_token: str):
    """CRITICAL: Verify User B cannot access, modify, or delete User A's expense."""
    headers_user_a = {"Authorization": f"Bearer {test_user_token}"}
    headers_user_b = {"Authorization": f"Bearer {second_user_token}"}

    # User A creates private expense
    resp_a = await client.post(
        "/api/v1/expenses",
        json={"amount": 999.00, "category": "Health & Wellness", "merchant": "Private Clinic"},
        headers=headers_user_a
    )
    assert resp_a.status_code == 201
    expense_a_id = resp_a.json()["id"]

    # User B attempts to read User A's expense -> Must return 404 Not Found
    resp_b_get = await client.get(f"/api/v1/expenses/{expense_a_id}", headers=headers_user_b)
    assert resp_b_get.status_code == 404

    # User B attempts to update User A's expense -> Must return 404 Not Found
    resp_b_patch = await client.patch(
        f"/api/v1/expenses/{expense_a_id}",
        json={"amount": 10.0},
        headers=headers_user_b
    )
    assert resp_b_patch.status_code == 404

    # User B attempts to delete User A's expense -> Must return 404 Not Found
    resp_b_del = await client.delete(f"/api/v1/expenses/{expense_a_id}", headers=headers_user_b)
    assert resp_b_del.status_code == 404

    # User B listing expenses should NOT contain User A's expense
    resp_b_list = await client.get("/api/v1/expenses", headers=headers_user_b)
    assert resp_b_list.status_code == 200
    b_items = resp_b_list.json()["items"]
    assert not any(i["id"] == expense_a_id for i in b_items)
