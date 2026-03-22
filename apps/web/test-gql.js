const query = `query($username: String!) {
  user(login: $username) {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
        }
      }
    }
  }
}`;

fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Node',
    'Authorization': 'Bearer ' + (process.env.GITHUB_TOKEN || '')
  },
  body: JSON.stringify({ query, variables: { username: "HOLYKEYZ" } })
}).then(r => r.json()).then(console.log).catch(console.error);
