# THE UNDERWEB

A hand-coded, hand-curated gateway to the web beyond the feed: digital art, curiosities, tools, communities and archives.

**Live:** https://obscuraweb.vercel.app

## Pages

| page | what it is |
| --- | --- |
| `index.html` | the surface: intro, approved image transmissions, embeddable widget, link-to-us buttons |
| `links.html` | the directory, with search, filter and sort |
| `linksindex.html` | the same directory, A–Z |
| `about.html` | what this is and who keeps it |
| `submit.html` | send a link or an image |

The site is static HTML, CSS and vanilla JS with no build step. Vercel deploys `main` automatically.

## Content

- `links-data.js` holds the directory. Every entry is a real, live site.
- `images-data.js` holds the approved images for the feed and widget. The files are in `img/submissions/`.

Nothing on the site is placeholder or demo data. If a section has no real content yet, it says so.

## Submissions

1. Visitors fill in a form on `submit.html`, which opens a prefilled GitHub issue (a free account is needed to send it).
2. Review the issues labelled **submission**.
3. Add the **approved** label to publish one. The *publish submission* Action adds it to the data files, commits to `main` (which redeploys the site), replies and closes the issue. If something is wrong with the submission, the Action explains why and removes the label.
4. Close an issue to reject it.

## Link checks

The *check links* Action runs every Monday. It keeps one issue labelled **dead-link** listing any directory sites that stopped answering or moved, and closes it when everything works again. Run it any time from the Actions tab.

## Embedding

```html
<div id="underweb-widget"></div><script src="https://obscuraweb.vercel.app/widget.js" async></script>
```

## Running locally

Any static server works, for example `python3 -m http.server`. `node server.js` also works after `npm install`. See `DEPLOYMENT.md` for other hosts.
