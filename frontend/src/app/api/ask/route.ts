import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const res = await fetch(`${BACKEND_BASE}/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const contentType = res.headers.get("content-type") || "application/json";
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: res.status,
      headers: { "content-type": contentType },
    });
  } catch (err: unknown) {
    const e = err as unknown as { message?: unknown } | null;
    const message =
      e && typeof e.message === "string" ? e.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
