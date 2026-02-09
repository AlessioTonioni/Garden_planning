import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGardenContext } from "@/lib/ai/gardenContext";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
    try {
        const { messages, contextFilter, selectedZoneId, selectedItemId } = await req.json();
        const latestMessage = messages[messages.length - 1];

        // Fetch relevant context
        const context = await getGardenContext({
            includeSeedbed: contextFilter === 'all' || contextFilter === 'seedbed',
            selectedZoneId: contextFilter === 'selection' ? selectedZoneId : undefined,
            selectedItemId: contextFilter === 'selection' ? selectedItemId : undefined
        });

        const contextString = JSON.stringify(context, null, 2);

        const prompt = `
      You are an expert Gardening Assistant for a garden planning application.
      
      CURRENT GARDEN CONTEXT:
      ${contextString}

      USER QUESTION:
      ${latestMessage.content}

      INSTRUCTIONS:
      - Answer the user's question based on the provided garden context.
      - Be concise and helpful.
      - If suggesting plants, consider the zone's area and existing items.
      - Format your response in Markdown.
    `;

        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ role: 'assistant', content: text, prompt });

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
