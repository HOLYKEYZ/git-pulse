const cheerio = require('cheerio');

async function testScrape() {
  const res = await fetch('https://github.com/HOLYKEYZ?tab=achievements');
  const html = await res.text();
  
  // check if 'have been merged' or 'Opened' is in the raw HTML at all
  console.log("Contains Pull Shark description:", html.includes("have been merged"));
  console.log("Contains Galaxy Brain description:", html.includes("Answered"));
}

testScrape();
