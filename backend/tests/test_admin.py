"""Admin dashboard API tests for Mystery Box India."""
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

ADMIN_EMAIL = "admin@mysterybox.in"
ADMIN_PASSWORD = "MysteryAdmin@2026"

SEED_SLUGS = {"gamer", "tech", "gift", "beauty", "snack", "kids",
              "anime", "electronics", "mobile"}
DEFAULT_PRICES = {"starter": 299.0, "premium": 599.0, "mega": 999.0}


@pytest.fixture(scope="module")
def api():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.fail(f"admin login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def customer(api):
    email = f"cust_{uuid.uuid4().hex[:10]}@example.com"
    pw = "CustPass@123"
    r = api.post(f"{BASE_URL}/api/auth/register",
                 json={"name": "Cust", "email": email, "password": pw})
    assert r.status_code == 200, r.text
    d = r.json()
    return {"email": email, "password": pw, "token": d["token"], "id": d["id"]}


@pytest.fixture(scope="module")
def customer_headers(customer):
    return {"Authorization": f"Bearer {customer['token']}", "Content-Type": "application/json"}


# ---- Access control ----
class TestAccessControl:
    def test_stats_no_token_401(self, api):
        r = requests.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code == 401

    def test_orders_no_token_401(self):
        r = requests.get(f"{BASE_URL}/api/admin/orders")
        assert r.status_code == 401

    def test_stats_customer_403(self, api, customer_headers):
        r = api.get(f"{BASE_URL}/api/admin/stats", headers=customer_headers)
        assert r.status_code == 403

    def test_orders_customer_403(self, api, customer_headers):
        r = api.get(f"{BASE_URL}/api/admin/orders", headers=customer_headers)
        assert r.status_code == 403

    def test_create_box_customer_403(self, api, customer_headers):
        r = api.post(f"{BASE_URL}/api/admin/boxes", headers=customer_headers,
                     json={"slug": "hack", "name": "x", "prices": DEFAULT_PRICES})
        assert r.status_code == 403

    def test_delete_box_customer_403(self, api, customer_headers):
        r = api.delete(f"{BASE_URL}/api/admin/boxes/gamer", headers=customer_headers)
        assert r.status_code == 403


# ---- Stats + Orders ----
class TestStatsOrders:
    def test_stats_shape(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("orders", "revenue", "boxes", "customers"):
            assert k in d, f"missing {k}"
        assert isinstance(d["orders"], int)
        assert isinstance(d["boxes"], int) and d["boxes"] >= 9
        assert isinstance(d["customers"], int) and d["customers"] >= 1

    def test_orders_list(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/orders", headers=admin_headers)
        assert r.status_code == 200
        orders = r.json()
        assert isinstance(orders, list)
        for o in orders[:5]:
            assert "id" in o
            assert "user_email" in o
            assert "amount" in o
            assert "method" in o
            assert "status" in o


# ---- Box CRUD + price propagation ----
class TestBoxCRUDAndPricing:
    THROWAWAY_SLUG = f"throwaway-{uuid.uuid4().hex[:6]}"

    def test_create_box(self, api, admin_headers):
        payload = {
            "slug": self.THROWAWAY_SLUG, "name": "Throwaway Test Box",
            "emoji": "Gift", "tagline": "temp", "description": "test box",
            "color": "#FFEA00", "image": "", "prices": {"starter": 199, "premium": 399, "mega": 799},
        }
        r = api.post(f"{BASE_URL}/api/admin/boxes", headers=admin_headers, json=payload)
        assert r.status_code == 200, r.text
        # verify shows up in public GET /api/boxes
        r2 = api.get(f"{BASE_URL}/api/boxes")
        assert r2.status_code == 200
        slugs = {b["slug"] for b in r2.json()}
        assert self.THROWAWAY_SLUG in slugs

    def test_create_duplicate_slug_rejected(self, api, admin_headers):
        payload = {"slug": self.THROWAWAY_SLUG, "name": "dup",
                   "prices": DEFAULT_PRICES}
        r = api.post(f"{BASE_URL}/api/admin/boxes", headers=admin_headers, json=payload)
        assert r.status_code == 400

    def test_price_update_persists_and_propagates(self, api, admin_headers, customer_headers):
        # set tech premium to 649
        r = api.put(f"{BASE_URL}/api/admin/boxes/tech", headers=admin_headers,
                    json={"prices": {"starter": 299, "premium": 649, "mega": 999}})
        assert r.status_code == 200, r.text
        # public detail reflects it
        r2 = api.get(f"{BASE_URL}/api/boxes/tech")
        assert r2.status_code == 200
        assert r2.json()["tiers"]["premium"] == 649

        # checkout uses new price
        shipping = {"name": "Q", "phone": "9999999999", "address": "x",
                    "city": "Mumbai", "pincode": "400001"}
        r3 = api.post(f"{BASE_URL}/api/checkout", headers=customer_headers,
                      json={"items": [{"box_id": "tech", "tier": "premium", "quantity": 1}],
                            "method": "cod", "shipping": shipping})
        assert r3.status_code == 200, r3.text
        assert r3.json()["amount"] == 649.0

        # reset to defaults
        r4 = api.put(f"{BASE_URL}/api/admin/boxes/tech", headers=admin_headers,
                     json={"prices": DEFAULT_PRICES})
        assert r4.status_code == 200
        r5 = api.get(f"{BASE_URL}/api/boxes/tech")
        assert r5.json()["tiers"] == DEFAULT_PRICES

    def test_update_nonexistent_box_404(self, api, admin_headers):
        r = api.put(f"{BASE_URL}/api/admin/boxes/does-not-exist-xxx",
                    headers=admin_headers, json={"prices": DEFAULT_PRICES})
        assert r.status_code == 404

    def test_delete_throwaway_box(self, api, admin_headers):
        r = api.delete(f"{BASE_URL}/api/admin/boxes/{self.THROWAWAY_SLUG}",
                       headers=admin_headers)
        assert r.status_code == 200, r.text
        # verify gone
        r2 = api.get(f"{BASE_URL}/api/boxes/{self.THROWAWAY_SLUG}")
        assert r2.status_code == 404

    def test_delete_nonexistent_404(self, api, admin_headers):
        r = api.delete(f"{BASE_URL}/api/admin/boxes/does-not-exist-xxx",
                       headers=admin_headers)
        assert r.status_code == 404


# ---- Regression ----
class TestRegression:
    def test_nine_seed_boxes_intact(self, api):
        r = api.get(f"{BASE_URL}/api/boxes")
        assert r.status_code == 200
        slugs = {b["slug"] for b in r.json()}
        assert SEED_SLUGS.issubset(slugs), f"missing seeds: {SEED_SLUGS - slugs}"

    def test_seed_boxes_default_prices(self, api):
        r = api.get(f"{BASE_URL}/api/boxes")
        for b in r.json():
            if b["slug"] in SEED_SLUGS:
                assert b["tiers"] == DEFAULT_PRICES, f"{b['slug']} prices drifted: {b['tiers']}"

    def test_cod_checkout_still_works(self, api, customer_headers):
        shipping = {"name": "R", "phone": "9999999999", "address": "y",
                    "city": "Mumbai", "pincode": "400001"}
        r = api.post(f"{BASE_URL}/api/checkout", headers=customer_headers,
                     json={"items": [{"box_id": "gamer", "tier": "starter", "quantity": 2}],
                           "method": "cod", "shipping": shipping})
        assert r.status_code == 200
        assert r.json()["amount"] == 598.0
