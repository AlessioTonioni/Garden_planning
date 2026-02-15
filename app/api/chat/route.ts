import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGardenContext } from "@/lib/ai/gardenContext";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
    try {
        const { messages, contextFilter, selectedZoneIds, selectedItemIds, selectedSeedIds, systemPrompt } = await req.json();
        const latestMessage = messages[messages.length - 1];

        // Fetch relevant context
        const context = await getGardenContext({
            includeSeedbed: contextFilter === 'all' || contextFilter === 'seedbed',
            selectedZoneIds: (contextFilter === 'selection' || contextFilter === 'all') ? selectedZoneIds : [],
            selectedItemIds: (contextFilter === 'selection' || contextFilter === 'all') ? selectedItemIds : [],
            selectedSeedIds: (contextFilter === 'selection' || contextFilter === 'all') ? selectedSeedIds : []
        });

        const contextString = JSON.stringify(context, null, 2);

        // System instruction defines core behavior and includes the current garden context
        // to ensure the model stays grounded in the user's specific garden setup.
        const systemInstruction = `${systemPrompt || 'You are a helpful gardening assistant.'}

CURRENT GARDEN CONTEXT:
${contextString}

Respond helpfully based on the context above and the conversation history. Format in Markdown.`;

        // Initialize model with system instructions
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            systemInstruction
        });

        // Map messages into Gemini's history format (everything except the latest message)
        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // Start a chat session with the provided history
        const chat = model.startChat({ history });

        // Send the latest message in the multi-turn context
        const result = await chat.sendMessage(latestMessage.content);
        const response = await result.response;
        const text = response.text();

        // Return the assistant's response along with the context used (for debug purposes)
        return NextResponse.json({
            role: 'assistant',
            content: text,
            prompt: `[System Instruction]\n${systemInstruction}\n\n[Latest Message]\n${latestMessage.content}`
        });

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
