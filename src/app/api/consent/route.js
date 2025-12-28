import { NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

export async function POST(req) {
  try {
    const body = await req.json();
    const { consent_key, participant_id, consent, name, date } = body;

    if (!consent_key) {
      return NextResponse.json(
        { success: false, error: "Missing consent_key" },
        { status: 400 }
      );
    }

    const table = base("consent");

    // ✅ ① consent_key 기준 중복 검사
    const existing = await table
      .select({
        filterByFormula: `{consent_key} = "${consent_key}"`,
        maxRecords: 1,
      })
      .firstPage();

    // ✅ ② 이미 있으면 새 row 생성하지 않음
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        duplicate: true,
      });
    }

    // ✅ ③ 없을 때만 create
    await table.create({
      consent_key,
      participant_id,
      consent,
      name,
      date,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Consent API error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
