/* THE UNDERWEB — submissions
   links open a prefilled GitHub issue. 88x31 and 88x32 buttons upload to /api/submit-image,
   which files the same kind of issue. a curator labels it "approved" and
   .github/workflows/publish-submission.yml puts it on the site. */
(function () {
    'use strict';
    var REPO = 'https://github.com/numbpill3d/obscuraweb';

    function isHttp(v) {
        try { var u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; }
        catch (e) { return false; }
    }

    function val(form, id) {
        var el = form.querySelector('#' + id);
        return el ? el.value.trim() : '';
    }

    function issueUrl(template, title, fields) {
        var q = new URLSearchParams();
        q.set('template', template);
        q.set('title', title);
        // GitHub issue forms use the `body[<field-id>]` query shape for
        // prefilled values. Using the field id by itself silently drops the
        // values when GitHub renders the form, which makes an otherwise valid
        // submission look empty (and is especially confusing for uploads).
        Object.keys(fields).forEach(function (k) {
            if (fields[k]) q.set('body[' + k + ']', fields[k]);
        });
        return REPO + '/issues/new?' + q.toString();
    }

    function build(form) {
        if (form.getAttribute('data-kind') === 'link') {
            var name = val(form, 'site-name'), url = val(form, 'site-url'),
                desc = val(form, 'site-description'), cat = val(form, 'site-category');
            if (!name) return { error: 'Give the site a name.', focus: 'site-name' };
            if (!isHttp(url)) return { error: 'The url needs to start with http:// or https://.', focus: 'site-url' };
            if (!desc) return { error: 'Say what the site is in one line.', focus: 'site-description' };
            if (!cat) return { error: 'Choose a stratum.', focus: 'site-category' };
            return { url: issueUrl(form.getAttribute('data-template'), '[link] ' + name, {
                'site-name': name, 'site-url': url, 'site-description': desc,
                'site-category': cat, 'site-tags': val(form, 'site-tags')
            }), what: 'link', attach: false };
        }
        return { error: 'Unknown form.' };
    }

    document.querySelectorAll('form[data-template]').forEach(function (form) {
        var err = form.querySelector('.form-error');
        var done = form.parentElement.querySelector('.submit-done');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var r = build(form);
            if (r.error) {
                err.textContent = r.error; err.hidden = false;
                var f = form.querySelector('#' + r.focus); if (f) f.focus();
                return;
            }
            err.hidden = true;
            var win = window.open(r.url, '_blank', 'noopener');
            done.innerHTML = '';
            var p = document.createElement('p');
            p.textContent = (win ? 'GitHub opened in a new tab. ' : 'Your browser blocked the new tab. ') +
                'Your ' + r.what + ' is not sent until you press "Create" there.';
            var a = document.createElement('a');
            a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; a.className = 'btn';
            a.textContent = 'open the submission on GitHub →';
            var again = document.createElement('button');
            again.type = 'button'; again.className = 'btn ghost'; again.textContent = 'send another';
            again.addEventListener('click', function () { form.reset(); done.hidden = true; form.hidden = false; });
            done.appendChild(p); done.appendChild(a); done.appendChild(document.createTextNode(' ')); done.appendChild(again);
            form.hidden = true; done.hidden = false;
        });
    });

    // 88x31 / 88x32 button upload
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
