import { NextResponse } from "next/server";

export const runtime = "nodejs";

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const TABLE_NAME = "consent";

export async function POST(req) {
  try {
    const { consent_key, participant_id, consent, name, date } =
      await req.json();

    if (!consent_key) {
      return NextResponse.json(
        { success: false, error: "Missing consent_key" },
        { status: 400 }
      );
    }

    const headers = {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    /* ① consent_key 중복 검사 */
    const query = encodeURIComponent(`{consent_key}="${consent_key}"`);
    const checkUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}?filterByFormula=${query}&maxRecords=1`;

    const checkRes = await fetch(checkUrl, { headers });
    const checkData = await checkRes.json();

    if (checkData.records && checkData.records.length > 0) {
      return NextResponse.json({
        success: true,
        duplicate: true,
      });
    }

    /* ② 없을 때만 생성 */
    const createRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          fields: {
            consent_key,
            participant_id,
            consent,
            name,
            date,
          },
        }),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(errText);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Consent API error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
