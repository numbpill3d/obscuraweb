/* THE UNDERWEB — shared page chrome
   stars, depth gauge, clock, hit counter, pixel sigils, copy buttons.
   no dependencies. safe to load on every page. */
(function () {
    'use strict';
    var doc = document, root = doc.documentElement;
    root.classList.add('js');

    var PAL = {
        void: '#000000', ink: '#0e001a', bruise: '#22003a', violet: '#3e066e',
        amethyst: '#6e1cbe', lilac: '#a048ff', lavender: '#d6a0ff', bone: '#f8ecff', hot: '#ff5ae6'
    };
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- seeded rng ----------
    function hash(str) {
        var h = 1779033703 ^ str.length;
        for (var i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        return function () {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return ((h ^= h >>> 16) >>> 0) / 4294967296;
        };
    }

    // ---------- pixel sigils: a little generated picture per site / person ----------
    function sigil(canvas, seed, mode) {
        var rnd = hash(seed || 'underweb');
        var ctx = canvas.getContext('2d');
        var px = function (x, y, c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };

        if (mode === 'face') {
            var n = 12;
            canvas.width = n; canvas.height = n;
            ctx.fillStyle = PAL.void; ctx.fillRect(0, 0, n, n);
            var body = [PAL.amethyst, PAL.lilac, PAL.violet][Math.floor(rnd() * 3)];
            for (var y = 1; y < n - 1; y++) {
                for (var x = 1; x < n / 2; x++) {
                    var edge = Math.abs(y - n / 2) / (n / 2) + (n / 2 - x) / (n / 2) * 0.5;
                    if (rnd() > 0.35 + edge * 0.35) {
                        var c = rnd() > 0.85 ? PAL.lavender : body;
                        px(x, y, c); px(n - 1 - x, y, c);
                    }
                }
            }
            var ey = 4 + Math.floor(rnd() * 3);
            px(4, ey, PAL.bone); px(7, ey, PAL.bone);
            if (rnd() > 0.5) { px(4, ey, PAL.hot); px(7, ey, PAL.hot); }
            return;
        }

        // 'card' — a tiny landscape: sky, horizon grid, a mirrored glyph hovering over it
        var W = 64, H = 32;
        canvas.width = W; canvas.height = H;
        var hz = 18 + Math.floor(rnd() * 6);
        for (var yy = 0; yy < H; yy++) {
            for (var xx = 0; xx < W; xx++) {
                var t = yy / hz, bay = ((xx & 1) * 2 + (yy & 1) * 3) % 4 / 4;
                var col = yy < hz ? (t > 0.85 + bay * 0.3 ? PAL.bruise : (t > 0.4 + bay * 0.4 ? PAL.ink : PAL.void)) : PAL.void;
                px(xx, yy, col);
            }
        }
        for (var s = 0; s < 14; s++) px(Math.floor(rnd() * W), Math.floor(rnd() * (hz - 2)), rnd() > 0.7 ? PAL.lavender : PAL.amethyst);
        // perspective floor: rays from a vanishing point + receding cross lines
        for (var gx = -6; gx <= 6; gx++) {
            var x0 = W / 2 + gx * 2, x1 = W / 2 + gx * 13, steps = H - hz;
            for (var st = 0; st <= steps; st++) px(Math.round(x0 + (x1 - x0) * st / steps), hz + st, PAL.violet);
        }
        for (var k = 0; k < 4; k++) {
            var ly = Math.round(hz + Math.pow(k + 0.6, 1.7) * 1.4);
            if (ly < H) { ctx.fillStyle = PAL.violet; ctx.fillRect(0, ly, W, 1); }
        }
        ctx.fillStyle = PAL.amethyst; ctx.fillRect(0, hz, W, 1);
        // glyph
        var g = 9, ox = Math.floor(W / 2 - g / 2) + Math.floor((rnd() - 0.5) * 20), oy = hz - g - 2;
        var gc = [PAL.lilac, PAL.lavender, PAL.hot][Math.floor(rnd() * 2.4)];
        for (var a = 0; a < g; a++) {
            for (var b = 0; b <= g / 2; b++) {
                if (rnd() > 0.48) { px(ox + b, oy + a, gc); px(ox + g - 1 - b, oy + a, gc); }
            }
        }
        // glow under it
        for (var r = 0; r < g + 4; r++) if (rnd() > 0.3) px(ox - 2 + r, hz + 1, PAL.amethyst);
    }

    function drawSigils() {
        doc.querySelectorAll('canvas[data-sigil]').forEach(function (cv) {
            sigil(cv, cv.getAttribute('data-sigil'), cv.getAttribute('data-mode') || 'card');
        });
    }

    // ---------- stars ----------
    function stars() {
        var box = doc.getElementById('stars');
        if (!box || box.childElementCount) return;
        var rnd = hash('stars' + location.pathname);
        var frag = doc.createDocumentFragment();
        for (var i = 0; i < 110; i++) {
            var s = doc.createElement('i');
            s.className = 'star' + (rnd() > 0.7 ? ' s2' : '');
            var size = rnd() > 0.85 ? 2 : 1;
            s.style.width = s.style.height = size + 'px';
            s.style.left = (rnd() * 100).toFixed(2) + '%';
            s.style.top = (rnd() * 100).toFixed(2) + '%';
            s.style.animationDelay = (rnd() * 3).toFixed(2) + 's';
            frag.appendChild(s);
        }
        box.appendChild(frag);
    }

    // ---------- depth gauge ----------
    function gauge() {
        var base = parseInt(doc.body.getAttribute('data-depth') || '0', 10);
        var range = parseInt(doc.body.getAttribute('data-range') || '120', 10);
        var g = doc.createElement('aside');
        g.className = 'depth-gauge'; g.setAttribute('aria-hidden', 'true');
        g.innerHTML = '<span>0m</span><div class="rail"><div class="bob"></div></div><span class="reading"></span>';
        doc.body.appendChild(g);
        var bob = g.querySelector('.bob'), reading = g.querySelector('.reading'), rail = g.querySelector('.rail');
        var statusDepth = doc.querySelector('[data-depth-readout]');
        function upd() {
            var max = Math.max(1, doc.documentElement.scrollHeight - innerHeight);
            var f = Math.min(1, Math.max(0, scrollY / max));
            var d = base + Math.round(f * range);
            var txt = '-' + String(d).padStart(3, '0') + 'm';
            reading.textContent = txt;
            if (statusDepth) statusDepth.textContent = txt;
            bob.style.top = Math.round(f * (rail.clientHeight - 6)) + 'px';
        }
        addEventListener('scroll', upd, { passive: true });
        addEventListener('resize', upd);
        upd();
    }

    // ---------- clock ----------
    function clock() {
        var els = doc.querySelectorAll('[data-clock]');
        if (!els.length) return;
        function tick() {
            var d = new Date();
            var t = [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (n) { return String(n).padStart(2, '0'); }).join(':');
            els.forEach(function (e) { e.textContent = t; });
        }
        tick(); setInterval(tick, 1000);
    }

    // ---------- hit counter (local, honest about it) ----------
    function counter() {
        var el = doc.querySelector('[data-counter]');
        if (!el) return;
        var n = parseInt(el.getAttribute('data-counter'), 10) || 0;
        try {
            var k = 'underweb_visits';
            var v = (parseInt(localStorage.getItem(k), 10) || 0) + 1;
            localStorage.setItem(k, v);
            n += v;
        } catch (e) { /* storage blocked: show the base */ }
        var s = String(n).padStart(9, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        el.innerHTML = s.split('').map(function (c) {
            return c === ',' ? '<span class="d sep">,</span>' : '<span class="d">' + c + '</span>';
        }).join('');
    }

    // ---------- copy buttons ----------
    function copyButtons() {
        doc.querySelectorAll('[data-copy]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var src = doc.querySelector(btn.getAttribute('data-copy'));
                if (!src) return;
                var text = src.value || src.textContent;
                var done = function () {
                    var old = btn.textContent; btn.textContent = 'copied ✓';
                    setTimeout(function () { btn.textContent = old; }, 1400);
                };
                if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { src.select && src.select(); });
                else { src.select && src.select(); try { doc.execCommand('copy'); done(); } catch (e) {} }
            });
        });
    }

    // ---------- current nav tab ----------
    function navState() {
        var page = doc.body.getAttribute('data-page');
        doc.querySelectorAll('.tabs a').forEach(function (a) {
            if (a.getAttribute('data-page') === page) a.setAttribute('aria-current', 'page');
        });
    }

    // ---------- ticker: clone once for a seamless loop ----------
    function ticker() {
        doc.querySelectorAll('.ticker-track').forEach(function (t) {
            if (t.children.length === 1) {
                var c = t.children[0].cloneNode(true); c.setAttribute('aria-hidden', 'true'); t.appendChild(c);
            }
        });
    }

    // ---------- random site ----------
    function randomSite() {
        doc.querySelectorAll('[data-random-site]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                var list = (window.UNDERWEB_LINKS || []).filter(function (l) { return l.url && l.url !== '#'; });
                e.preventDefault();
                if (list.length) window.open(list[Math.floor(Math.random() * list.length)].url, '_blank', 'noopener');
                else location.href = 'links.html';
            });
        });
    }

    // ---------- embed snippets: fill in this site's real address ----------
    function embeds() {
        var origin = /^https?:/.test(location.protocol) ? location.origin : 'https://obscuraweb.vercel.app';
        doc.querySelectorAll('textarea[data-template]').forEach(function (t) {
            t.value = t.getAttribute('data-template').replace(/\{origin\}/g, origin);
        });
    }

    window.UW = { sigil: sigil, drawSigils: drawSigils, hash: hash, PAL: PAL, reduced: reduced };

    function boot() {
        embeds(); stars(); gauge(); clock(); counter(); copyButtons(); navState(); ticker(); randomSite(); drawSigils();
    }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
