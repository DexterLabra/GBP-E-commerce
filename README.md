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

## Supabase order backend

Orders use the Next.js API and Supabase when the server environment variables are configured. The local browser cache remains as an offline development fallback.

1. Create a Supabase project.
2. Open Supabase SQL Editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local` and fill in the project URL and service role key.
4. Restart the Next.js server.

The service role key must stay server-side and must never be prefixed with `NEXT_PUBLIC_`. The API routes are `/api/orders` and `/api/orders/[id]`. Add authentication, authorization, rate limiting, and email notifications before accepting public production traffic. Do not store card numbers or CVV.

## Product images

The starter uses remote Unsplash imagery as temporary visual placeholders. Replace these URLs with the actual GBP product image paths/assets before publishing.

## Brand

GBP Home Art & Decors
Luxury • Elegant • Premium
