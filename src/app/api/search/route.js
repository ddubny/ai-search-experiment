// src/app/api/search/route.js
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (!q) {
    return NextResponse.json({ error: "Missing query param: q" }, { status: 400 });
  }

  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  if (!key || !cx) {
    return NextResponse.json(
      { error: "Missing GOOGLE_API_KEY or GOOGLE_CX in server environment" },
      { status: 500 }
    );
  }

  const endpoint = new URL("https://www.googleapis.com/customsearch/v1");
  endpoint.searchParams.set("key", key);
  endpoint.searchParams.set("cx", cx);
  endpoint.searchParams.set("q", q);
  endpoint.searchParams.set("num", "5"); // 한 번에 5개 결과만
  endpoint.searchParams.set("safe", "active");

  try {
    const res = await fetch(endpoint.toString(), { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch from Google API", details: err.message },
      { status: 500 }
    );
  }
}
