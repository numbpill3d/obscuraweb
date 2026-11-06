// Checks every URL in links-data.js and writes a markdown report of the dead ones.
// Run weekly by .github/workflows/check-links.yml. Exit code is always 0; the
// workflow decides what to do from .link-report.md (absent = everything is alive).
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
// these mean "a bot wall answered", not "the site is gone"
const BLOCKED = new Set([401, 403, 429, 999]);

function entries() {
    const src = fs.readFileSync(path.join(ROOT, 'links-data.js'), 'utf8');
    const out = [];
    const re = /"name"\s*:\s*"([^"]+)"\s*,\s*"url"\s*:\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(src))) out.push({ name: m[1], url: m[2] });
    return out;
}

async function probe(url) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 20000);
    try {
        const r = await fetch(url, { redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,*/*' } });
        return { status: r.status, final: r.url };
    } catch (e) {
        return { status: 0, error: (e.cause && e.cause.code) || e.name || String(e) };
    } finally { clearTimeout(t); }
}

async function check(url) {
    let r;
    for (let i = 0; i < 3; i++) {
        r = await probe(url);
        if (r.status && r.status < 500) return r;
        await new Promise(res => setTimeout(res, 4000 * (i + 1)));
    }
    return r;
}

(async () => {
    const list = entries();
    const dead = [], moved = [], blocked = [];
    for (const e of list) {
        const r = await check(e.url);
        if (r.status >= 200 && r.status < 400) {
            const a = e.url.replace(/\/+$/, ''), b = (r.final || '').replace(/\/+$/, '');
            if (b && a !== b) moved.push(`- **${e.name}**: ${e.url} → ${r.final}`);
        } else if (BLOCKED.has(r.status)) {
            blocked.push(`- ${e.name}: HTTP ${r.status} (bot check, probably fine)`);
        } else {
            dead.push(`- [ ] **${e.name}**: ${e.url} (${r.status ? 'HTTP ' + r.status : r.error})`);
        }
        console.log(r.status || r.error, e.url);
    }
    const report = path.join(ROOT, '.link-report.md');
    if (!dead.length && !moved.length) { if (fs.existsSync(report)) fs.unlinkSync(report); return; }
    const parts = [`Weekly check of ${list.length} directory links.`];
    if (dead.length) parts.push('', '### Not responding after 3 tries', 'Fix the URL in `links-data.js` or remove the entry.', ...dead);
    if (moved.length) parts.push('', '### Moved (update to the new address)', ...moved);
    if (blocked.length) parts.push('', '<details><summary>Blocked by a bot check (not counted as dead)</summary>', '', ...blocked, '</details>');
    fs.writeFileSync(report, parts.join('\n') + '\n');
})();
