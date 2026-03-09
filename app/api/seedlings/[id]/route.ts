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



        const updated = await prisma.$transaction(async (tx) => {
            const oldSeedling = await tx.seedling.findUnique({
                where: { id },
                select: { quantity: true, seedId: true }
            });

            if (!oldSeedling) throw new Error('Seedling not found');

            const seedling = await tx.seedling.update({
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

            // Adjust seed packet quantity if quantity changed
            if (quantity !== undefined && quantity !== oldSeedling.quantity) {
                const diff = Number(quantity) - oldSeedling.quantity;
                await tx.seed.update({
                    where: { id: oldSeedling.seedId },
                    data: {
                        packetQuantity: {
                            decrement: diff
                        }
                    }
                });
            }

            return seedling;
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

        await prisma.$transaction(async (tx) => {
            const seedling = await tx.seedling.findUnique({
                where: { id },
                select: { quantity: true, seedId: true }
            });

            if (seedling) {
                // Return seeds to packet
                await tx.seed.update({
                    where: { id: seedling.seedId },
                    data: {
                        packetQuantity: {
                            increment: seedling.quantity
                        }
                    }
                });

                await tx.seedling.delete({
                    where: { id }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete seedling:', error);
        return NextResponse.json({ error: 'Failed to delete seedling' }, { status: 500 });
    }
}
