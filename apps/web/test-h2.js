const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('test-profile.html', 'utf8');
const $ = cheerio.load(html);

console.log("H2s:");
$('h2').each((i, el) => console.log($(el).text().trim()));
console.log("H3s:");
$('h3').each((i, el) => console.log($(el).text().trim()));
