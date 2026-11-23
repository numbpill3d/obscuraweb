// THE UNDERWEB — on-site link submissions.
// The visitor submits here; the GitHub issue is only the private-to-the-site
// review queue used by the existing publisher workflow.
'use strict';

const REPO = 'numbpill3d/obscuraweb';
const API = 'https://api.github.com/repos/' + REPO;
const CATEGORIES = ['art', 'curiosities', 'tools', 'forums', 'archives'];
const MAX_PENDING = 100;
const ORIGINS = ['https://obscuraweb.vercel.app'];

function siteUrl(value) {
    try {
        const u = new URL(String(value || '').trim());
        if (!/^https?:$/.test(u.protocol) || u.username || u.password || u.href.length > 500) return null;
        return u.href;
    } catch (e) { return null; }
}

function plain(value, max) {
    return String(value || '').replace(/[\r\n]+/g, ' ').replace(/[`<>[\]@]/g, '')
        .replace(/\s+/g, ' ').trim().slice(0, max);
}

function tags(value) {
    return String(value || '').split(',')
        .map(t => t.trim().toLowerCase().replace(/^#/, '').replace(/[^a-z0-9-]/g, ''))
        .filter(Boolean).slice(0, 6).join(', ');
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
    if (data.website) return send(200, { ok: true });

    const name = plain(data.name, 80);
    const url = siteUrl(data.url);
    const description = plain(data.description, 220);
    const category = plain(data.category, 20).toLowerCase();
    if (!name) return send(400, { error: 'Give the site a name.' });
    if (!url) return send(400, { error: 'The url needs to start with http:// or https://.' });
    if (!description) return send(400, { error: 'Say what the site is in one line.' });
    if (!CATEGORIES.includes(category)) return send(400, { error: 'Choose a valid stratum.' });

    const token = process.env.GITHUB_SUBMIT_TOKEN;
    if (!token) return send(503, { error: 'Submissions are not switched on yet. Nothing was sent.' });

    try {
        const queue = await github(token, '/issues?state=open&labels=submission,link&per_page=100');
        if (!queue.ok) throw new Error('queue ' + queue.status);
        const open = await queue.json();
        if (open.length >= MAX_PENDING) return send(429, { error: 'The review queue is full. Try again later.' });
        if (open.some(issue => String(issue.body || '').includes(url))) {
            return send(409, { error: 'That link is already waiting for review.' });
        }

        const host = new URL(url).hostname.replace(/^www\./, '');
        const issue = await github(token, '/issues', {
            method: 'POST',
            body: JSON.stringify({
                title: '[link] ' + host,
                labels: ['submission', 'link'],
                body: [
                    '### Site name', '', name, '',
                    '### URL', '', url, '',
                    '### What is it?', '', description, '',
                    '### Stratum', '', category, '',
                    '### Tags', '', tags(data.tags) || '_No response_'
                ].join('\n')
            })
        });
        if (!issue.ok) throw new Error('issue ' + issue.status);
        return send(201, { ok: true });
    } catch (e) {
        console.error('submit-link failed:', e.message);
        return send(502, { error: 'The submission failed and nothing was queued. Try again in a minute.' });
    }
};
