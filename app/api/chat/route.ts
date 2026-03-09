import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGardenContext } from "@/lib/ai/gardenContext";
import { NextResponse } from "next/server";
import { AI_MODEL } from "@/lib/constants";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
    try {
        const { messages, contextFilter, selectedZoneIds, selectedItemIds, selectedSeedIds, systemPrompt } = await req.json();
        const latestMessage = messages[messages.length - 1];

        // Initialize model with basic system instructions (personality)
        const model = genAI.getGenerativeModel({
            model: AI_MODEL,
            systemInstruction: systemPrompt || 'You are a helpful gardening assistant.'
        });

        // Map messages into Gemini's history format
        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        let contentToSend = latestMessage.content;
        let contextUsed = null;

        // ONLY include context on the first turn
        if (messages.length === 1) {
            const context = await getGardenContext({
                includePlanner: contextFilter === 'all' || contextFilter === 'planner',
                includeSeedbed: contextFilter === 'all' || contextFilter === 'seedbed',
                selectedZoneIds: (contextFilter === 'selection' || contextFilter === 'all') ? selectedZoneIds : [],
                selectedItemIds: (contextFilter === 'selection' || contextFilter === 'all') ? selectedItemIds : [],
                selectedSeedIds: (contextFilter === 'selection' || contextFilter === 'all') ? selectedSeedIds : []
            });
            contextUsed = context;
            const contextString = JSON.stringify(context, null, 2);

            contentToSend = `GARDEN CONTEXT (for grounding your responses):\n${contextString}\n\nUSER QUESTION:\n${latestMessage.content}`;
        }

        // Start a chat session with the provided history
        const chat = model.startChat({ history });

        // Send the message
        const result = await chat.sendMessage(contentToSend);
        const responseText = (await result.response).text();

        const systemInstructionUsed = systemPrompt || 'You are a helpful gardening assistant.';

        // Return the assistant's response
        return NextResponse.json({
            role: 'assistant',
            content: responseText,
            prompt: `[System Instruction]\n${systemInstructionUsed}\n\n${messages.length === 1 ? '[Contextualized First Message]' : '[Follow-up Message]'}\n${contentToSend}`
        });

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
