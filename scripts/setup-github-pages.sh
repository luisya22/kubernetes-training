#!/bin/bash

# Script to configure GitHub Pages download site
# Usage: ./scripts/setup-github-pages.sh username repo-name

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "❌ Error: GitHub username and repository name required"
  echo "Usage: ./scripts/setup-github-pages.sh username repo-name"
  echo ""
  echo "Example: ./scripts/setup-github-pages.sh johndoe kubernetes-training-app"
  exit 1
fi

USERNAME=$1
REPO=$2
GITHUB_REPO="${USERNAME}/${REPO}"

echo "🔧 Configuring GitHub Pages for ${GITHUB_REPO}"
echo ""

# Update index.html
echo "📝 Updating docs/website/index.html..."
sed -i.bak "s|YOUR-USERNAME/YOUR-REPO-NAME|${GITHUB_REPO}|g" docs/website/index.html
rm docs/website/index.html.bak 2>/dev/null || true

# Update README.md
echo "📝 Updating README.md..."
sed -i.bak "s|YOUR-USERNAME/YOUR-REPO-NAME|${GITHUB_REPO}|g" README.md
rm README.md.bak 2>/dev/null || true

echo ""
echo "✅ Configuration complete!"
echo ""
echo "📦 Your download page will be available at:"
echo "   https://${USERNAME}.github.io/${REPO}/"
echo ""
echo "🚀 Next steps:"
echo "   1. Commit and push these changes:"
echo "      git add ."
echo "      git commit -m 'Configure GitHub Pages'"
echo "      git push origin main"
echo ""
echo "   2. Enable GitHub Pages in your repository:"
echo "      - Go to: https://github.com/${GITHUB_REPO}/settings/pages"
echo "      - Under 'Source', select 'GitHub Actions'"
echo "      - Click 'Save'"
echo ""
echo "   3. Wait 1-2 minutes for deployment"
echo ""
echo "   4. Visit your page:"
echo "      https://${USERNAME}.github.io/${REPO}/"
echo ""
