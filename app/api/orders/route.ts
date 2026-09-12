import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabaseServer";
import { Order } from "../../../data/orderStore";
import { isAdminRequest } from "../../../lib/adminAuth";

export const dynamic = "force-dynamic";

function toOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id), createdAt: String(row.created_at),
    customer: row.customer as Order["customer"], payment: String(row.payment), reference: String(row.reference || ""),
    notes: String(row.notes || ""), items: row.items as Order["items"], total: Number(row.total),
    status: row.status as Order["status"], trackingNumber: row.tracking_number ? String(row.tracking_number) : undefined
  };
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ configured: false, orders: [] });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const email = url.searchParams.get("email");
  if (!isAdminRequest(request) && !id && !email) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (id) query = query.eq("id", id);
  if (email) query = query.eq("customer->>email", email);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ configured: true, orders: (data || []).map(toOrder) });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ configured: false, message: "Supabase is not configured." }, { status: 503 });
  const order = await request.json() as Order;
  if (!order.id || !order.customer?.email || !order.items?.length || order.total < 0) return NextResponse.json({ error: "Invalid order payload." }, { status: 400 });
  const { data, error } = await supabase.from("orders").insert({
    id: order.id, created_at: order.createdAt, customer: order.customer, payment: order.payment,
    reference: order.reference, notes: order.notes, items: order.items, total: order.total,
    status: order.status, tracking_number: order.trackingNumber || null
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: toOrder(data) }, { status: 201 });
}
