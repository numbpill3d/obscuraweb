/* THE UNDERWEB — embeddable widget
   usage on any page:
     <div id="underweb-widget"></div><script src="https://<this site>/widget.js" async></script>
   shows up to five approved transmissions from images-data.js, each linking to its site.
   until any are approved it shows THE UNDERWEB's own 88x31 button and nothing else. */
(function () {
    'use strict';
    var BASE = (function () {
        try { var cs = document.currentScript; if (cs && cs.src) return new URL('.', cs.src).href; } catch (e) { /* ignore */ }
        return location.origin + '/';
    })();

    function abs(src) { try { return new URL(src, BASE).href; } catch (e) { return src; } }

    function render(images) {
        var boxes = document.querySelectorAll('#underweb-widget');
        boxes.forEach(function (box) {
            if (box.getAttribute('data-underweb-ready')) return;
            box.setAttribute('data-underweb-ready', '1');
            var strip = document.createElement('div');
            strip.className = 'underweb-widget-strip';
            strip.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px;background:#0e001a;border:2px solid #6e1cbe;';
            var pick = images.slice().sort(function () { return 0.5 - Math.random(); }).slice(0, 5);
            if (!pick.length) pick = [{ src: 'img/button-88x31.gif', link: BASE, alt: 'THE UNDERWEB' }];
            pick.forEach(function (img) {
                var a = document.createElement('a');
                a.href = img.link; a.target = '_blank'; a.rel = 'noopener';
                var el = document.createElement('img');
                el.src = abs(img.src); el.alt = img.alt || '';
                el.style.cssText = 'height:60px;width:auto;display:block;image-rendering:pixelated;';
                a.appendChild(el); strip.appendChild(a);
            });
            var credit = document.createElement('a');
            credit.href = BASE; credit.target = '_blank'; credit.rel = 'noopener';
            credit.textContent = 'THE UNDERWEB';
            credit.style.cssText = 'display:block;margin-top:4px;font:10px monospace;color:#d6a0ff;text-decoration:none;';
            box.appendChild(strip); box.appendChild(credit);
        });
    }

    if (window.UNDERWEB_IMAGES) { render(window.UNDERWEB_IMAGES); return; }
    var s = document.createElement('script');
    s.src = BASE + 'images-data.js';
    s.async = true;
    s.onload = function () { render(window.UNDERWEB_IMAGES || []); };
    s.onerror = function () { render([]); };
    document.head.appendChild(s);
})();
