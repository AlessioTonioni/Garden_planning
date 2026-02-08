import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { lat, lng, metadata } = body;

        const data: any = {};
        if (lat !== undefined) data.lat = lat;
        if (lng !== undefined) data.lng = lng;
        if (metadata !== undefined) data.metadata = JSON.stringify(metadata);

        const placement = await prisma.placement.update({
            where: { id },
            data
        });

        return NextResponse.json(placement);
    } catch (error: any) {
        console.error('Update placement failed:', error);
        return NextResponse.json({
            error: 'Failed to update placement',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.placement.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete placement' }, { status: 500 });
    }
}
