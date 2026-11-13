/* THE UNDERWEB — submissions
   each form opens a prefilled GitHub issue (see .github/ISSUE_TEMPLATE/).
   a curator labels it "approved" and .github/workflows/publish-submission.yml
   puts it on the site. nothing is stored in this browser. */
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
        var img = val(form, 'image-url'), link = val(form, 'site-link'), alt = val(form, 'alt-text');
        if (img && !isHttp(img)) return { error: 'The image url needs to start with http:// or https://, or leave it blank and attach the file on GitHub.', focus: 'image-url' };
        if (!isHttp(link)) return { error: 'Add the site the image belongs to (http:// or https://).', focus: 'site-link' };
        if (!alt) return { error: 'Describe the image in a few words.', focus: 'alt-text' };
        var host = '';
        try { host = new URL(link).hostname.replace(/^www\./, ''); } catch (e) { /* validated above */ }
        return { url: issueUrl(form.getAttribute('data-template'), '[image] ' + host, {
            'image': img, 'site-link': link, 'alt-text': alt, 'tags': val(form, 'tags')
        }), what: 'image', attach: !img };
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
                'Your ' + r.what + ' is not sent until you press "Create" there.' +
                (r.attach ? ' Drag your image file into the Image box first.' : '');
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

    // arriving via submit.html#link or #image: move focus to that form
    var target = location.hash && document.querySelector(location.hash + ' input');
    if (target) setTimeout(function () { target.focus({ preventScroll: false }); }, 50);
})();
