// Turns an approved submission issue into a real entry on the site.
// Run by .github/workflows/publish-submission.yml when an issue gets the "approved" label.
// Reads the issue from env, validates it, appends to links-data.js or images-data.js,
// and (for images) downloads the file into img/submissions/ so the site never hotlinks.
'use strict';
const fs = require('fs');
const path = require('path');
const net = require('net');

const ROOT = path.resolve(__dirname, '..', '..');
const CATS = ['art', 'curiosities', 'tools', 'forums', 'archives'];
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = { 'image/gif': 'gif', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const IMAGE_ACCEPT = 'image/gif,image/png,image/jpeg,image/webp,application/octet-stream;q=0.8,*/*;q=0.1';

function fail(msg) {
    fs.writeFileSync(path.join(ROOT, '.publish-error'), msg + '\n');
    console.error(msg);
    process.exit(1);
}

// issue forms render as "### Label\n\nvalue" blocks
function parseForm(body) {
    const out = {};
    const parts = String(body || '').split(/^###\s+/m).slice(1);
    for (const part of parts) {
        const nl = part.indexOf('\n');
        const label = part.slice(0, nl).trim().toLowerCase();
        let value = part.slice(nl + 1).trim();
        if (value === '_No response_') value = '';
        out[label] = value;
    }
    return out;
}

function httpUrl(s) {
    try {
        const u = new URL(String(s).trim());
        const allowPrivate = process.env.PUBLISHER_TEST_ALLOW_PRIVATE_HOSTS === '1';
        return /^https?:$/.test(u.protocol) && !u.username && !u.password && (allowPrivate || !privateHost(u.hostname)) ? u.href : null;
    } catch (e) { return null; }
}

function privateHost(hostname) {
    const host = String(hostname || '').toLowerCase().replace(/\.$/, '');
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host === 'metadata.google.internal') return true;
    if (net.isIP(host) === 4) {
        const octets = host.split('.').map(Number);
        return octets[0] === 0 || octets[0] === 10 || octets[0] === 127 ||
            (octets[0] === 169 && octets[1] === 254) ||
            (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
            (octets[0] === 192 && octets[1] === 168);
    }
    return net.isIP(host) === 6 && (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:'));
}

function tagsOf(s) {
    return String(s || '').split(',')
        .map(t => t.trim().toLowerCase().replace(/^#/, '').replace(/[^a-z0-9\-]/g, ''))
        .filter(Boolean).slice(0, 6);
}

function clean(s, max) {
    return String(s || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function today() { return new Date().toISOString().slice(0, 10); }

// append one object to the `window.X = [ ... ];` array at the end of a data file
function appendEntry(file, globalName, entry) {
    const full = path.join(ROOT, file);
    const src = fs.readFileSync(full, 'utf8');
    const json = JSON.stringify(entry);
    const empty = new RegExp('(window\\.' + globalName + '\\s*=\\s*\\[)\\s*\\];\\s*$');
    let next;
    if (empty.test(src)) next = src.replace(empty, '$1\n    ' + json + '\n];\n');
    else if (/\}\s*\n\];\s*$/.test(src)) next = src.replace(/\}\s*\n\];\s*$/, '},\n    ' + json + '\n];\n');
    else throw new Error('Could not find the end of the ' + globalName + ' array in ' + file + '.');
    fs.writeFileSync(full, next);
}

// existing URLs, read as text (never execute the data file)
function existingUrls(file) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    return Array.from(src.matchAll(/"url"\s*:\s*"([^"]+)"/g), m => m[1]);
}

function existingImageIssue(issue) {
    const src = fs.readFileSync(path.join(ROOT, 'images-data.js'), 'utf8');
    return new RegExp('"issue"\\s*:\\s*' + String(issue) + '(?:\\D|$)').test(src);
}

function firstImageUrl(text) {
    const md = /!\[[^\]]*\]\((\S+?)\)/.exec(text);
    if (md) return md[1];
    const tag = /<img[^>]+src="([^"]+)"/i.exec(text);
    if (tag) return tag[1];
    const bare = /https?:\/\/\S+/.exec(text);
    return bare ? bare[0].replace(/[)>\]]+$/, '') : null;
}

