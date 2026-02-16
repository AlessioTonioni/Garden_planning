import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const parseDate = (val: any) => {
    if (!val) return undefined;
    const date = new Date(val);
    if (isNaN(date.getTime())) return undefined;
    return date;
};

const parseNullableDate = (val: any) => {
    if (val === null) return null;
    if (!val) return undefined;
    const date = new Date(val);
    if (isNaN(date.getTime())) return undefined;
    return date;
};

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { quantity, seededAt, expectedSproutAt, sproutedAt, transplantedAt, location, status, notes } = body;



        const updated = await prisma.seedling.update({
            where: { id },
            data: {
                quantity: quantity !== undefined ? Number(quantity) : undefined,
                seededAt: parseDate(seededAt),
                expectedSproutAt: parseNullableDate(expectedSproutAt),
                sproutedAt: parseNullableDate(sproutedAt),
                transplantedAt: parseNullableDate(transplantedAt),
                location,
                status,
                notes
            },
            include: { seed: true }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Failed to update seedling. Detailed error:', error);
        return NextResponse.json({
            error: 'Failed to update seedling',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.seedling.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete seedling:', error);
        return NextResponse.json({ error: 'Failed to delete seedling' }, { status: 500 });
    }
}
