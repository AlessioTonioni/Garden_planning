import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        await prisma.zone.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete zone' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const updatedZone = await prisma.zone.update({
            where: { id },
            data: {
                ...(body.name !== undefined && { name: body.name }),
                ...(body.type !== undefined && { type: body.type }),
                ...(body.notes !== undefined && { notes: body.notes }),
            }
        });

        return NextResponse.json(updatedZone);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update zone' }, { status: 500 });
    }
}
