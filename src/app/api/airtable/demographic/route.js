import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Demographic`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            participant_id: body.participant_id,
            scenario: body.scenario,
            age: Number(body.age),
            gender: body.gender,
            education: body.education,
            race: body.race,
            hispanic: body.hispanic,
          },
        }),
      }
    );

    if (!airtableRes.ok) {
      const err = await airtableRes.text();
      throw new Error(err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Airtable insert error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
