import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGardenContext } from "@/lib/ai/gardenContext";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
    try {
        const { messages, contextFilter, selectedZoneId, selectedItemId, systemPrompt } = await req.json();
        const latestMessage = messages[messages.length - 1];

        // Fetch relevant context
        const context = await getGardenContext({
            includeSeedbed: contextFilter === 'all' || contextFilter === 'seedbed',
            selectedZoneId: contextFilter === 'selection' ? selectedZoneId : undefined,
            selectedItemId: contextFilter === 'selection' ? selectedItemId : undefined
        });

        const contextString = JSON.stringify(context, null, 2);

        const prompt = `${systemPrompt || 'You are a helpful gardening assistant.'}

CURRENT GARDEN CONTEXT:
${contextString}

USER QUESTION:
${latestMessage.content}

Respond helpfully based on the garden context above. Format in Markdown.`;

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
