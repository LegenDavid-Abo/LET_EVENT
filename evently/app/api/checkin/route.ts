import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { hashToken } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ result: "INVALID" });
    }

    const db = adminSupabase();
    const { data, error } = await db.rpc("consume_ticket", { p_hash: hashToken(token), p_staff: null });
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ result: "ERROR", error: error?.message }, { status: 500 });
  }
}
