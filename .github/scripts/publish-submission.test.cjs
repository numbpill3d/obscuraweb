'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const SOURCE = path.join(__dirname, 'publish-submission.cjs');
const DATA = path.resolve(__dirname, '..', '..', 'images-data.js');
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

function runPublisher(root, body, issue, allowPrivate = true) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [path.join(root, '.github/scripts/publish-submission.cjs')], {
            cwd: root,
            env: { ...process.env, PUBLISHER_TEST_ALLOW_PRIVATE_HOSTS: allowPrivate ? '1' : '0', ISSUE_NUMBER: String(issue), ISSUE_LABELS: JSON.stringify([{ name: 'image' }]), ISSUE_BODY: body },
            stdio: ['ignore', 'pipe', 'pipe']
        });
        let stdout = '', stderr = '';
        child.stdout.on('data', chunk => { stdout += chunk; });
        child.stderr.on('data', chunk => { stderr += chunk; });
        child.on('error', reject);
        child.on('close', code => resolve({ code, stdout, stderr }));
    });
}

function makeRoot() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'obscuraweb-publisher-'));
    fs.mkdirSync(path.join(root, '.github/scripts'), { recursive: true });
    fs.mkdirSync(path.join(root, 'img/submissions'), { recursive: true });
    fs.copyFileSync(SOURCE, path.join(root, '.github/scripts/publish-submission.cjs'));
    fs.copyFileSync(DATA, path.join(root, 'images-data.js'));
    return root;
}

function body(url) {
    return [
        '### Image', '', `![uploaded.png](${url})`,
        '### The site it belongs to', '', 'https://nolove.neocities.org',
        '### Describe the image', '', 'A test transmission',
        '### Tags', '', 'test, upload'
    ].join('\n');
}

async function main() {
    const server = http.createServer((req, res) => {
        if (req.url === '/redirect') {
            res.writeHead(302, { location: '/uploaded' });
            return res.end();
        }
        if (req.url === '/large') {
            res.writeHead(200, { 'content-type': 'application/octet-stream' });
            res.end(Buffer.alloc(5 * 1024 * 1024 + 1));
            return;
        }
        res.writeHead(200, { 'content-type': 'application/octet-stream' });
        res.end(PNG);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const root = makeRoot();
    try {
        const uploaded = `http://127.0.0.1:${port}/uploaded`;
        const success = await runPublisher(root, body(uploaded), 1001);
        assert.equal(success.code, 0, success.stderr);
        assert.match(success.stdout, /Added the image/);
        assert.ok(fs.existsSync(path.join(root, 'img/submissions/issue-1001.png')));

        const retry = await runPublisher(root, body(uploaded), 1001);
        assert.equal(retry.code, 0, retry.stderr);
        assert.match(retry.stdout, /already published/);
        assert.equal((fs.readFileSync(path.join(root, 'images-data.js'), 'utf8').match(/"issue":1001/g) || []).length, 1);

        const redirected = await runPublisher(root, body(`http://127.0.0.1:${port}/redirect`), 1004);
        assert.equal(redirected.code, 0, redirected.stderr);
        assert.ok(fs.existsSync(path.join(root, 'img/submissions/issue-1004.png')));

        const large = await runPublisher(root, body(`http://127.0.0.1:${port}/large`), 1002);
        assert.notEqual(large.code, 0);
        assert.match(large.stderr, /unsafe or unsupported|larger than 5 MB/);

        const blocked = await runPublisher(root, body('http://127.0.0.1:8080/image.png'), 1003, false);
        assert.notEqual(blocked.code, 0);
        assert.match(blocked.stderr, /No image URL/);

        const brokenRoot = makeRoot();
        fs.writeFileSync(path.join(brokenRoot, 'images-data.js'), 'window.UNDERWEB_IMAGES = not-an-array;\n');
        const broken = await runPublisher(brokenRoot, body(uploaded), 1005);
        assert.notEqual(broken.code, 0);
        assert.ok(!fs.existsSync(path.join(brokenRoot, 'img/submissions/issue-1005.png')));
        fs.rmSync(brokenRoot, { recursive: true, force: true });

        console.log('submission publisher end-to-end tests passed');
    } finally {
        server.close();
        fs.rmSync(root, { recursive: true, force: true });
    }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
