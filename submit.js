/* THE UNDERWEB — submissions
   links and 88x31/88x32 buttons go to the on-site submission endpoints.
   Those endpoints file the review queue internally; visitors never need to
   leave the site. */
(function () {
    'use strict';

    function isHttp(v) {
        try { var u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; }
        catch (e) { return false; }
    }

    function val(form, id) {
        var el = form.querySelector('#' + id);
        return el ? el.value.trim() : '';
    }

    var linkForm = document.getElementById('link-submit-form');
    if (linkForm) {
        var linkErr = linkForm.querySelector('.form-error');
        var linkDone = linkForm.parentElement.querySelector('.submit-done');
        var linkBtn = linkForm.querySelector('button[type="submit"]');
        linkForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = val(linkForm, 'site-name'), url = val(linkForm, 'site-url'),
                desc = val(linkForm, 'site-description'), cat = val(linkForm, 'site-category');
            var error = !name ? ['Give the site a name.', 'site-name'] :
                !isHttp(url) ? ['The url needs to start with http:// or https://.', 'site-url'] :
                !desc ? ['Say what the site is in one line.', 'site-description'] :
                !cat ? ['Choose a stratum.', 'site-category'] : null;
            if (error) {
                linkErr.textContent = error[0]; linkErr.hidden = false;
                linkForm.querySelector('#' + error[1]).focus();
                return;
            }
            linkErr.hidden = true; linkBtn.disabled = true; linkBtn.textContent = 'sending…';
            fetch('/api/submit-link', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name, url: url, description: desc, category: cat,
                    tags: val(linkForm, 'site-tags'), website: val(linkForm, 'website')
                })
            }).then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (body) {
                    if (!res.ok) throw new Error(body.error || 'The submission failed. Nothing was sent.');
                });
            }).then(function () {
                linkDone.innerHTML = '';
                var p = document.createElement('p');
                p.textContent = 'Received. Your link is waiting for a curator and will appear in the directory if it is approved.';
                var again = document.createElement('button');
                again.type = 'button'; again.className = 'btn ghost'; again.textContent = 'send another';
                again.addEventListener('click', function () { linkForm.reset(); linkDone.hidden = true; linkForm.hidden = false; });
                linkDone.appendChild(p); linkDone.appendChild(again);
                linkForm.hidden = true; linkDone.hidden = false;
            }).catch(function (err) {
                linkErr.textContent = err instanceof TypeError ? 'Could not reach the server. Nothing was sent.' : err.message;
                linkErr.hidden = false;
            }).then(function () { linkBtn.disabled = false; linkBtn.textContent = 'send link ↓'; });
        });
    }

    // Keep the image upload on the same page as the link submission.
    var imageForm = document.getElementById('image-submit-form');
    if (imageForm) {
        var MAX_BYTES = 256 * 1024;
        var fileInput = imageForm.querySelector('#image-file');
        var preview = imageForm.querySelector('#image-preview');
        var previewImg = preview.querySelector('img');
        var previewText = preview.querySelector('span');
        var imageErr = imageForm.querySelector('.form-error');
        var imageDone = imageForm.parentElement.querySelector('.submit-done');
        var sendBtn = imageForm.querySelector('button[type="submit"]');
        var checked = null, previewUrl = null;

        var showError = function (message, focusId) {
            imageErr.textContent = message; imageErr.hidden = false;
            var f = focusId && imageForm.querySelector('#' + focusId); if (f) f.focus();
        };
        var clearPreview = function () {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            previewUrl = null; checked = null; preview.hidden = true; previewImg.removeAttribute('src');
        };

        fileInput.addEventListener('change', function () {
            clearPreview(); imageErr.hidden = true;
            var file = fileInput.files[0];
            if (!file) return;
            if (['image/gif', 'image/png'].indexOf(file.type) < 0) { fileInput.value = ''; return showError('The file must be a GIF or PNG.', 'image-file'); }
            if (file.size > MAX_BYTES) { fileInput.value = ''; return showError('The file must be under 256 KB.', 'image-file'); }
            var url = URL.createObjectURL(file), probe = new Image();
            probe.onload = function () {
                if (probe.naturalWidth !== 88 || [31, 32].indexOf(probe.naturalHeight) < 0) {
                    URL.revokeObjectURL(url); fileInput.value = '';
                    return showError('The image must be 88×31 or 88×32 pixels. This one is ' + probe.naturalWidth + '×' + probe.naturalHeight + '.', 'image-file');
                }
                previewUrl = url; checked = file; previewImg.src = url;
                previewText.textContent = '88×' + probe.naturalHeight + ' ✓'; preview.hidden = false;
            };
            probe.onerror = function () { URL.revokeObjectURL(url); fileInput.value = ''; showError('That file could not be read as an image.', 'image-file'); };
            probe.src = url;
        });

        var toBase64 = function (file) {
            return new Promise(function (resolve, reject) {
                var reader = new FileReader();
                reader.onload = function () { resolve(String(reader.result).split(',')[1]); };
                reader.onerror = function () { reject(new Error('read failed')); };
                reader.readAsDataURL(file);
            });
        };

        imageForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var link = val(imageForm, 'site-link'), alt = val(imageForm, 'alt-text');
            if (!checked) return showError('Choose an 88×31 or 88×32 GIF or PNG.', 'image-file');
            if (!isHttp(link)) return showError('Add the site the button belongs to (http:// or https://).', 'site-link');
            if (!alt) return showError('Describe the button in a few words.', 'alt-text');
            imageErr.hidden = true; sendBtn.disabled = true; sendBtn.textContent = 'sending…';
            toBase64(checked).then(function (fileBase64) {
                return fetch('/api/submit-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileBase64: fileBase64, siteLink: link, alt: alt, tags: val(imageForm, 'tags'), website: val(imageForm, 'website') })
                });
            }).then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (body) {
                    if (!res.ok) throw new Error(body.error || 'The upload failed. Nothing was sent.');
                });
            }).then(function () {
                imageDone.innerHTML = '';
                var p = document.createElement('p');
                p.textContent = 'Received. Your button is waiting for a curator and will appear on the site if it is approved.';
                var again = document.createElement('button');
                again.type = 'button'; again.className = 'btn ghost'; again.textContent = 'send another';
                again.addEventListener('click', function () { imageForm.reset(); clearPreview(); imageDone.hidden = true; imageForm.hidden = false; });
                imageDone.appendChild(p); imageDone.appendChild(again);
                imageForm.hidden = true; imageDone.hidden = false;
            }).catch(function (err) {
                showError(err instanceof TypeError ? 'Could not reach the server. Nothing was sent.' : err.message);
            }).then(function () {
                sendBtn.disabled = false; sendBtn.textContent = 'send button ↓';
            });
        });
    }

    // arriving via submit.html#link or #image: move focus to that form
    var target = location.hash && document.querySelector(location.hash + ' input');
    if (target) setTimeout(function () { target.focus({ preventScroll: false }); }, 50);
})();
