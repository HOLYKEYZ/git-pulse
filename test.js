// test.js
const { loadEnvConfig } = require('@next/env');
const path = require('path');
loadEnvConfig(path.join(__dirname, 'apps/web'));

const cheerio = require('cheerio');

async function testTrending() {
    console.log("Fetching live GitHub Trending...");
    const res = await fetch("https://github.com/trending");
    const html = await res.text();
    const $ = cheerio.load(html);
    const repos = [];
    $("article.Box-row").each((i, el) => {
        if (i >= 5) return;
        const titleEl = $(el).find("h2.h3 a");
        const fullName = titleEl.text().replace(/\s+/g, "").trim();
        repos.push(fullName);
    });
    console.log("REPOS:", repos);

    const devRes = await fetch("https://github.com/trending/developers");
    const devHtml = await devRes.text();
    const $dev = cheerio.load(devHtml);
    const devs = [];
    $dev("article.Box-row").each((i, el) => {
        if (i >= 5) return;
        const nameEl = $dev(el).find("h1.h3.lh-condensed a");
        const handleEl = $dev(el).find("p.f4.text-normal.mb-1 a");
        const name = nameEl.text().trim() || handleEl.text().trim();
        devs.push(name);
    });
    console.log("DEVS:", devs);
}

testTrending();
