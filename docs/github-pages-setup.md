# Setting Up GitHub Pages for Your Download Page

This guide will help you set up a beautiful download page at `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

## Step 1: Update the HTML File

Edit `docs/website/index.html` and replace these placeholders:

1. **Line 267**: Replace `YOUR-USERNAME/YOUR-REPO-NAME` with your actual GitHub username and repo name
   ```javascript
   const GITHUB_REPO = 'yourusername/kubernetes-training-app';
   ```

2. **Line 253**: Replace the GitHub link
   ```html
   <a href="https://github.com/yourusername/kubernetes-training-app" class="github-link">
   ```

## Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top right)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**, select:
   - Source: **GitHub Actions**
5. Click **Save**

## Step 3: Push Your Changes

```bash
git add .
git commit -m "Add GitHub Pages download site"
git push origin main
```

## Step 4: Wait for Deployment

1. Go to the **Actions** tab in your repository
2. You'll see "Deploy to GitHub Pages" workflow running
3. Wait for it to complete (usually 1-2 minutes)

## Step 5: Access Your Website

Your download page will be available at:

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

For example:
- Username: `johndoe`
- Repo: `kubernetes-training-app`
- Website: `https://johndoe.github.io/kubernetes-training-app/`

## What You Get

A beautiful, responsive download page with:

- ✅ Automatic version detection from latest GitHub release
- ✅ Download buttons for all platforms (Windows, macOS, Linux)
- ✅ Feature highlights
- ✅ Prerequisites checklist
- ✅ Mobile-friendly design
- ✅ Gradient background and modern UI

## Customization

### Change Colors

Edit `docs/website/index.html` and modify the CSS gradients:

```css
/* Main background gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Button gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Add More Features

Add more feature cards in the HTML:

```html
<div class="feature">
    <h3>🎯 Your Feature</h3>
    <p>Description of your feature</p>
</div>
```

### Change Prerequisites

Edit the prerequisites section:

```html
<div class="prerequisites">
    <h3>✅ Prerequisites</h3>
    <ul>
        <li>Your requirement here</li>
    </ul>
</div>
```

## Custom Domain (Optional)

To use a custom domain like `download.yoursite.com`:

1. Add a file `docs/website/CNAME` with your domain:
   ```
   download.yoursite.com
   ```

2. Configure DNS with your domain provider:
   - Add a CNAME record pointing to `YOUR-USERNAME.github.io`

3. In GitHub Settings → Pages, enter your custom domain

## Troubleshooting

### Page Shows 404

- Wait a few minutes after first deployment
- Check that GitHub Pages is enabled in Settings
- Verify the workflow completed successfully in Actions tab

### Download Links Don't Work

- Make sure you've created at least one release with a tag starting with `v`
- Check that the release has uploaded assets (.exe, .dmg, .AppImage, .deb)
- Verify the `GITHUB_REPO` variable in index.html is correct

### Styling Looks Broken

- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors (F12)

## Updating the Page

Any time you push changes to `docs/website/index.html`, GitHub Actions will automatically redeploy your page.

```bash
# Make changes to docs/website/index.html
git add docs/website/index.html
git commit -m "Update download page"
git push origin main

# Wait 1-2 minutes for deployment
```

## Example Workflow

1. **Create a release**: `./scripts/create-release.sh 1.0.0`
2. **Wait for build**: Check Actions tab (10-20 minutes)
3. **Share your page**: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`
4. **Users download**: They click the download button for their platform

## Preview Locally

To preview the page locally before deploying:

```bash
# Simple HTTP server with Python
cd docs/website
python3 -m http.server 8000

# Or with Node.js
npx http-server docs/website -p 8000
```

Then open `http://localhost:8000` in your browser.

## Benefits of This Approach

✅ **Professional**: Clean, modern design that looks like a real product
✅ **Automatic**: Pulls latest release info from GitHub API
✅ **Free**: GitHub Pages is free for public repositories
✅ **Fast**: Served from GitHub's CDN
✅ **Easy to Share**: One simple URL for all platforms
✅ **SEO Friendly**: Proper HTML structure for search engines
✅ **Mobile Responsive**: Works great on phones and tablets

## Next Steps

After setting up your page:

1. Share the URL on social media
2. Add it to your README
3. Include it in documentation
4. Add it to your email signature
5. Submit to software directories

Your download page URL:
```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```
