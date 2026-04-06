const fs = require('fs');

const promptPath = 'c:/Users/USER/Downloads/GITPULSE_SIDEBAR_PROMPT.md';
const codePath = 'c:/Users/USER/git-pulse/apps/web/src/lib/github.ts';

const promptText = fs.readFileSync(promptPath, 'utf8');
let codeText = fs.readFileSync(codePath, 'utf8');

function extractFunction(name) {
  const marker = 'export async function ' + name;
  const startIdx = promptText.indexOf(marker);
  if (startIdx === -1) throw new Error('Not found ' + name);
  let endIdx = startIdx;
  let braceCount = 0;
  let inFn = true;
  while(inFn && endIdx < promptText.length) {
    if(promptText[endIdx] === '{') braceCount++;
    else if(promptText[endIdx] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIdx++;
        break;
      }
    }
    endIdx++;
  }
  return promptText.substring(startIdx, endIdx);
}

function replaceFunction(name, newContent) {
  const marker = 'export async function ' + name;
  const startIdx = codeText.indexOf(marker);
  if (startIdx === -1) {
    console.log('Not found in code ' + name + ', skipping replacement.');
    return;
  }
  let endIdx = startIdx;
  let braceCount = 0;
  let inFn = true;
  while(inFn && endIdx < codeText.length) {
    if(codeText[endIdx] === '{') braceCount++;
    else if(codeText[endIdx] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIdx++;
        break;
      }
    }
    endIdx++;
  }
  codeText = codeText.substring(0, startIdx) + newContent + codeText.substring(endIdx);
  console.log('Replaced function ' + name);
}

const fns = ['getTopDevsByDailyCommits', 'getTopReposByDailyCommits', 'getUpcomingGitHubProjects', 'getUpcomingGitHubDevs', 'getDevelopersLikeYou'];

fns.forEach(fn => {
  const newContent = extractFunction(fn);
  replaceFunction(fn, newContent);
});

// Also add BOT_PATTERNS
const botPatRegex = /const BOT_PATTERNS = \[\s+.*?\];/s;
const botMatch = promptText.match(botPatRegex);
if (!botMatch) throw new Error('Bot pattern not found');
const isBotDef = 'const isBot = (login: string) => BOT_PATTERNS.some(p => p.test(login));';

// Before replacing graphQL url, find where it is
const gqlUrlPos = codeText.indexOf('const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";');
if (gqlUrlPos !== -1) {
    codeText = codeText.substring(0, gqlUrlPos + 62) + '\n\n' + botMatch[0] + '\n' + isBotDef + '\n' + codeText.substring(gqlUrlPos + 62);
    console.log('Added BOT_PATTERNS section');
} else {
    console.log('Failed to find GITHUB_GRAPHQL_URL string');
}

// Strip local bot patterns across the file as instructed
codeText = codeText.replace(/const BOT_PATTERNS = \[.*?\];/gs, '');
// Re-inject the global one since it also matched above
codeText = codeText.replace('const isBot = (login: string) => BOT_PATTERNS.some(p => p.test(login));', '\n' + botMatch[0] + '\nconst isBot = (login: string) => BOT_PATTERNS.some(p => p.test(login));');
codeText = codeText.replace(/const isBot = \(login: string\) => BOT_PATTERNS\.some\(\(p\) => p\.test\(login\)\);/g, '');

fs.writeFileSync(codePath, codeText);
console.log('REPLACED 5 FUNCTIONS AND ADDED BOT_PATTERNS');
