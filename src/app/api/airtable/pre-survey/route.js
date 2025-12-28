import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      participant_id,
      Task_type,
      familiarity_responses,
      self_efficacy_responses,
    } = body;

    if (!participant_id) {
      throw new Error("participant_id is required");
    }
    if (!Task_type) {
      throw new Error("Task_type is required");
    }

    const fields = {
      participant_id,
      Task_type, // Single select (string)
      familiarity_responses: JSON.stringify(familiarity_responses),
      self_efficacy_responses: JSON.stringify(self_efficacy_responses),
      // created_at ❌ Airtable 자동
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/pre_survey`,
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
      console.error("Airtable pre-survey error:", data);
      throw new Error("Failed to save pre-survey");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PreSurvey API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
