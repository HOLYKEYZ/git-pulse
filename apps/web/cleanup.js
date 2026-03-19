const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.post.deleteMany({
        where: {
            repoEmbed: {
                not: null
            }
        }
    });
    console.log("Deleted old posts with `repoEmbed` to clear out malformed data.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
