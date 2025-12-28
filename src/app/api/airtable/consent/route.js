import { NextResponse } from "next/server";
import { createParticipantRecord } from "@/lib/airtable";

export async function POST(req) {
  try {
    const body = await req.json();

    const { participant_id, condition, response_json } = body;

    // ✅ 필수값 검증
    if (!participant_id) {
      throw new Error("participant_id is required");
    }
    if (!condition) {
      throw new Error("condition is required");
    }
    if (!response_json) {
      throw new Error("response_json is required");
    }

    const result = await createParticipantRecord({
      participant_id,
      condition,
      response_json,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Airtable API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
