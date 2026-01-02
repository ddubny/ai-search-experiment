import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

export async function POST(req) {
  try {
    const { participant_id, consent } = await req.json();

    if (!participant_id) {
      return Response.json(
        { success: false, error: "Missing participant_id" },
        { status: 400 }
      );
    }

    await base("consent").create({
      fields: {
        "Participant ID": participant_id,
        "Consent": consent === "yes",
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Airtable save error:", error);
    return Response.json(
      { success: false, error: "Airtable error" },
      { status: 500 }
    );
  }
}
