create table if not exists public.orders (
  id text primary key,
  created_at timestamptz not null default now(),
  customer jsonb not null,
  payment text not null,
  reference text not null default '',
  notes text not null default '',
  items jsonb not null,
  total numeric(12, 2) not null check (total >= 0),
  status text not null default 'Order Received' check (status in (
    'Order Received', 'Payment Verification', 'Confirmed', 'Preparing',
    'Ready for Shipment', 'Shipped', 'Delivered'
  )),
  tracking_number text
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

alter table public.orders enable row level security;

-- The Next.js API uses SUPABASE_SERVICE_ROLE_KEY on the server. Do not expose
-- that key in browser code. Add authenticated customer/admin policies later
-- when user accounts are enabled.
