const fs = require('fs');
const cheerio = require('cheerio');

async function extract() {
  const url = 'https://github.com/HOLYKEYZ?action=show&controller=profiles&tab=contributions&user_id=HOLYKEYZ';
  const res = await fetch(url, { headers: { 'x-requested-with': 'XMLHttpRequest' } });
  const html = await res.text();
  fs.writeFileSync('test-frag.html', html);
  console.log("Wrote frag html, length:", html.length);
  
  const $ = cheerio.load(html);
  console.log("activity element:", $('#js-contribution-activity').length);
  console.log("timeline elements:", $('.js-profile-timeline-year-list').length);
  console.log("h2 elements:", $('h2').length);
  $('h2').each((i, el) => console.log('H2:', $(el).text().trim()));
}
extract();
