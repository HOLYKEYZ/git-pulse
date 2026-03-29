const cheerio = require('cheerio');
fetch('https://github.com/trending/developers').then(r => r.text()).then(html => {
  const $ = cheerio.load(html);
  const rows = $('article.Box-row');
  console.log('Devs:', rows.length);
  if (rows.length > 0) {
    const first = rows.first();
    const href = first.find('h1.h3 a').attr('href') || '';
    const name = first.find('h1.h3 a').text().replace(/\s+/g, ' ').trim() || href.replace(/^\//, '').trim();
    console.log('Login:', href);
    console.log('Name:', name);
  }
});
