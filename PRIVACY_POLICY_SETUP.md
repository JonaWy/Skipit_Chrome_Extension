# Privacy Policy Setup Instructions

## Overview

The Privacy Policy has been created and is ready for deployment. Follow these steps to complete the setup.

## Files Created

1. **`privacy-policy.html`** - Main privacy policy document (root directory)
2. **`docs/privacy-policy.html`** - Copy for GitHub Pages deployment
3. **`docs/README.md`** - GitHub Pages setup instructions

## Files Modified

1. **`options.html`** - Added footer link to Privacy Policy
2. **`options.css`** - Added footer link styles
3. **`manifest.json`** - Added `privacy_policy` field

## Setup Steps

### 1. Update Privacy Policy URL

You need to replace the placeholder URLs with your actual GitHub Pages URL:

**In `options.html` (line ~251):**
```html
<a href="https://yourusername.github.io/repository-name/privacy-policy.html" ...>
```
Replace `yourusername` and `repository-name` with your actual GitHub username and repository name.

**In `manifest.json` (line ~48):**
```json
"privacy_policy": "https://yourusername.github.io/repository-name/privacy-policy.html"
```
Replace `yourusername` and `repository-name` with your actual GitHub username and repository name.

### 2. Update Contact Email

**In `privacy-policy.html` (line ~217):**
```html
<li>Email: <a href="mailto:privacy@skipit-extension.com">privacy@skipit-extension.com</a> (Note: Replace with your actual contact email)</li>
```
Replace `privacy@skipit-extension.com` with your actual contact email address.

### 3. Update GitHub Repository Link

**In `privacy-policy.html` (line ~225):**
```html
<a href="https://github.com/yourusername/skipit" target="_blank" rel="noopener noreferrer">View on GitHub</a>
```
Replace `yourusername/skipit` with your actual GitHub repository path.

### 4. Enable GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "Deploy from a branch"
4. Choose the `main` (or `master`) branch
5. Select the `/docs` folder
6. Click "Save"

Your Privacy Policy will be available at:
`https://yourusername.github.io/repository-name/privacy-policy.html`

### 5. Test the Privacy Policy

1. After enabling GitHub Pages, wait a few minutes for the site to deploy
2. Visit the Privacy Policy URL in your browser
3. Test the link from the extension's options page
4. Verify that the Privacy Policy displays correctly in both light and dark modes

## Privacy Policy Features

- ✅ Responsive design (works on mobile and desktop)
- ✅ Dark mode support (automatically detects system preference)
- ✅ All required sections (data collection, storage, sharing, user rights)
- ✅ ExtensionPay third-party disclosure
- ✅ Chrome Storage Sync/Local explanation
- ✅ User control and rights information

## Notes

- The Privacy Policy uses the same design system as the extension (matching dark mode colors)
- The policy is written in English as requested
- All data collection points have been documented based on code analysis
- ExtensionPay privacy policy is referenced for payment data handling

