const cheerio = require('cheerio');

async function testScrape() {
  const res = await fetch('https://github.com/HOLYKEYZ?tab=achievements');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const achievements = [];
  $('a[href*="achievement="]').each((_, el) => {
    const a = $(el);
    const img = a.find('img').first();
    const badgeUrl = img.attr('src');
    const name = img.attr('alt');
    
    // Look for description inside the card - usually there's some text node
    const textBlob = a.text().replace(/\s+/g, ' ').trim();
    
    let multiplier;
    const xMatch = textBlob.match(/x(\d+)/);
    if (xMatch && xMatch[1]) {
      multiplier = parseInt(xMatch[1], 10);
    }
    
    if (badgeUrl && name && !achievements.find(ac => ac.name === name)) {
      achievements.push({
        badgeUrl: badgeUrl.split('?')[0],
        name,
        textBlob,
        multiplier,
        rawText: a.text().trim()
      });
    }
  });
  
  console.log(JSON.stringify(achievements, null, 2));
}

testScrape();
