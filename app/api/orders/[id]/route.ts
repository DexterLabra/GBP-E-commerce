import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabaseServer";
import { Order } from "../../../../data/orderStore";
import { isAdminRequest } from "../../../../lib/adminAuth";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ configured: false, message: "Supabase is not configured." }, { status: 503 });
  const changes = await request.json() as Partial<Pick<Order, "status" | "trackingNumber">>;
  const update = { ...(changes.status ? { status: changes.status } : {}), ...(changes.trackingNumber ? { tracking_number: changes.trackingNumber } : {}) };
  const { data, error } = await supabase.from("orders").update(update).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
