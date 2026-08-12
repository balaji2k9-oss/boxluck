# Mystery Box India — PRD

## Original Problem Statement
Viral e-commerce concept "Mystery Box India" (tagline "Every Box. A New Surprise."). Affordable mystery boxes with products worth up to 2× the price. Categories, tiered pricing (₹299/₹599/₹999), subscriptions, Golden Box hype, UGC/unboxing, launch offers.

## User Choices
- Full e-commerce store + user accounts + monthly subscriptions + marketing landing page
- Payments: Stripe card (INR) + Cash on Delivery
- Auth: yes (email/password)
- Design: fun, colorful, playful (neo-brutalist pop)

## Architecture
- Frontend: React 19 + Tailwind, framer-motion, lenis smooth scroll, react-fast-marquee, phosphor icons. Award-worthy neo-brutalist landing.
- Backend: FastAPI + MongoDB (motor). JWT Bearer-token auth (token in localStorage 'mb_token', Authorization header via axios interceptor).
- Payments: Stripe (emergentintegrations, shared test key sk_test_emergent, INR) + COD. Stripe claimable sandbox unsupported for India, so shared test key is used.

## User Personas
- Gen-Z / young Indian shoppers who love surprise unboxings and shareable content.
- Gift buyers and monthly subscribers.

## Core Requirements (static)
- Browse 9 box categories, pick tier, cart, checkout (COD/card), accounts, order history, monthly subscriptions, Golden Box + UGC hype sections.

## Implemented (2026-08)
- Landing page: kinetic hero (staggered reveal, parallax, mouse-tilt), marquees, category bento grid, pricing tiers, numbered manifesto, subscribe section, Golden Box countdown, UGC social proof, footer.
- Auth: register/login/logout/me (JWT Bearer). Admin seeded.
- Catalog: 9 boxes (Gamer, Tech, Gift, Beauty, Snack, Kids, Anime & Movie, Electronics, Mobile Accessories) with 3 tiers each; server-side pricing.
- Cart (localStorage), checkout with server-validated totals, COD + Stripe card (INR) with payment status polling + webhook.
- Monthly subscriptions (COD/card). Account order history.
- Verified end-to-end by testing agent: 100% backend (16/16 pytest) + 100% frontend flows.

## Backlog
- P1: Admin dashboard to manage boxes & view all orders.
- P1: Referral discounts + "first 100 bonus gift" tracking.
- P2: Server-side shipping validation (Pydantic model); tighten CORS to explicit origin; Stripe key fail-fast.
- P2: Seasonal/limited-edition boxes, unboxing video upload + branded hashtag gallery.

## Test Credentials
See /app/memory/test_credentials.md
