const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const id = 'cmksb0rwl004113z9vjmdd57b';
    console.log('Testing update for ID:', id);
    try {
        const updated = await prisma.zone.update({
            where: { id },
            data: { name: 'Debugger Update' }
        });
        console.log('Update successful:', updated);
    } catch (e) {
        console.error('Update FAILED with error:');
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
