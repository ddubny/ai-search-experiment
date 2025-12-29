import { NextResponse } from "next/server";

console.log("SearchEngine API called:", q);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const start = searchParams.get("start") || "1"; // pagination (1, 11, 21...)

    if (!q) {
      return NextResponse.json({ error: "Missing q" }, { status: 400 });
    }

    const key = process.env.GOOGLE_CSE_API_KEY;
    const cx = process.env.GOOGLE_CSE_CX;

    if (!key || !cx) {
      return NextResponse.json(
        { error: "Server misconfigured: missing GOOGLE_CSE_API_KEY or GOOGLE_CSE_CX" },
        { status: 500 }
      );
    }

    // Custom Search JSON API: single method "list" (GET)
    // Requires 'cx' and 'q' at minimum.
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", key);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", q);
    url.searchParams.set("start", start);

    const res = await fetch(url.toString(), { method: "GET" });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: "Google CSE error", details: data },
        { status: res.status }
      );
    }

    // Normalize minimal fields to return to client
    const items = (data.items || []).map((it) => ({
      title: it.title,
      link: it.link,
      snippet: it.snippet,
      displayLink: it.displayLink,
    }));

    return NextResponse.json({
      query: q,
      start: Number(start),
      totalResults: Number(data.searchInformation?.totalResults || 0),
      items,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
