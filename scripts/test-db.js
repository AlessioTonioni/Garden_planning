const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to fetch seeds...');
        const seeds = await prisma.seed.findMany();
        console.log('Seeds found:', seeds.length);

        console.log('Attempting to fetch seedlings...');
        const seedlings = await prisma.seedling.findMany();
        console.log('Seedlings found:', seedlings.length);

        console.log('Schema test SUCCESS');
    } catch (error) {
        console.error('Schema test FAILED');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
