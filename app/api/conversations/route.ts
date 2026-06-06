import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatConversations } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function GET() {
    const rows = await db
        .select({
            id: chatConversations.id,
            title: chatConversations.title,
            contextFilter: chatConversations.contextFilter,
            createdAt: chatConversations.createdAt,
            updatedAt: chatConversations.updatedAt,
        })
        .from(chatConversations)
        .orderBy(desc(chatConversations.updatedAt));

    return NextResponse.json(rows);
}

export async function POST(req: Request) {
    const { title, messages, contextFilter } = await req.json();
    const now = new Date();
    const [row] = await db
        .insert(chatConversations)
        .values({
            id: createId(),
            title: (title ?? 'Untitled').slice(0, 80),
            messages: JSON.stringify(messages ?? []),
            contextFilter: contextFilter ?? 'all',
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    return NextResponse.json(row);
}
