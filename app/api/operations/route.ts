import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabaseServer";
import { isAdminRequest } from "../../../lib/adminAuth";
import { isOperationsSnapshot } from "../../../data/operationsStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("operations_state")
    .select("version, state, updated_at")
    .eq("key", "gbp")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    configured: true,
    version: data?.version ?? 0,
    state: data?.state ?? null,
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Admin authentication required." }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { version?: unknown; state?: unknown } | null;
  if (!body || !isOperationsSnapshot(body.state) || !Number.isInteger(body.version) || Number(body.version) < 0) {
    return NextResponse.json({ error: "A valid operations snapshot and version are required." }, { status: 400 });
  }
  if (JSON.stringify(body.state).length > 1_000_000) {
    return NextResponse.json({ error: "Operations snapshot exceeds the 1 MB limit." }, { status: 413 });
  }

  const expectedVersion = Number(body.version);
  const nextVersion = expectedVersion + 1;
  const values = { state: body.state, version: nextVersion, updated_at: new Date().toISOString() };

  if (expectedVersion === 0) {
    const { data, error } = await supabase
      .from("operations_state")
      .insert({ key: "gbp", ...values })
      .select("version, state, updated_at")
      .single();

    if (error?.code === "23505") {
      return NextResponse.json({ error: "A newer operations snapshot already exists. Refresh and retry." }, { status: 409 });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ configured: true, ...data });
  }

  const { data, error } = await supabase
    .from("operations_state")
    .update(values)
    .eq("key", "gbp")
    .eq("version", expectedVersion)
    .select("version, state, updated_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "A newer operations snapshot already exists. Refresh and retry." }, { status: 409 });
  return NextResponse.json({ configured: true, ...data });
}