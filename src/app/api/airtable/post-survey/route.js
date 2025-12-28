import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      participant_id,
      responses,
      reflections,
      created_at,
    } = body;

    if (!participant_id || !responses) {
      throw new Error("participant_id and responses are required");
    }

    const fields = {
      participant_id,
      responses: JSON.stringify(responses),
      reflections: reflections || "",
      created_at: created_at || new Date().toISOString(),
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/post_survey`,
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
      console.error("Airtable post-survey error:", data);
      throw new Error("Failed to save post-survey");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PostSurvey API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
