from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated

import jwt
import bcrypt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, BeforeValidator, ConfigDict

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest, CheckoutStatusResponse,
)

# ---------------- DB ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mysterybox")

# ---------------- Helpers ----------------
PyObjectId = Annotated[str, BeforeValidator(str)]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(key="access_token", value=token, httponly=True,
                        secure=True, samesite="none", max_age=604800, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------------- Models ----------------
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class CartItem(BaseModel):
    box_id: str
    tier: str  # starter | premium | mega
    quantity: int = Field(ge=1, le=20)


class CheckoutInput(BaseModel):
    items: List[CartItem]
    method: str  # cod | stripe
    origin_url: Optional[str] = None
    shipping: dict


class SubscribeInput(BaseModel):
    plan: str  # starter | premium | mega
    method: str
    origin_url: Optional[str] = None
    shipping: dict


TIER_PRICES = {"starter": 299.0, "premium": 599.0, "mega": 999.0}
TIER_LABELS = {"starter": "₹299 Starter", "premium": "₹599 Premium", "mega": "₹999 Mega"}

# ---------------- Catalog seed ----------------
BOXES_SEED = [
    {"slug": "gamer", "name": "Gamer Mystery Box", "emoji": "GameController",
     "tagline": "Loot drops for the grind.",
     "description": "Controllers grips, RGB gear, collectible figures, gaming merch and surprise peripherals worth up to 2x the box price.",
     "color": "#8A2BE2",
     "image": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"slug": "tech", "name": "Tech Mystery Box", "emoji": "Cpu",
     "tagline": "Gadgets you didn't know you needed.",
     "description": "Earbuds, cables, chargers, smart accessories and gadget surprises curated for the tech obsessed.",
     "color": "#00F0FF",
     "image": "https://images.unsplash.com/photo-1498049794561-7780e7231661?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"slug": "gift", "name": "Gift Mystery Box", "emoji": "Gift",
     "tagline": "The perfect surprise, sorted.",
     "description": "A hand-picked mix of premium lifestyle goodies. Perfect for gifting or treating yourself.",
     "color": "#FF007F",
     "image": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"slug": "beauty", "name": "Beauty Mystery Box", "emoji": "Sparkle",
     "tagline": "Glow up, unboxed.",
     "description": "Skincare, makeup, and self-care surprises from loved brands, packed to overdeliver.",
     "color": "#FF69B4",
     "image": "https://images.unsplash.com/photo-1600428877878-1a0fd85beda8?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"slug": "snack", "name": "Snack Mystery Box", "emoji": "Cookie",
     "tagline": "Munchies from around the world.",
     "description": "Rare candies, chocolates, chips and drinks. A flavour adventure in every box.",
     "color": "#FFEA00",
     "image": "https://images.unsplash.com/photo-1666274694243-9997eb427237?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"slug": "kids", "name": "Kids Mystery Box", "emoji": "TeddyBear",
     "tagline": "Playtime, but make it a surprise.",
     "description": "Toys, games, and fun surprises that keep the little ones curious and delighted.",
     "color": "#39FF14",
     "image": "https://images.unsplash.com/photo-1545558014-8692077e9b5c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"slug": "anime", "name": "Anime & Movie Mystery Box", "emoji": "FilmSlate",
     "tagline": "Fandom fuel, sealed tight.",
     "description": "Figures, posters, keychains and collectibles from your favourite anime and movies.",
     "color": "#FF4500",
     "image": "https://images.unsplash.com/photo-1714537097791-be0ba0473b9c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"},
    {"slug": "electronics", "name": "Electronics Mystery Box", "emoji": "Lightning",
     "tagline": "Power-packed gadget drops.",
     "description": "Speakers, power banks, smart gadgets and electronic surprises curated to overdeliver on value.",
     "color": "#00BFFF",
     "image": "https://images.pexels.com/photos/12743408/pexels-photo-12743408.jpeg?auto=compress&cs=tinysrgb&w=1200"},
    {"slug": "mobile", "name": "Mobile Accessories Mystery Box", "emoji": "DeviceMobile",
     "tagline": "Level up your phone game.",
     "description": "Cases, chargers, cables, pop-sockets, earbuds and mobile add-ons worth up to 2x the price.",
     "color": "#FF6B00",
     "image": "https://images.pexels.com/photos/25839639/pexels-photo-25839639.jpeg?auto=compress&cs=tinysrgb&w=1200"},
]


async def seed_data():
    await db.users.create_index("email", unique=True)
    for b in BOXES_SEED:
        await db.boxes.update_one({"slug": b["slug"]}, {"$set": b}, upsert=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@mysterybox.in")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})
    logger.info("Seed complete")


@app.on_event("startup")
async def on_startup():
    await seed_data()


# ---------------- Auth Routes ----------------
@api_router.post("/auth/register")
async def register(payload: RegisterInput, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {"email": email, "password_hash": hash_password(payload.password),
           "name": payload.name, "role": "customer",
           "created_at": datetime.now(timezone.utc).isoformat()}
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    token = create_access_token(uid, email)
    set_auth_cookie(response, token)
    return {"id": uid, "email": email, "name": payload.name, "role": "customer", "token": token}


@api_router.post("/auth/login")
async def login(payload: LoginInput, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    uid = str(user["_id"])
    token = create_access_token(uid, email)
    set_auth_cookie(response, token)
    return {"id": uid, "email": email, "name": user["name"], "role": user.get("role", "customer"), "token": token}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------------- Catalog Routes ----------------
@api_router.get("/boxes")
async def list_boxes():
    boxes = await db.boxes.find({}, {"_id": 0}).to_list(100)
    for b in boxes:
        b["tiers"] = TIER_PRICES
    return boxes


@api_router.get("/boxes/{slug}")
async def get_box(slug: str):
    box = await db.boxes.find_one({"slug": slug}, {"_id": 0})
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    box["tiers"] = TIER_PRICES
    return box


def compute_total(items: List[CartItem]) -> float:
    total = 0.0
    for it in items:
        if it.tier not in TIER_PRICES:
            raise HTTPException(status_code=400, detail=f"Invalid tier: {it.tier}")
        total += TIER_PRICES[it.tier] * it.quantity
    return round(total, 2)


async def build_order_items(items: List[CartItem]) -> List[dict]:
    out = []
    for it in items:
        box = await db.boxes.find_one({"slug": it.box_id}, {"_id": 0})
        if not box:
            raise HTTPException(status_code=400, detail=f"Invalid box: {it.box_id}")
        out.append({"box_id": it.box_id, "name": box["name"], "tier": it.tier,
                    "tier_label": TIER_LABELS[it.tier], "quantity": it.quantity,
                    "price": TIER_PRICES[it.tier]})
    return out


# ---------------- Checkout Routes ----------------
@api_router.post("/checkout")
async def checkout(payload: CheckoutInput, request: Request, user: dict = Depends(get_current_user)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    total = compute_total(payload.items)
    order_items = await build_order_items(payload.items)
    now = datetime.now(timezone.utc).isoformat()
    order = {
        "user_id": user["id"], "user_email": user["email"], "type": "order",
        "items": order_items, "amount": total, "currency": "inr",
        "shipping": payload.shipping, "method": payload.method,
        "status": "placed" if payload.method == "cod" else "pending_payment",
        "payment_status": "cod" if payload.method == "cod" else "pending",
        "created_at": now,
    }

    if payload.method == "cod":
        res = await db.orders.insert_one(order)
        return {"order_id": str(res.inserted_id), "method": "cod", "status": "placed", "amount": total}

    # Stripe card payment
    origin = payload.origin_url or os.environ.get("FRONTEND_URL")
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/payment/cancel"
    sess_req = CheckoutSessionRequest(
        amount=total, currency="inr", success_url=success_url, cancel_url=cancel_url,
        metadata={"user_id": user["id"], "type": "order"})
    session = await stripe_checkout.create_checkout_session(sess_req)
    order["session_id"] = session.session_id
    res = await db.orders.insert_one(order)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id, "order_id": str(res.inserted_id),
        "user_id": user["id"], "amount": total, "currency": "inr",
        "status": "initiated", "payment_status": "pending", "created_at": now, "updated_at": now})
    return {"order_id": str(res.inserted_id), "method": "stripe",
            "checkout_url": session.url, "session_id": session.session_id, "amount": total}


@api_router.post("/subscribe")
async def subscribe(payload: SubscribeInput, request: Request, user: dict = Depends(get_current_user)):
    if payload.plan not in TIER_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")
    amount = TIER_PRICES[payload.plan]
    now = datetime.now(timezone.utc).isoformat()
    order = {
        "user_id": user["id"], "user_email": user["email"], "type": "subscription",
        "items": [{"name": f"Monthly {payload.plan.title()} Box", "tier": payload.plan,
                   "tier_label": TIER_LABELS[payload.plan], "quantity": 1, "price": amount}],
        "amount": amount, "currency": "inr", "plan": payload.plan,
        "shipping": payload.shipping, "method": payload.method,
        "status": "active" if payload.method == "cod" else "pending_payment",
        "payment_status": "cod" if payload.method == "cod" else "pending",
        "created_at": now,
    }
    if payload.method == "cod":
        res = await db.orders.insert_one(order)
        return {"order_id": str(res.inserted_id), "method": "cod", "status": "active", "amount": amount}

    origin = payload.origin_url or os.environ.get("FRONTEND_URL")
    host_url = str(request.base_url)
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}api/webhook/stripe")
    sess_req = CheckoutSessionRequest(
        amount=amount, currency="inr",
        success_url=f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin}/payment/cancel",
        metadata={"user_id": user["id"], "type": "subscription"})
    session = await stripe_checkout.create_checkout_session(sess_req)
    order["session_id"] = session.session_id
    res = await db.orders.insert_one(order)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id, "order_id": str(res.inserted_id),
        "user_id": user["id"], "amount": amount, "currency": "inr",
        "status": "initiated", "payment_status": "pending", "created_at": now, "updated_at": now})
    return {"order_id": str(res.inserted_id), "method": "stripe",
            "checkout_url": session.url, "session_id": session.session_id, "amount": amount}


