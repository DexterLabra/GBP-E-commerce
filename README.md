# GBP Home Art & Decors — Premium E-commerce Starter

A modern Next.js + TypeScript starter for GBP Home Art & Decors using the Midnight Blue `#191970`, Antique Gold `#C69842`, cream, ivory, and beige visual identity.

## Included

- Premium responsive storefront
- Hero, collections, featured products, About, delivery, testimonials, footer
- Product search and category filtering
- Product detail modal
- Variant selection
- Functional localStorage cart
- Quantity controls
- Checkout/customer information form
- Payment method + reference fields
- Persistent order ID generation
- Customer order confirmation
- Inquiry action placeholder
- Connected admin order-management dashboard at `/admin`
- Customer shipment tracking portal at `/shipment`
- Inventory/order workflow starter
- Responsive mobile navigation
- No raw card/CVV collection

## Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Admin demo:
`http://localhost:3000/admin`

Admin access:
`/`, `/admin`, and `/admin/inventory` require the signed admin session. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` in `.env.local` for local development and in Vercel Project Settings for deployment. The session cookie is HTTP-only and expires after eight hours.

## Supabase order backend

The order API and operations portal use the same Supabase project when the server environment variables are configured. Operations modules share a versioned snapshot in `operations_state`; the portal polls for updates and keeps a local browser cache for offline recovery.

1. Create a Supabase project.
2. Open Supabase SQL Editor and run `supabase/schema.sql`. Run it again on existing projects to create the `operations_state` table and enable its Realtime publication entry.
3. Copy `.env.example` to `.env.local` and fill in the project URL and service role key.
4. Restart the Next.js server.

The service role key must stay server-side and must never be prefixed with `NEXT_PUBLIC_`. The API routes are `/api/orders`, `/api/orders/[id]`, and the admin-session-protected `/api/operations`. Never store card numbers or CVV.

The role selector scopes the operations sidebar, but the current sign-in system still uses one administrator credential. Before assigning staff individual production accounts, integrate an identity provider such as Supabase Auth and enforce each user's role on the server; client-side module visibility alone is not an authorization boundary.

## Product images

The starter uses remote Unsplash imagery as temporary visual placeholders. Replace these URLs with the actual GBP product image paths/assets before publishing.

## Brand

GBP Home Art & Decors
Luxury • Elegant • Premium
