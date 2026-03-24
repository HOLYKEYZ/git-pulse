const fs = require('fs');
const cheerio = require('cheerio');

async function extract() {
  const html = fs.readFileSync('test-profile.html', 'utf8');
  const $ = cheerio.load(html);
  
  // Find interesting classes
  const classes = new Set();
  $('*').each((i, el) => {
    const c = $(el).attr('class');
    if (c && (c.includes('timeline') || c.includes('Timeline') || c.includes('contribution') || c.includes('Activity'))) {
      classes.add(c);
    }
  });
  console.log("Found relevant classes:", Array.from(classes));
}
extract();
