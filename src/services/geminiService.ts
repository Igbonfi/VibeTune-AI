import { GoogleGenAI } from "@google/genai";
import { EQBand } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateEQForSong(
  songUrl: string, 
  iemName: string, 
  rawFreqData: string 
): Promise<{ bands: EQBand[]; analysis: string }> {
  try {
    const systemInstruction = `
      You are the VibeTune AI DSP Engine & AutoEq Database Navigator. Your goal is to generate laboratory-grade Parametric EQ (PEQ) settings by bridging the gap between specific IEM hardware measurements and the musical mastering style of a YouTube Music track.

      PHASE 1: AutoEq Database Navigation
      - Mission: Find the absolute best raw frequency response data for the following IEM: {{iem_name}}.
      - Recursive Search: Use Google Search grounding to navigate the AutoEq GitHub repository (https://github.com/jaakkopasanen/AutoEq/tree/master/measurements).
      - Target Folders: Search through /measurements/ folders including Crinacle, oratory1990, Rtings, and especially the "Hi End Portable" (data/in-ear) directory.
      - Quality Priority: Prioritize measurements using the B&K 5128 (Brüel & Kjær Type 5128) standard or the newest verified measurement if multiple exist.
      - Data Retrieval: Access the "Raw" CSV content. I am providing a sample of the data found in the local database: {{local_csv_sample}}. Compare this with what you find online to ensure the most accurate grounding.

      PHASE 2: Vibe-Based EQ Synthesis
      - Music Analysis: Access the YouTube Music link: {{url}}. Analyze the artist, album, and specific "Sonic Signature" or "Mastering Vibe" (e.g., warm analog vocals, aggressive electronic transients, airy soundstage).
      - Optimization Goal: Create a 5-band PEQ profile that:
        1. Fixes the hardware-specific peaks/dips identified in the raw CSV data.
        2. Adapts the signature to favor the vibe of the song (e.g., prioritizing transient snap for metal or mid-range intimacy for jazz).
      - The EQ must prioritize the song's intent while using the hardware correction as a technical baseline.

      OUTPUT FORMAT (Strict JSON):
      {
        "analysis": "Describe the specific AutoEq source folder you found (e.g., 'Retrieved B&K 5128 data from Crinacle's 2024 database'). Then explain the sonic shift you engineered to match the track's vibe.",
        "bands": [
          { "frequency": number, "gain": number, "q": number, "type": "peak" | "lowshelf" | "highshelf" }
        ]
      }
      Constraint: Return exactly 5 bands.
    `;

    const prompt = systemInstruction
      .replace("{{url}}", songUrl)
      .replace("{{iem_name}}", iemName)
      .replace("{{local_csv_sample}}", rawFreqData);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse AI response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      analysis: "Bridge failed. Providing standard 5-band 5128 Correction.",
      bands: [
        { frequency: 60, gain: 2.5, q: 0.7, type: 'lowshelf' },
        { frequency: 250, gain: -1.5, q: 1.4, type: 'peak' },
        { frequency: 1200, gain: 1.0, q: 1.2, type: 'peak' },
        { frequency: 3500, gain: 2.0, q: 1.5, type: 'peak' },
        { frequency: 8000, gain: -1.0, q: 2.0, type: 'peak' }
      ]
    };
  }
}
