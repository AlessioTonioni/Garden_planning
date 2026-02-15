import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            species, packetQuantity, acquiredAt, expiryDate, notes,
            seedingStart, seedingEnd, harvestingStart, harvestingEnd
        } = body;

        const updated = await prisma.seed.update({
            where: { id },
            data: {
                species,
                packetQuantity: packetQuantity !== undefined ? Number(packetQuantity) : undefined,
                acquiredAt: acquiredAt ? new Date(acquiredAt) : undefined,
                expiryDate: expiryDate ? new Date(expiryDate) : (expiryDate === null ? null : undefined),
                notes,
                seedingStart: seedingStart !== undefined ? (seedingStart === null ? null : Number(seedingStart)) : undefined,
                seedingEnd: seedingEnd !== undefined ? (seedingEnd === null ? null : Number(seedingEnd)) : undefined,
                harvestingStart: harvestingStart !== undefined ? (harvestingStart === null ? null : Number(harvestingStart)) : undefined,
                harvestingEnd: harvestingEnd !== undefined ? (harvestingEnd === null ? null : Number(harvestingEnd)) : undefined,
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Failed to update seed:', error);
        return NextResponse.json({ error: 'Failed to update seed' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.seed.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete seed:', error);
        return NextResponse.json({ error: 'Failed to delete seed' }, { status: 500 });
    }
}
