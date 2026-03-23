const cheerio = require('cheerio');

async function testParallelScrape() {
  const username = "HOLYKEYZ";
  const res = await fetch(`https://github.com/${username}?tab=achievements`);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const hovercardUrls = [];
  $('a[href*="achievement="]').each((_, el) => {
    const url = $(el).find('[data-hovercard-url]').attr('data-hovercard-url');
    if (url && !hovercardUrls.includes(url)) {
      hovercardUrls.push(url);
    }
  });
  
  const achievements = await Promise.all(hovercardUrls.map(async (url) => {
    const hcRes = await fetch('https://github.com' + url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    const hcHtml = await hcRes.text();
    const $hc = cheerio.load(hcHtml);
    
    const name = $hc('h3').text().trim();
    // Some achievements have a tier label, e.g. "x2"
    let multiplier;
    const tierText = $hc('.achievement-tier-label').text().trim();
    if (tierText.startsWith('x')) {
      multiplier = parseInt(tierText.replace('x', ''), 10);
    }
    
    // Description is typically the next div after the title row
    const description = $hc('h3').parent().next('div').text().trim();
    
    // Badge Image
    // The main badge image is the first img with class tier-badge
    let badgeUrl = $hc('img.tier-badge').attr('src');
    if (badgeUrl) badgeUrl = badgeUrl.split('?')[0];
    
    return { name, description, multiplier, badgeUrl };
  }));
  
  console.log(JSON.stringify(achievements, null, 2));
}

testParallelScrape();
