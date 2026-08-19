"""
Drop-in replacement for `emergentintegrations.payments.stripe.checkout`.

The original app used a private package (`emergentintegrations`) that only
exists inside the Emergent platform and is not published on PyPI, so it
cannot be installed on Render/Railway/Fly/etc. This module re-implements the
same three classes (StripeCheckout, CheckoutSessionRequest,
CheckoutStatusResponse) using the official public `stripe` SDK, so the rest
of server.py doesn't need to change beyond the import line.
"""

import asyncio
from dataclasses import dataclass, field
from typing import Optional, Dict

import stripe


@dataclass
class CheckoutSessionRequest:
    amount: float
    currency: str
    success_url: str
    cancel_url: str
    metadata: Optional[Dict[str, str]] = field(default_factory=dict)


@dataclass
class CheckoutSessionResponse:
    session_id: str
    url: str


@dataclass
class CheckoutStatusResponse:
    session_id: str
    status: str
    payment_status: str
    amount_total: Optional[int] = None
    currency: Optional[str] = None
    metadata: Optional[Dict[str, str]] = field(default_factory=dict)


class StripeCheckout:
    """Thin async wrapper around the official stripe-python SDK."""

    def __init__(self, api_key: str, webhook_url: str):
        self.api_key = api_key
        self.webhook_url = webhook_url

    async def create_checkout_session(self, req: CheckoutSessionRequest) -> CheckoutSessionResponse:
        def _create():
            session = stripe.checkout.Session.create(
                api_key=self.api_key,
                mode="payment",
                line_items=[{
                    "price_data": {
                        "currency": req.currency,
                        "product_data": {"name": "Order"},
                        # Stripe wants the smallest currency unit (e.g. paise for INR)
                        "unit_amount": int(round(req.amount * 100)),
                    },
                    "quantity": 1,
                }],
                success_url=req.success_url,
                cancel_url=req.cancel_url,
                metadata=req.metadata or {},
            )
            return session

        session = await asyncio.to_thread(_create)
        return CheckoutSessionResponse(session_id=session.id, url=session.url)

    async def get_checkout_status(self, session_id: str) -> CheckoutStatusResponse:
        def _retrieve():
            return stripe.checkout.Session.retrieve(session_id, api_key=self.api_key)

        session = await asyncio.to_thread(_retrieve)
        return CheckoutStatusResponse(
            session_id=session.id,
            status=session.status,
            payment_status=session.payment_status,
            amount_total=session.amount_total,
            currency=session.currency,
            metadata=dict(session.metadata) if session.metadata else {},
        )

    async def handle_webhook(self, body: bytes, signature: str) -> CheckoutStatusResponse:
        import os

        webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

        def _construct():
            if webhook_secret:
                return stripe.Webhook.construct_event(body, signature, webhook_secret)
            # Fallback (not recommended for production): parse without verifying.
            import json
            return stripe.Event.construct_from(json.loads(body), self.api_key)

        event = await asyncio.to_thread(_construct)
        data_obj = event["data"]["object"]
        session_id = data_obj.get("id", "")
        payment_status = data_obj.get("payment_status", "unpaid")
        status = data_obj.get("status", "open")
        return CheckoutStatusResponse(
            session_id=session_id,
            status=status,
            payment_status=payment_status,
            amount_total=data_obj.get("amount_total"),
            currency=data_obj.get("currency"),
            metadata=dict(data_obj.get("metadata") or {}),
        )
