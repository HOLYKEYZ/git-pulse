const cheerio = require('cheerio');

async function testScrape() {
  const res = await fetch('https://github.com/HOLYKEYZ?tab=achievements');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const firstAchievement = $('a[href*="achievement="]').first();
  console.log("HTML of first achievement:");
  console.log(firstAchievement.html());
}

testScrape();
