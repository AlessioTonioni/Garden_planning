import { GoogleGenAI, type Interactions } from "@google/genai";
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

const TASK_TOOLS: Interactions.Tool[] = [
    {
        type: 'function',
        name: 'create_garden_task',
        description: 'Add a new task or reminder to the garden to-do list',
        parameters: {
            type: 'object',
            properties: {
                title:          { type: 'string', description: 'Short task title' },
                description:    { type: 'string', description: 'Optional longer description' },
                dueDate:        { type: 'string', description: 'ISO date string (YYYY-MM-DD), optional' },
                zoneId:         { type: 'string', description: 'Zone ID to link the task to, optional' },
                placementLabel: { type: 'string', description: 'Plant or item name the task is about, optional' },
                recurrence:     { type: 'string', description: 'Recurrence: daily, weekly, monthly, yearly, or omit for one-off' },
            },
            required: ['title'],
        }
    },
    {
        type: 'function',
        name: 'complete_garden_task',
        description: 'Mark an existing garden task as done (recurring tasks get rescheduled instead of closed)',
        parameters: {
            type: 'object',
            properties: {
                taskId:    { type: 'string', description: 'Exact ID of the task (preferred if known)' },
                taskTitle: { type: 'string', description: 'Title or partial title to find the task by' },
            },
            required: [],
        }
    }
];

// Guards against a model that keeps calling tools without ever answering.
const MAX_TOOL_ROUNDS = 5;

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

        const history: Interactions.Step[] = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
            type: m.role === 'user' ? 'user_input' : 'model_output',
            content: [{ type: 'text', text: m.content }],
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

        // Stateless (store: false): the client resends the conversation each
        // request, so tool rounds replay the model's steps (incl. thought
        // signatures) plus the function results instead of chaining by id.
        const steps: Interactions.Step[] = [
            ...history,
            { type: 'user_input', content: [{ type: 'text', text: contentToSend }] },
        ];
        const ask = () => ai.interactions.create({
            model: AI_MODEL,
            system_instruction: systemPrompt || 'You are a helpful gardening assistant.',
            tools: TASK_TOOLS,
            input: steps,
            store: false,
        });

        let interaction = await ask();
        let taskMutated = false;

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
            const fnCalls = (interaction.steps ?? []).filter(
                (s): s is Interactions.FunctionCallStep => s.type === 'function_call'
            );
            if (fnCalls.length === 0) break;

            steps.push(...(interaction.steps ?? []));
            for (const fn of fnCalls) {
                const fnResult = await handleFunctionCall(fn.name, fn.arguments as Record<string, string>);
                taskMutated ||= fnResult.success;
                steps.push({
                    type: 'function_result',
                    call_id: fn.id,
                    name: fn.name,
                    result: [{ type: 'text', text: JSON.stringify(fnResult) }],
                });
            }
            interaction = await ask();
        }

        const responseText = interaction.output_text ?? '';

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
