import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const { participant_id, consent, name, date } = body;

    if (!participant_id) {
      throw new Error("participant_id is required");
    }
    if (!consent) {
      throw new Error("consent is required");
    }
    if (!date) {
      throw new Error("date is required");
    }

    const fields = {
      participant_id,
      consent, // "yes" | "no" → Airtable Single select
      name: name || "",
      date,    // YYYY-MM-DD (page.js에서 온 값 그대로)
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
