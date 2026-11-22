// THE UNDERWEB — on-site 88x31 button submissions.
// Validates the upload, stores it on the non-deploying pending-submissions branch,
// and files a review issue in the shape publish-submission.cjs already reads.
// Nothing reaches the site until a curator adds the "approved" label.
// Needs GITHUB_SUBMIT_TOKEN: fine-grained, this repo only, Contents + Issues read/write.
'use strict';
const crypto = require('crypto');

const REPO = 'numbpill3d/obscuraweb';
const BRANCH = 'pending-submissions';
const API = 'https://api.github.com/repos/' + REPO;
const WIDTH = 88;
const HEIGHT = 31;
const MAX_BYTES = 256 * 1024;
const MAX_PENDING = 50;
const ORIGINS = ['https://obscuraweb.vercel.app'];

function imageInfo(buf) {
    const sig = buf.subarray(0, 6).toString('latin1');
    if ((sig === 'GIF87a' || sig === 'GIF89a') && buf.length >= 10) {
        return { ext: 'gif', width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (buf.length >= 24 && buf.subarray(0, 8).equals(png) && buf.subarray(12, 16).toString('latin1') === 'IHDR') {
        return { ext: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    return null;
}

function siteUrl(value) {
    try {
        const u = new URL(String(value || '').trim());
        if (!/^https?:$/.test(u.protocol) || u.username || u.password || u.href.length > 500) return null;
        return u.href;
    } catch (e) { return null; }
}

// one line, with no markdown or @mentions that could act on the review issue
function plain(value, max) {
    return String(value || '').replace(/[\r\n]+/g, ' ').replace(/[`<>[\]@]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function tagList(value) {
    return String(value || '').split(',')
        .map(t => t.trim().toLowerCase().replace(/^#/, '').replace(/[^a-z0-9-]/g, ''))
        .filter(Boolean).slice(0, 6).join(', ');
}

function decode(value) {
    const text = String(value || '');
    if (!text || text.length > Math.ceil(MAX_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(text)) return null;
    return Buffer.from(text, 'base64');
}

async function github(token, path, options) {
    return fetch(API + path, {
        ...options,
        signal: AbortSignal.timeout(8000),
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
            'User-Agent': 'underweb-submissions',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
}

module.exports = async function handler(req, res) {
    const send = (status, body) => res.status(status).json(body);
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return send(405, { error: 'Use the form on the submit page.' });
    }
    const origin = req.headers.origin;
    if (origin && !ORIGINS.includes(origin)) return send(403, { error: 'Submissions are only accepted from the site.' });

    const data = req.body && typeof req.body === 'object' ? req.body : {};
    // bots fill the hidden field: accept quietly and store nothing
    if (data.website) return send(200, { ok: true });

    const file = decode(data.fileBase64);
    if (!file) return send(400, { error: 'Choose a GIF or PNG under 256 KB.' });
    const info = imageInfo(file);
    if (!info) return send(400, { error: 'The file must be a GIF or PNG.' });
    if (info.width !== WIDTH || info.height !== HEIGHT) {
        return send(400, { error: 'The image must be exactly 88×31 pixels. This one is ' + info.width + '×' + info.height + '.' });
    }
    const link = siteUrl(data.siteLink);
    if (!link) return send(400, { error: 'Add the site the button belongs to (http:// or https://).' });
    const alt = plain(data.alt, 160);
    if (!alt) return send(400, { error: 'Describe the button in a few words.' });

    const token = process.env.GITHUB_SUBMIT_TOKEN;
    if (!token) return send(503, { error: 'Uploads are not switched on yet. Nothing was sent.' });

    try {
        const queue = await github(token, '/issues?state=open&labels=submission,image&per_page=100');
        if (!queue.ok) throw new Error('queue ' + queue.status);
        const open = await queue.json();
        if (open.length >= MAX_PENDING) return send(429, { error: 'The review queue is full. Try again later.' });

        const name = crypto.createHash('sha256').update(file).digest('hex').slice(0, 24) + '.' + info.ext;
        if (open.some(i => String(i.body || '').includes(name))) {
            return send(409, { error: 'This button is already waiting for review.' });
        }

        const stored = await github(token, '/contents/pending/' + name, {
            method: 'PUT',
            body: JSON.stringify({ message: 'pending submission ' + name, content: file.toString('base64'), branch: BRANCH })
        });
        // 422 means this exact file is already stored from an earlier attempt
        if (!stored.ok && stored.status !== 422) throw new Error('store ' + stored.status);

        const raw = 'https://raw.githubusercontent.com/' + REPO + '/' + BRANCH + '/pending/' + name;
        const host = new URL(link).hostname.replace(/^www\./, '');
        const issue = await github(token, '/issues', {
            method: 'POST',
            body: JSON.stringify({
                title: '[image] ' + host,
                labels: ['submission', 'image'],
                body: [
                    '### Image', '', '![88x31 submission](' + raw + ')', '',
                    '### The site it belongs to', '', link, '',
                    '### Describe the image', '', alt, '',
                    '### Tags', '', tagList(data.tags) || '_No response_'
                ].join('\n')
            })
        });
        if (!issue.ok) throw new Error('issue ' + issue.status);
        return send(201, { ok: true });
    } catch (e) {
        console.error('submit-image failed:', e.message);
        return send(502, { error: 'The upload failed and nothing was queued. Try again in a minute.' });
    }
};
