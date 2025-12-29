import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

console.log("Gemini API called");

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    // The SDK picks up GEMINI_API_KEY from env in many examples,
    // but being explicit is clearer for server code.
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ text: response.text });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
