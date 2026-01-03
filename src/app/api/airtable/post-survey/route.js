import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      participant_id,
      Task_type,
      serendipity_responses,
      post_familiarity_responses,
      emotion_responses,
      post_self_efficacy_responses,
      open_ended,
    } = body;

    if (!participant_id) {
      throw new Error("participant_id is required");
    }
    if (!Task_type) {
      throw new Error("Task_type is required");
    }

    if (!process.env.AIRTABLE_BASE_ID) {
      throw new Error("Missing AIRTABLE_BASE_ID");
    }
    if (!process.env.AIRTABLE_API_KEY) {
      throw new Error("Missing AIRTABLE_API_KEY");
    }

    const fields = {
      participant_id,
      Task_type, // Single select or text
      serendipity_responses: JSON.stringify(serendipity_responses || {}),
      post_familiarity_responses: JSON.stringify(post_familiarity_responses || {}),
      emotion_responses: JSON.stringify(emotion_responses || {}),
      post_self_efficacy_responses: JSON.stringify(post_self_efficacy_responses || {}),
      open_ended: JSON.stringify(open_ended || {}),
      // created_at: Airtable auto
    };

    const table =
      process.env.AIRTABLE_POST_SURVEY_TABLE || "post_survey";

    const res = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(
        table
      )}`,
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
      const msg =
        data?.error?.message ||
        data?.error ||
        JSON.stringify(data);
      throw new Error(msg);
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
