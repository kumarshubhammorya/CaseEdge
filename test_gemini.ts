import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-2.5-flash';

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          inlineData: {
            data: Buffer.from("test document content goes here").toString("base64"),
            mimeType: "text/plain"
          }
        },
        { text: "What did I just say? Summarize the document." }
      ]
    });
    console.log("SUCCESS:", response.text);
  } catch (e) {
    console.error("FAILED:", e);
  }
}
test();
