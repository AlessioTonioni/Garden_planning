import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { seedlings } from '@/lib/db/schema';
import fs from 'fs';
import path from 'path';

function getPhotosDir(): string {
    const dbUrl = process.env.DATABASE_URL || 'file:./data/dev.db';
    const dbPath = dbUrl.replace(/^file:/, '');
    const dataDir = path.dirname(path.resolve(dbPath));
    const photosDir = path.join(dataDir, 'photos');
    if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
    return photosDir;
}

const MIME_TYPES: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', gif: 'image/gif', heic: 'image/heic',
};

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const photosDir = getPhotosDir();

    const file = fs.readdirSync(photosDir).find(f => f.startsWith(`${id}.`));
    if (!file) return new NextResponse(null, { status: 404 });

    const buffer = fs.readFileSync(path.join(photosDir, file));
    const ext = file.split('.').pop()?.toLowerCase() ?? 'jpg';

    return new NextResponse(buffer, {
        headers: { 'Content-Type': MIME_TYPES[ext] ?? 'image/jpeg' },
    });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const photosDir = getPhotosDir();

    // Remove any existing photo for this seedling
    fs.readdirSync(photosDir)
        .filter(f => f.startsWith(`${id}.`))
        .forEach(f => fs.unlinkSync(path.join(photosDir, f)));

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(photosDir, `${id}.${ext}`), buffer);

    const photoPath = `/api/seedlings/${id}/photo`;
    db.update(seedlings)
        .set({ photoPath, updatedAt: new Date() })
        .where(eq(seedlings.id, id))
        .run();

    return NextResponse.json({ photoPath });
}
