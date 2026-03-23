const cheerio = require('cheerio');

async function testScrape() {
  const hovercardUrl = 'https://github.com/users/HOLYKEYZ/achievements/pull-shark/detail?hovercard=1';
  
  const res = await fetch(hovercardUrl, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  });
  const html = await res.text();
  console.log("Hovercard HTML:");
  console.log(html);
}

testScrape();
