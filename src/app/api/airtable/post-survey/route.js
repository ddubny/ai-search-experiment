import { NextResponse } from "next/server";

const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj ?? {});
  } catch {
    return JSON.stringify({});
  }
};

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
    if (!process.env.AIRTABLE_POST_SURVEY_TABLE) {
      throw new Error("Missing AIRTABLE_POST_SURVEY_TABLE");
    }

    const safeTaskType =
      typeof Task_type === "string" && Task_type.trim()
        ? Task_type
        : "unknown";

    const fields = {
      participant_id,
      Task_type: safeTaskType,
      serendipity_responses: safeStringify(serendipity_responses),
      post_familiarity_responses: safeStringify(post_familiarity_responses),
      emotion_responses: safeStringify(emotion_responses),
      post_self_efficacy_responses: safeStringify(post_self_efficacy_responses),
      open_ended: safeStringify(open_ended),
    };

    const table = process.env.AIRTABLE_POST_SURVEY_TABLE;

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
      console.error("Airtable post-survey error:", {
        status: res.status,
        statusText: res.statusText,
        data,
      });
      throw new Error(
        data?.error?.message || "Failed to create Airtable record"
      );
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
