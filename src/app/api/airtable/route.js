import { NextResponse } from "next/server";
import { createParticipantRecord } from "@/lib/airtable";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      participant_id = "TEST_001",
      condition = "ConvSearch",
      response_json = {},
    } = body;

    const result = await createParticipantRecord({
      participant_id,
      condition,
      response_json,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
