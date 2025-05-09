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
5. [Setting Up Your Supabase Backend](#setting-up-your-supabase-backend)
6. [Customizing Your Configuration](#customizing-your-configuration)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, make sure you have:

- A copy of the THE UNDERWEB codebase
- A Supabase account (free tier available at [supabase.com](https://supabase.com))
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

## Setting Up Your Supabase Backend

THE UNDERWEB uses Supabase for backend functionality. To set up your own Supabase instance:

1. Create an account at [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key
4. Set up the required tables:

   a. Create an `images` table with the following columns:
      - `id` (uuid, primary key)
      - `created_at` (timestamp with time zone)
      - `image_url` (text)
      - `site_url` (text)
      - `tags` (text)

   b. Enable Row Level Security (RLS) and configure appropriate policies

5. Update the configuration in `common.js` with your Supabase URL and anon key:

```javascript
const APP_CONFIG = {
    // ... other config
    SUPABASE: {
        URL: 'https://your-project-id.supabase.co',
        ANON_KEY: 'your-anon-key'
    },
    // ... other config
};
```

## Customizing Your Configuration

You can customize various aspects of THE UNDERWEB by editing the `APP_CONFIG` object in `common.js`:

- Change the application name and version
- Configure storage settings
- Adjust API retry attempts and delays
- Modify UI settings

## Troubleshooting

### Images Not Loading

- Check your Supabase configuration in `common.js`
- Verify that your Supabase storage bucket is properly configured
- Check browser console for any errors

### Deployment Issues

- Make sure all files are properly uploaded
- Check if your hosting provider requires specific configurations
- Verify that your domain DNS settings are correctly configured

### Backend Connection Issues

- Confirm your Supabase URL and anon key are correct
- Check if your Supabase project is active
- Verify that the required tables exist with the correct structure

For additional help, please refer to the documentation of your chosen hosting platform or Supabase.