@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request):
    record = await db.payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            host_url = str(request.base_url)
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}api/webhook/stripe")
            status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
            if status.payment_status == "paid":
                await mark_paid(session_id)
                record = await db.payment_transactions.find_one({"session_id": session_id})
        except Exception as e:
            logger.error(f"status poll error: {e}")
    return {"session_id": record["session_id"], "status": record["status"],
            "payment_status": record["payment_status"]}


async def mark_paid(session_id: str):
    now = datetime.now(timezone.utc).isoformat()
    tx = await db.payment_transactions.find_one_and_update(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"status": "completed", "payment_status": "paid", "updated_at": now}})
    if tx:
        await db.orders.update_one(
            {"_id": ObjectId(tx["order_id"])},
            {"$set": {"payment_status": "paid",
                      "status": "active" if tx.get("type") == "subscription" else "placed"}})


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        host_url = str(request.base_url)
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}api/webhook/stripe")
        resp = await stripe_checkout.handle_webhook(body, sig)
        if resp.payment_status == "paid":
            await mark_paid(resp.session_id)
    except Exception as e:
        logger.error(f"webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook error")
    return {"status": "ok"}


# ---------------- Orders ----------------
@api_router.get("/orders")
async def my_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    for o in orders:
        o["id"] = str(o["_id"])
        o.pop("_id", None)
    return orders


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
