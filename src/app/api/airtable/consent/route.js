import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const { participant_id, name } = body;

    if (!participant_id) {
      throw new Error("participant_id is required");
    }

    // 현재 Airtable consent 테이블에 정확히 맞는 fields
    const fields = {
      participant_id,
      consent: "yes",                // Single select 값
      name: name || "",              // 빈 값 허용
      date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/consent`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [{ fields }],
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Airtable consent error:", data);
      throw new Error("Failed to save consent");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Consent API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
