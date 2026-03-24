const fs = require('fs');

async function test() {
  try {
    const res = await fetch('https://github.com/HOLYKEYZ');
    let html = await res.text();
    fs.writeFileSync('C:/Users/USER/git-pulse/apps/web/test-profile.html', html);
    console.log("Wrote HTML to test-profile.html, length:", html.length);
  } catch (e) {
    console.error(e);
  }
}
test();
