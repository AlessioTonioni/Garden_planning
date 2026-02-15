import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
    try {
        const { images } = await req.json(); // Array of base64 strings

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json({ error: "No images provided" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Extract seed packet information from the images. If some information are missing you can integrate based on your common knowledge or search results. Independently of the language on the package please extract and translate all information to english. 
Extract:
- species: string (variety name)
- packetQuantity: number (default 10)
- acquiredAt: string (YYYY-MM-DD, default "${new Date().toISOString().split('T')[0]}")
- expiryDate: string | null (YYYY-MM-DD)
- seedingStart: number | null (1-12, month when sowing starts)
- seedingEnd: number | null (1-12, month when sowing ends)
- harvestingStart: number | null (1-12, month when harvesting starts)
- harvestingEnd: number | null (1-12, month when harvesting ends)
- notes: string (other info)

Return JSON matching this schema:
{"species": string, "packetQuantity": number, "acquiredAt": string, "expiryDate": string | null, "seedingStart": number | null, "seedingEnd": number | null, "harvestingStart": number | null, "harvestingEnd": number | null, "notes": string}`;

        const imageParts = images.map((base64: string) => ({
            inlineData: {
                data: base64.split(',')[1],
                mimeType: "image/jpeg", // Assuming jpeg for now, should ideally be dynamic
            },
        }));

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text().trim();

        // Remove markdown formatting if Gemini included it
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;

        try {
            const extractedData = JSON.parse(jsonStr);
            return NextResponse.json(extractedData);
        } catch (parseError) {
            console.error("JSON Parse Error:", text);
            return NextResponse.json({ error: "Failed to parse extraction results" }, { status: 500 });
        }

    } catch (error) {
        console.error("Extraction API Error:", error);
        return NextResponse.json({ error: "Failed to extract seed information" }, { status: 500 });
    }
}
