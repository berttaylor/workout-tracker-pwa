#!/bin/bash

# PWA Deploy Script with Auto-Update
# This script updates the service worker cache version and build timestamp automatically

echo "🚀 Deploying PWA Update..."

# Get current timestamp
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M")

# Update build timestamp in app.js
echo "📝 Updating build timestamp..."
sed -i '' "s/this\.BUILD_TIMESTAMP = '.*';/this.BUILD_TIMESTAMP = '$TIMESTAMP';/" app.js

# Extract current cache version from service worker
CURRENT_VERSION=$(grep -o "workout-tracker-v[0-9]*" sw.js | grep -o "[0-9]*$")
NEW_VERSION=$((CURRENT_VERSION + 1))

echo "📦 Updating cache version from v$CURRENT_VERSION to v$NEW_VERSION..."

# Update cache version in service worker
sed -i '' "s/workout-tracker-v[0-9]*/workout-tracker-v$NEW_VERSION/" sw.js

# Create detailed commit message with changelog
echo "📝 Creating detailed commit message..."

# Get list of changed files
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null || echo "deploy.sh")

# Build features list
FEATURES_LIST=""
for file in $CHANGED_FILES; do
    case "$file" in
        app.js)
            FEATURES_LIST="${FEATURES_LIST}- Updated application logic in app.js\n"
            ;;
        styles.css)
            FEATURES_LIST="${FEATURES_LIST}- Updated styling and UI improvements in styles.css\n"
            ;;
        index.html)
            FEATURES_LIST="${FEATURES_LIST}- Updated HTML structure and meta tags in index.html\n"
            ;;
        sw.js)
            FEATURES_LIST="${FEATURES_LIST}- Updated service worker configuration\n"
            ;;
        manifest.json)
            FEATURES_LIST="${FEATURES_LIST}- Updated PWA manifest configuration\n"
            ;;
        deploy.sh)
            FEATURES_LIST="${FEATURES_LIST}- Updated deployment script\n"
            ;;
        *)
            FEATURES_LIST="${FEATURES_LIST}- Updated $file\n"
            ;;
    esac
done

# Create the commit message
COMMIT_MSG="PWA Update v$NEW_VERSION - Build $TIMESTAMP

## Changes in this update:

### Service Worker
- Updated cache version from v$CURRENT_VERSION to v$NEW_VERSION
- Force refresh of all cached resources

### Build Info
- Build timestamp: $TIMESTAMP
- Automatic cache invalidation enabled

### Features & Fixes
${FEATURES_LIST}
### Technical Details
- Cache strategy: Cache-first with immediate update detection
- Update mechanism: Automatic with user notification
- iOS compatibility: Enhanced update detection for PWA

---
Deployed automatically via deploy.sh"

# Commit and push changes to GitHub
echo "📤 Committing and pushing to GitHub..."
git add .
# Use printf to handle multi-line commit message properly
printf "%s\n" "$COMMIT_MSG" | git commit -F -
git push

echo "✅ PWA Update Complete!"
echo "   - Cache version: v$NEW_VERSION"
echo "   - Build timestamp: $TIMESTAMP"
echo "   - Changes pushed to GitHub Pages"
echo ""
echo "📱 To test the update on your iPhone:"
echo "   1. Wait 1-2 minutes for GitHub Pages to deploy"
echo "   2. Open the PWA from your home screen"
echo "   3. The app should automatically detect the update"
echo "   4. You'll see an update notification at the top"
echo "   5. Tap 'Update Now' to apply the update"
echo ""
echo "🔄 If automatic update doesn't work, try:"
echo "   - Fully close the PWA (swipe up and swipe away)"
echo "   - Reopen from home screen"
echo "   - Or use 'Add to Home Screen' again to force refresh"
