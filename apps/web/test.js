const cheerio = require('cheerio');
fetch('https://github.com/trending').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const rows = $('article.Box-row');
  console.log('Repos:', rows.length);
  if (rows.length > 0) {
    console.log('Url:', rows.first().find('h2.h3 a').attr('href'));
    console.log('Desc:', rows.first().find('p.col-9').text().trim().replace(/\s+/g, ' '));
  }
});
