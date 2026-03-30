// test.js - compare github trending with our scraper
const cheerio = require('cheerio');

async function compareTrending() {
    // fetch live github trending repos
    console.log("=== GITHUB TRENDING REPOS (LIVE) ===");
    const res = await fetch("https://github.com/trending");
    const html = await res.text();
    const $ = cheerio.load(html);
    const liveRepos = [];
    $("article.Box-row").each((i, el) => {
        if (i >= 5) return;
        const titleEl = $(el).find("h2.h3 a");
        const fullName = titleEl.text().replace(/\s+/g, "").trim();
        const starsEl = $(el).find("a.Link--muted.d-inline-block.mr-3");
        const stars = starsEl.first().text().trim();
        liveRepos.push({ name: fullName, stars });
    });
    liveRepos.forEach((r, i) => console.log(`  ${i+1}. ${r.name} (${r.stars})`));

    // fetch live github trending devs
    console.log("\n=== GITHUB TRENDING DEVS (LIVE) ===");
    const devRes = await fetch("https://github.com/trending/developers");
    const devHtml = await devRes.text();
    const $d = cheerio.load(devHtml);
    const liveDevs = [];
    $d("article.Box-row").each((i, el) => {
        if (i >= 5) return;
        const nameEl = $d(el).find("h1.h3.lh-condensed a");
        const handleEl = $d(el).find("p.f4.text-normal.mb-1 a");
        const name = nameEl.text().trim() || handleEl.text().trim();
        liveDevs.push(name);
    });
    liveDevs.forEach((d, i) => console.log(`  ${i+1}. ${d}`));

    // now fetch our gitpulse scraper output
    console.log("\n=== GITPULSE TRENDING REPOS (OUR SCRAPER) ===");
    const gpRes = await fetch("http://localhost:3000");
    const gpHtml = await gpRes.text();
    const $gp = cheerio.load(gpHtml);
    // look for the trending card content via text patterns
    const trendingText = $gp("body").text();
    // extract repo names from the trending sidebar
    const repoPattern = /([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)/g;
    const gpRepoMatches = [];
    // find the trending section in the DOM
    $gp('[class*="trending"], [class*="Trending"]').each((i, el) => {
        const t = $gp(el).text();
        console.log("  Found trending section text snippet:", t.substring(0, 200));
    });

    console.log("\nDone. Compare the lists above manually.");
}

compareTrending().catch(console.error);
