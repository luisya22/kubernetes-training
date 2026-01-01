#!/bin/bash

# Script to create a new release
# Usage: ./scripts/create-release.sh 1.0.0

set -e

if [ -z "$1" ]; then
  echo "❌ Error: Version number required"
  echo "Usage: ./scripts/create-release.sh 1.0.0"
  exit 1
fi

VERSION=$1
TAG="v${VERSION}"

echo "🚀 Creating release ${TAG}"
echo ""

# Check if working directory is clean
if [[ -n $(git status -s) ]]; then
  echo "⚠️  Warning: You have uncommitted changes"
  git status -s
  echo ""
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Update version in package.json
echo "📝 Updating package.json version to ${VERSION}..."
npm version ${VERSION} --no-git-tag-version

# Commit version bump
echo "💾 Committing version bump..."
git add package.json package-lock.json
git commit -m "chore: bump version to ${VERSION}"

# Create and push tag
echo "🏷️  Creating tag ${TAG}..."
git tag -a ${TAG} -m "Release ${TAG}"

echo "⬆️  Pushing to GitHub..."
git push origin main
git push origin ${TAG}

echo ""
echo "✅ Release ${TAG} created successfully!"
echo ""
echo "📦 GitHub Actions is now building your release."
echo "   Check progress at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo ""
echo "🎉 Once complete, your release will be available at:"
echo "   https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases/tag/${TAG}"
