/* THE UNDERWEB — home page
   renders approved image transmissions from images-data.js into the feed and
   the widget preview. empty means empty: nothing is invented to fill space. */
(function () {
    'use strict';
    var IMAGES = (window.UNDERWEB_IMAGES || []).slice().sort(function (a, b) {
        return String(b.added || '').localeCompare(String(a.added || '')) || (b.issue || 0) - (a.issue || 0);
    });

    function item(img) {
        var wrap = document.createElement('div');
        wrap.className = 'image-item';
        var a = document.createElement('a');
        a.href = img.link; a.target = '_blank'; a.rel = 'noopener';
        var el = document.createElement('img');
        el.src = img.src; el.alt = img.alt || ''; el.loading = 'lazy';
        a.appendChild(el);
        var tags = document.createElement('div');
        tags.className = 'tags';
        tags.textContent = (img.tags || []).map(function (t) { return '#' + t; }).join(' ');
        wrap.appendChild(a); wrap.appendChild(tags);
        return wrap;
    }

    function empty(text) {
        var p = document.createElement('p');
        p.className = 'feed-empty';
        p.appendChild(document.createTextNode(text));
        var a = document.createElement('a');
        a.href = 'submit.html#image'; a.textContent = 'send the first one →';
        p.appendChild(a);
        return p;
    }

    var feed = document.getElementById('image-feed');
    if (feed) {
        if (IMAGES.length) IMAGES.forEach(function (img) { feed.appendChild(item(img)); });
        else feed.appendChild(empty('No transmissions have been approved yet.'));
    }

    var strip = document.getElementById('widget-strip');
    if (strip) {
        if (IMAGES.length) {
            strip.className = 'widget-strip';
            IMAGES.slice().sort(function () { return 0.5 - Math.random(); }).slice(0, 5).forEach(function (img) {
                var a = document.createElement('a');
                a.href = img.link; a.target = '_blank'; a.rel = 'noopener';
                var el = document.createElement('img');
                el.src = img.src; el.alt = img.alt || ''; el.className = 'widget-image';
                a.appendChild(el); strip.appendChild(a);
            });
        } else {
            strip.appendChild(empty('The widget fills up as transmissions are approved.'));
        }
    }

    var copy = document.getElementById('copy-embed'), code = document.getElementById('embed-code'),
        help = document.getElementById('embed-instructions');
    if (copy && code) {
        copy.addEventListener('click', function () {
            var done = function () {
                copy.textContent = 'copied ✓';
                if (help) help.classList.remove('hidden');
                setTimeout(function () { copy.textContent = 'copy code'; }, 1400);
            };
            if (navigator.clipboard) navigator.clipboard.writeText(code.value).then(done, function () { code.select(); });
            else { code.select(); try { document.execCommand('copy'); done(); } catch (e) { /* select is enough */ } }
        });
    }
})();
