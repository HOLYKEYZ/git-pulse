import { PrismaClient } from "@prisma/client";

async function test() {
  const prisma = new PrismaClient();
  const session = await prisma.session.findFirst({
    where: { user: { username: "HOLYKEYZ" } },
    include: { user: true }
  });

  if (!session?.accessToken) {
    console.error("No token found");
    return;
  }

  const query = `
    query {
      user(login: "HOLYKEYZ") {
        contributionsCollection {
          commitContributionsByRepository {
            repository { name }
            contributions { totalCount }
          }
          repositoryContributions {
            totalCount
          }
          pullRequestContributionsByRepository {
            repository { name }
            contributions { totalCount }
          }
        }
      }
    }
  `;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + session.accessToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);
