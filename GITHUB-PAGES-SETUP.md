# 🌐 GitHub Pages Download Site - Quick Setup

## What You're Getting

A beautiful, professional download page at:
```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

**Features:**
- ✨ Modern, gradient design
- 📱 Mobile responsive
- 🔄 Auto-updates from latest GitHub release
- 🎯 Download buttons for all platforms
- 🚀 Fast (served from GitHub CDN)
- 💰 Free hosting

## Quick Setup (3 Steps)

### Step 1: Configure Your Repository Info

```bash
# Replace with your actual GitHub username and repo name
./scripts/setup-github-pages.sh YOUR-USERNAME YOUR-REPO-NAME

# Example:
./scripts/setup-github-pages.sh johndoe kubernetes-training-app
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Add GitHub Pages download site"
git push origin main
```

### Step 3: Enable GitHub Pages

1. Go to: `https://github.com/YOUR-USERNAME/YOUR-REPO-NAME/settings/pages`
2. Under **"Source"**, select: **GitHub Actions**
3. Click **Save**

**That's it!** Your page will be live in 1-2 minutes.

## Your Download Page URL

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

## What It Looks Like

```
┌─────────────────────────────────────────────────┐
│                                                 │
│         🎓 Kubernetes Training                  │
│   Interactive Desktop Application for           │
│         Learning Kubernetes                     │
│                                                 │
│           Latest: v1.0.0                        │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│   Download for Your Platform                    │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │    🪟    │  │    🍎    │  │    🐧    │     │
│  │ Windows  │  │  macOS   │  │  Linux   │     │
│  │          │  │          │  │          │     │
│  │[Download]│  │[Download]│  │[Download]│     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
│  ✅ Prerequisites                               │
│  • Docker Desktop or Minikube                   │
│  • kubectl command-line tool                    │
│  • 4GB RAM minimum                              │
│                                                 │
│  📚 Features                                    │
│  [Interactive Lessons] [Practical Exercises]    │
│  [Sample Microservices] [Progress Tracking]     │
│                                                 │
└─────────────────────────────────────────────────┘
```

## How It Works

1. **User visits your page** → Beautiful landing page loads
2. **JavaScript fetches latest release** → From GitHub API
3. **Download buttons appear** → For Windows, macOS, Linux
4. **User clicks download** → Gets the installer directly

## Sharing Your Page

Once live, share it everywhere:

**Social Media:**
```
🎉 Kubernetes Training v1.0.0 is now available!

Download for Windows, macOS, or Linux:
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/

Learn Kubernetes with interactive lessons and hands-on exercises!
```

**Email Signature:**
```
Download Kubernetes Training: https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

**Documentation:**
```markdown
Visit our [download page](https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/)
```

## Customization

### Change Colors

Edit `docs/website/index.html` line 23:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Try these color schemes:
- **Ocean Blue**: `#2E3192 0%, #1BFFFF 100%`
- **Sunset**: `#FF512F 0%, #DD2476 100%`
- **Forest**: `#134E5E 0%, #71B280 100%`
- **Fire**: `#F2994A 0%, #F2C94C 100%`

### Add Custom Domain

Want `download.yoursite.com` instead?

1. Create `docs/website/CNAME`:
   ```
   download.yoursite.com
   ```

2. Add DNS CNAME record pointing to `YOUR-USERNAME.github.io`

3. In GitHub Settings → Pages, enter your custom domain

## Troubleshooting

**Page shows 404?**
- Wait 2-3 minutes after first deployment
- Check Actions tab for deployment status
- Verify GitHub Pages is enabled in Settings

**Download buttons don't work?**
- Create a release first: `./scripts/create-release.sh 1.0.0`
- Check that release has uploaded assets
- Verify `GITHUB_REPO` in index.html is correct

**Styling looks broken?**
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for errors (F12)

## Files Created

```
docs/
  website/
    index.html                    # Your download page
  github-pages-setup.md          # Detailed setup guide

.github/
  workflows/
    deploy-pages.yml             # Auto-deployment workflow

scripts/
  setup-github-pages.sh          # Configuration script
```

## Complete Workflow Example

```bash
# 1. Setup GitHub Pages
./scripts/setup-github-pages.sh johndoe kubernetes-training-app

# 2. Commit and push
git add .
git commit -m "Add download page"
git push origin main

# 3. Enable in GitHub Settings (one-time)
# Visit: https://github.com/johndoe/kubernetes-training-app/settings/pages
# Select: GitHub Actions

# 4. Create your first release
./scripts/create-release.sh 1.0.0

# 5. Share your page!
# https://johndoe.github.io/kubernetes-training-app/
```

## Benefits Over GitHub Releases Page

| Feature | GitHub Releases | Your Page |
|---------|----------------|-----------|
| **Design** | Basic | Beautiful ✨ |
| **Branding** | GitHub's | Yours 🎨 |
| **Mobile** | OK | Excellent 📱 |
| **Features** | No | Yes 📚 |
| **Prerequisites** | No | Yes ✅ |
| **Auto-detect platform** | No | Possible 🔄 |
| **Custom domain** | No | Yes 🌐 |
| **SEO** | Limited | Full control 🔍 |

## Next Steps

1. ✅ Run setup script
2. ✅ Push to GitHub
3. ✅ Enable GitHub Pages
4. ✅ Create first release
5. ✅ Share your page!

Your download page will be at:
```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

For detailed instructions, see [docs/github-pages-setup.md](docs/github-pages-setup.md)
