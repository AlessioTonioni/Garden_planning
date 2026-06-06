import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatConversations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [row] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
        ...row,
        messages: JSON.parse(row.messages as string),
    });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { messages, title } = await req.json();

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (messages !== undefined) update.messages = JSON.stringify(messages);
    if (title !== undefined) update.title = (title as string).slice(0, 80);

    await db.update(chatConversations).set(update).where(eq(chatConversations.id, id));
    return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await db.delete(chatConversations).where(eq(chatConversations.id, id));
    return NextResponse.json({ ok: true });
}