async function publishLink(f, issue) {
    const url = httpUrl(f['url']);
    const name = clean(f['site name'], 80);
    const desc = clean(f['what is it?'], 220);
    const cat = clean(f['stratum'], 20).toLowerCase();
    if (!name) fail('The site name is empty.');
    if (!url) fail('The URL is missing or is not an http(s) address.');
    if (!desc) fail('The description is empty.');
    if (!CATS.includes(cat)) fail('Stratum must be one of: ' + CATS.join(', ') + '.');
    const norm = u => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '').toLowerCase();
    if (existingUrls('links-data.js').some(u => norm(u) === norm(url))) {
        fail('That site is already in the directory.');
    }
    appendEntry('links-data.js', 'UNDERWEB_LINKS', {
        name, url, cat, added: today(), desc, tags: tagsOf(f['tags']), issue
    });
    return 'Added **' + name + '** to the directory: https://obscuraweb.vercel.app/links.html';
}

async function publishImage(f, issue) {
    if (existingImageIssue(issue)) {
        return 'This image submission was already published: https://obscuraweb.vercel.app/#feed';
    }
    const imgUrl = httpUrl(firstImageUrl(f['image'] || '') || '');
    const link = httpUrl(f['the site it belongs to']);
    const alt = clean(f['describe the image'], 160);
    if (!imgUrl) fail('No image URL or attached image was found in the Image field.');
    if (!link) fail('The site link is missing or is not an http(s) address.');
    if (!alt) fail('The image description (alt text) is empty.');

    let res;
    try {
        res = await fetch(imgUrl, {
            redirect: 'follow',
            signal: AbortSignal.timeout(30_000),
            headers: {
                'User-Agent': 'underweb-publisher/1.0 (+https://github.com/numbpill3d/obscuraweb)',
                Accept: IMAGE_ACCEPT
            }
        });
    } catch (e) {
        const reason = e && e.name === 'TimeoutError' ? 'timed out after 30 seconds' : (e.message || String(e));
        fail('Could not download the image from ' + imgUrl + ': ' + reason);
    }
    if (!res.ok) fail('Could not download the image (HTTP ' + res.status + ').');
    const finalUrl = httpUrl(res.url);
    if (!finalUrl) fail('The image redirected to an unsafe or unsupported address.');
    if (Number(res.headers.get('content-length')) > MAX_BYTES) fail('The image is larger than 5 MB.');
    let buf;
    try { buf = await readImageBody(res); }
    catch (e) { fail(e.message || String(e)); }

    const type = String(res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const detected = sniffImage(buf);
    const ext = detected || TYPES[type];
    if (!ext) fail('The image must be a GIF, PNG, JPG or WebP (got "' + (type || 'unknown') + '").');

    const rel = 'img/submissions/issue-' + issue + '.' + ext;
    const imagePath = path.join(ROOT, rel);
    try {
        fs.writeFileSync(imagePath, buf, { flag: 'wx' });
        appendEntry('images-data.js', 'UNDERWEB_IMAGES', {
            src: rel, link, alt, tags: tagsOf(f['tags']), added: today(), issue
        });
    } catch (e) {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        fail('Could not save the published image: ' + (e.message || String(e)));
    }
    return 'Added the image to the transmissions feed: https://obscuraweb.vercel.app/#feed';
}

async function readImageBody(res) {
    if (!res.body || typeof res.body.getReader !== 'function') {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > MAX_BYTES) throw new Error('The image is larger than 5 MB.');
        return buf;
    }
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    try {
        while (true) {
            const part = await reader.read();
            if (part.done) break;
            total += part.value.byteLength;
            if (total > MAX_BYTES) {
                await reader.cancel();
                throw new Error('The image is larger than 5 MB.');
            }
            chunks.push(Buffer.from(part.value));
        }
    } catch (e) {
        try { await reader.cancel(); } catch (_) { /* already closed */ }
        throw e;
    }
    return Buffer.concat(chunks, total);
}

function sniffImage(buf) {
    if (buf.subarray(0, 6).toString() === 'GIF87a' || buf.subarray(0, 6).toString() === 'GIF89a') return 'gif';
    if (buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
    if (buf.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return 'jpg';
    if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
    return null;
}

(async () => {
    const issue = parseInt(process.env.ISSUE_NUMBER, 10);
    const labels = JSON.parse(process.env.ISSUE_LABELS || '[]').map(l => (l.name || l).toLowerCase());
    const f = parseForm(process.env.ISSUE_BODY);
    let msg;
    if (labels.includes('link')) msg = await publishLink(f, issue);
    else if (labels.includes('image')) msg = await publishImage(f, issue);
    else fail('This issue has neither the "link" nor the "image" label, so it was not made from a submission form.');
    fs.writeFileSync(path.join(ROOT, '.publish-result'), msg + '\n');
    console.log(msg);
})();
