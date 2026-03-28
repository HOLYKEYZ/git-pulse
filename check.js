const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    take: 5
  });
  console.log("Total Posts fetched:", posts.length);
  for (const p of posts) {
    console.log(`Post ID: ${p.id}, repoEmbed:`, JSON.stringify(p.repoEmbed).substring(0, 100));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
