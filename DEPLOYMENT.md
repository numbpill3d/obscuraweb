# Deployment Guide for THE UNDERWEB

This guide will help you deploy THE UNDERWEB application to your own URL. There are several options available depending on your needs and technical expertise.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Option 1: Static Site Hosting](#option-1-static-site-hosting)
   - [Netlify](#netlify)
   - [Vercel](#vercel)
   - [GitHub Pages](#github-pages)
3. [Option 2: Traditional Web Hosting](#option-2-traditional-web-hosting)
4. [Option 3: Self-Hosting](#option-3-self-hosting)
5. [How Submissions Work](#how-submissions-work)
6. [Editing Content](#editing-content)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, make sure you have:

- A copy of the THE UNDERWEB codebase
- Basic understanding of web hosting concepts
- (Optional) A domain name you want to use

## Option 1: Static Site Hosting

THE UNDERWEB is a static site that can be easily deployed to various static site hosting platforms.

### Netlify

Netlify offers a generous free tier and is very easy to set up:

1. Sign up for a Netlify account at [netlify.com](https://netlify.com)
2. From your Netlify dashboard, click "New site from Git"
3. Connect your GitHub/GitLab/Bitbucket account and select your repository
4. Configure build settings (not required for this project as it's pre-built)
5. Click "Deploy site"

To use a custom domain:
1. Go to "Domain settings" in your site dashboard
2. Click "Add custom domain"
3. Follow the instructions to set up DNS records

### Vercel

Vercel is another excellent option for static site hosting:

1. Sign up for a Vercel account at [vercel.com](https://vercel.com)
2. From your dashboard, click "Import Project"
3. Import from your Git repository or upload the files directly
4. Configure project settings (no build step needed)
5. Click "Deploy"

To use a custom domain:
1. Go to "Project Settings" > "Domains"
2. Add your domain and follow the DNS configuration instructions

### GitHub Pages

If your code is already on GitHub, you can use GitHub Pages:

1. Go to your repository on GitHub
2. Click "Settings" > "Pages"
3. Select the branch you want to deploy (usually "main" or "master")
4. Select the folder (usually "/ (root)")
5. Click "Save"

Your site will be available at `https://yourusername.github.io/repositoryname/`

To use a custom domain:
1. Add a file named `CNAME` to your repository with your domain name
2. Configure your domain's DNS settings as instructed in GitHub Pages documentation

## Option 2: Traditional Web Hosting

If you prefer traditional web hosting:

1. Sign up for a web hosting service (e.g., Bluehost, HostGator, DreamHost)
2. Access your hosting control panel (usually cPanel)
3. Use the File Manager or FTP to upload all the files to your web hosting
4. Make sure the files are in the public directory (usually `public_html`)

## Option 3: Self-Hosting

For advanced users who want to self-host:

1. Set up a web server (Apache, Nginx, etc.) on your own hardware or VPS
2. Configure the server to serve static files
3. Upload the files to your server's web directory
4. Configure your domain to point to your server's IP address

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/html/underweb;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

## How Submissions Work

The site has no database. Submissions go through GitHub issues on this repo, and approved ones are written into the site's data files.

1. A visitor fills in a form on `submit.html`. `submit.js` opens a prefilled issue from `.github/ISSUE_TEMPLATE/submit-link.yml` or `submit-image.yml`, and the visitor presses **Create** on GitHub.
2. New submissions get the `submission` label plus `link` or `image`. Review them at **Issues → label: submission**.
3. To publish one, add the **`approved`** label. `.github/workflows/publish-submission.yml` then:
   - appends a link to `links-data.js`, or
   - downloads an image into `img/submissions/` and appends it to `images-data.js`,
   - commits to `main` (which redeploys the site), comments on the issue and closes it.
4. If something is wrong (bad URL, image too big, duplicate site), the workflow comments with the reason and removes `approved`. Fix the issue and add the label again.
5. To reject a submission, close the issue.

The workflow needs **Settings → Actions → General → Workflow permissions** set to "Read and write". It needs no other secrets.

## Editing Content

- **Directory:** edit `links-data.js`. Every entry needs a real, working `url`.
- **Image feed and widget:** edit `images-data.js`. Image files live in `img/submissions/`.

## Troubleshooting

### A submission didn't publish

- Open the **Actions** tab and look at the "publish submission" run for that issue.
- Check that the issue still has both the `submission` and `link`/`image` labels.

### Deployment Issues

- Make sure all files are properly uploaded
- Check if your hosting provider requires specific configurations
- Verify that your domain DNS settings are correctly configured
