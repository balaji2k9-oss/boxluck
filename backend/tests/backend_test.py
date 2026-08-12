"""Backend API tests for Mystery Box India."""
import os
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def new_user(api):
    email = f"test_{uuid.uuid4().hex[:10]}@example.com"
    password = "TestPass@123"
    r = api.post(f"{BASE_URL}/api/auth/register",
                 json={"name": "Test User", "email": email, "password": password})
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and data["email"] == email
    return {"email": email, "password": password, "token": data["token"], "id": data["id"]}


@pytest.fixture(scope="session")
def auth_headers(new_user):
    return {"Authorization": f"Bearer {new_user['token']}"}


# ---- Catalog ----
class TestCatalog:
    def test_list_boxes(self, api):
        r = api.get(f"{BASE_URL}/api/boxes")
        assert r.status_code == 200
        boxes = r.json()
        assert isinstance(boxes, list)
        assert len(boxes) == 9, f"expected 9 boxes, got {len(boxes)}"
        slugs = {b["slug"] for b in boxes}
        assert {"electronics", "mobile", "gamer", "tech", "gift", "beauty",
                "snack", "kids", "anime"}.issubset(slugs)
        for b in boxes:
            assert b["tiers"] == {"starter": 299.0, "premium": 599.0, "mega": 999.0}

    def test_get_box_electronics(self, api):
        r = api.get(f"{BASE_URL}/api/boxes/electronics")
        assert r.status_code == 200
        assert r.json()["slug"] == "electronics"

    def test_get_box_mobile(self, api):
        r = api.get(f"{BASE_URL}/api/boxes/mobile")
        assert r.status_code == 200
        assert r.json()["slug"] == "mobile"

    def test_get_box_404(self, api):
        r = api.get(f"{BASE_URL}/api/boxes/nonexistent")
        assert r.status_code == 404


# ---- Auth ----
class TestAuth:
    def test_register_and_login(self, api):
        email = f"test_{uuid.uuid4().hex[:10]}@example.com"
        r = api.post(f"{BASE_URL}/api/auth/register",
                     json={"name": "Foo", "email": email, "password": "Pass@1234"})
        assert r.status_code == 200
        assert r.json()["token"]

        # duplicate
        r2 = api.post(f"{BASE_URL}/api/auth/register",
                      json={"name": "Foo", "email": email, "password": "Pass@1234"})
        assert r2.status_code == 400

        # login
        r3 = api.post(f"{BASE_URL}/api/auth/login",
                      json={"email": email, "password": "Pass@1234"})
        assert r3.status_code == 200
        assert r3.json()["token"]

        # wrong pw
        r4 = api.post(f"{BASE_URL}/api/auth/login",
                      json={"email": email, "password": "wrong"})
        assert r4.status_code == 401

    def test_me_requires_auth(self):
        # fresh session (no cookie leaking from register/login)
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_with_bearer(self, api, new_user, auth_headers):
        r = api.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == new_user["email"]

    def test_admin_login(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": "admin@mysterybox.in", "password": "MysteryAdmin@2026"})
        assert r.status_code == 200, f"admin login failed: {r.text}"
        assert r.json()["role"] == "admin"


# ---- Checkout ----
class TestCheckout:
    def test_orders_requires_auth(self, api):
        r = api.get(f"{BASE_URL}/api/orders")
        assert r.status_code == 401

    def test_cod_checkout_end_to_end(self, api, auth_headers):
        shipping = {"name": "Test", "phone": "9999999999",
                    "address": "1 Test Rd", "city": "Mumbai", "pincode": "400001"}
        items = [{"box_id": "electronics", "tier": "premium", "quantity": 2},
                 {"box_id": "mobile", "tier": "starter", "quantity": 1}]
        r = api.post(f"{BASE_URL}/api/checkout", headers=auth_headers,
                     json={"items": items, "method": "cod", "shipping": shipping})
        assert r.status_code == 200, f"checkout failed: {r.text}"
        data = r.json()
        assert data["method"] == "cod"
        assert data["status"] == "placed"
        # 599*2 + 299 = 1497
        assert data["amount"] == 1497.0
        assert "order_id" in data

        # verify persisted
        r2 = api.get(f"{BASE_URL}/api/orders", headers=auth_headers)
        assert r2.status_code == 200
        orders = r2.json()
        assert any(o["id"] == data["order_id"] for o in orders)
        placed = next(o for o in orders if o["id"] == data["order_id"])
        assert placed["amount"] == 1497.0
        assert placed["status"] == "placed"
        assert placed["payment_status"] == "cod"
        assert placed["method"] == "cod"
        assert len(placed["items"]) == 2

    def test_stripe_checkout_returns_url(self, api, auth_headers):
        shipping = {"name": "Test", "phone": "9999999999",
                    "address": "1 Test Rd", "city": "Mumbai", "pincode": "400001"}
        r = api.post(f"{BASE_URL}/api/checkout", headers=auth_headers,
                     json={"items": [{"box_id": "gamer", "tier": "mega", "quantity": 1}],
                           "method": "stripe", "shipping": shipping,
                           "origin_url": BASE_URL})
        assert r.status_code == 200, f"stripe checkout failed: {r.text}"
        data = r.json()
        assert data["method"] == "stripe"
        assert "checkout_url" in data
        assert "checkout.stripe.com" in data["checkout_url"]
        assert data["amount"] == 999.0

    def test_empty_cart_rejected(self, api, auth_headers):
        r = api.post(f"{BASE_URL}/api/checkout", headers=auth_headers,
                     json={"items": [], "method": "cod", "shipping": {}})
        assert r.status_code == 400

    def test_invalid_tier_rejected(self, api, auth_headers):
        r = api.post(f"{BASE_URL}/api/checkout", headers=auth_headers,
                     json={"items": [{"box_id": "gamer", "tier": "ultra", "quantity": 1}],
                           "method": "cod", "shipping": {}})
        assert r.status_code in (400, 422)


# ---- Subscribe ----
class TestSubscribe:
    def test_cod_subscription(self, api, auth_headers):
        shipping = {"name": "Test", "phone": "9999999999",
                    "address": "1 Test Rd", "city": "Mumbai", "pincode": "400001"}
        r = api.post(f"{BASE_URL}/api/subscribe", headers=auth_headers,
                     json={"plan": "premium", "method": "cod", "shipping": shipping})
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "active"
        assert data["amount"] == 599.0

        # visible in orders
        r2 = api.get(f"{BASE_URL}/api/orders", headers=auth_headers)
        assert r2.status_code == 200
        assert any(o["id"] == data["order_id"] and o.get("type") == "subscription"
                   and o["status"] == "active" for o in r2.json())

    def test_invalid_plan(self, api, auth_headers):
        r = api.post(f"{BASE_URL}/api/subscribe", headers=auth_headers,
                     json={"plan": "invalid", "method": "cod", "shipping": {}})
        assert r.status_code == 400


# ---- Orders scoping ----
class TestOrdersScope:
    def test_orders_scoped_to_user(self, api, auth_headers, new_user):
        r = api.get(f"{BASE_URL}/api/orders", headers=auth_headers)
        assert r.status_code == 200
        for o in r.json():
            assert o["user_email"] == new_user["email"]
