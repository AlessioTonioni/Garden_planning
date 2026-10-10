import { GoogleGenAI, Type, type Tool } from "@google/genai";
import { getGardenContext } from "@/lib/ai/gardenContext";
import { NextResponse } from "next/server";
import { AI_MODEL } from "@/lib/constants";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

function advanceDueDate(current: Date | null, recurrence: string): Date {
    const base = current && new Date(current) > new Date() ? new Date(current) : new Date();
    switch (recurrence) {
        case 'daily':   base.setDate(base.getDate() + 1); break;
        case 'weekly':  base.setDate(base.getDate() + 7); break;
        case 'monthly': base.setMonth(base.getMonth() + 1); break;
        case 'yearly':  base.setFullYear(base.getFullYear() + 1); break;
    }
    return base;
}

const TASK_TOOLS: Tool[] = [{
    functionDeclarations: [
        {
            name: 'create_garden_task',
            description: 'Add a new task or reminder to the garden to-do list',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    title:          { type: Type.STRING, description: 'Short task title' },
                    description:    { type: Type.STRING, description: 'Optional longer description' },
                    dueDate:        { type: Type.STRING, description: 'ISO date string (YYYY-MM-DD), optional' },
                    zoneId:         { type: Type.STRING, description: 'Zone ID to link the task to, optional' },
                    placementLabel: { type: Type.STRING, description: 'Plant or item name the task is about, optional' },
                    recurrence:     { type: Type.STRING, description: 'Recurrence: daily, weekly, monthly, yearly, or omit for one-off' },
                },
                required: ['title'],
            }
        },
        {
            name: 'complete_garden_task',
            description: 'Mark an existing garden task as done (recurring tasks get rescheduled instead of closed)',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    taskId:    { type: Type.STRING, description: 'Exact ID of the task (preferred if known)' },
                    taskTitle: { type: Type.STRING, description: 'Title or partial title to find the task by' },
                },
                required: [],
            }
        }
    ]
}];

async function handleFunctionCall(name: string, args: Record<string, string>): Promise<{ success: boolean; message: string }> {
    try {
        if (name === 'create_garden_task') {
            const { title, description, dueDate, zoneId, placementLabel, recurrence } = args;
            await db.insert(tasks).values({
                title,
                description: description || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                zoneId: zoneId || null,
                placementLabel: placementLabel || null,
                recurrence: recurrence || null,
            });
            return { success: true, message: `Task created: "${title}"` };
        }

        if (name === 'complete_garden_task') {
            const { taskId, taskTitle } = args;
            let task = null;

            if (taskId) {
                const [found] = await db.select().from(tasks).where(eq(tasks.id, taskId));
                task = found;
            } else if (taskTitle) {
                const allOpen = await db.select().from(tasks).where(eq(tasks.status, 'open'));
                task = allOpen.find(t =>
                    t.title.toLowerCase().includes(taskTitle.toLowerCase())
                ) || null;
            }

            if (!task) return { success: false, message: 'Task not found' };

            const update = task.recurrence
                ? { lastCompletedAt: new Date(), dueDate: advanceDueDate(task.dueDate, task.recurrence), updatedAt: new Date() }
                : { status: 'done', lastCompletedAt: new Date(), updatedAt: new Date() };

            await db.update(tasks).set(update).where(eq(tasks.id, task.id));
            return {
                success: true,
                message: task.recurrence
                    ? `Task "${task.title}" completed and rescheduled`
                    : `Task "${task.title}" marked as done`,
            };
        }

        return { success: false, message: 'Unknown function' };
    } catch (e) {
        return { success: false, message: String(e) };
    }
}

export async function POST(req: Request) {
    try {
        const { messages, contextFilter, selectedZoneIds, selectedItemIds, selectedSeedIds, systemPrompt } = await req.json();
        const latestMessage = messages[messages.length - 1];

        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        let contentToSend = latestMessage.content;
        let contextUsed = null;

        if (messages.length === 1) {
            const context = await getGardenContext({
                includePlanner: contextFilter === 'all' || contextFilter === 'planner',
                includeSeedbed: contextFilter === 'all' || contextFilter === 'seedbed',
                includeTasks: contextFilter === 'all' || contextFilter === 'tasks',
                selectedZoneIds: (contextFilter === 'selection' || contextFilter === 'all') ? selectedZoneIds : [],
                selectedItemIds: (contextFilter === 'selection' || contextFilter === 'all') ? selectedItemIds : [],
                selectedSeedIds: (contextFilter === 'selection' || contextFilter === 'all') ? selectedSeedIds : []
            });
            contextUsed = context;
            contentToSend = `GARDEN CONTEXT (for grounding your responses):\n${JSON.stringify(context, null, 2)}\n\nUSER QUESTION:\n${latestMessage.content}`;
        }

        const chat = ai.chats.create({
            model: AI_MODEL,
            config: {
                systemInstruction: systemPrompt || 'You are a helpful gardening assistant.',
                tools: TASK_TOOLS,
            },
            history,
        });
        const response = await chat.sendMessage({ message: contentToSend });

        let responseText: string;
        let taskMutated = false;

        const fnCalls = response.functionCalls;
        if (fnCalls && fnCalls.length > 0) {
            const fn = fnCalls[0];
            const fnResult = await handleFunctionCall(fn.name!, fn.args as Record<string, string>);
            taskMutated = fnResult.success;

            const response2 = await chat.sendMessage({
                message: [{ functionResponse: { name: fn.name, response: fnResult } }]
            });
            responseText = response2.text ?? '';
        } else {
            responseText = response.text ?? '';
        }

        const systemInstructionUsed = systemPrompt || 'You are a helpful gardening assistant.';

        return NextResponse.json({
            role: 'assistant',
            content: responseText,
            taskMutated,
            prompt: `[System Instruction]\n${systemInstructionUsed}\n\n${messages.length === 1 ? '[Contextualized First Message]' : '[Follow-up Message]'}\n${contentToSend}`
        });

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
