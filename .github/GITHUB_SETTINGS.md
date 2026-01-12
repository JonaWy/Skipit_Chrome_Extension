# GitHub Repository Settings - Manual Configuration

This document contains instructions for manual GitHub settings that cannot be configured via code.

## 1. Repository Description

Go to your repository → Click the gear icon next to "About"

**Description:**
```
⏭️ Skip intros & recaps on Netflix, Disney+, Prime Video. Video speed control 0.25x-4x on any website. Free Chrome extension.
```

**Website:**
```
https://jonawy.github.io/Skipit_Chrome_Extension/
```

## 2. Topics

In the same "About" section, add these topics:

```
chrome-extension
video-speed-controller
netflix
disney-plus
prime-video
skip-intro
playback-speed
streaming
manifest-v3
crunchyroll
browser-extension
productivity
```

## 3. Social Preview Image

1. Go to **Settings** → **General**
2. Scroll to **Social preview**
3. Click **Edit** → **Upload an image**
4. Upload the file: `docs/banner.png`

This image will appear when your repository link is shared on:
- Twitter/X
- LinkedIn
- Discord
- Slack
- Facebook
- Other platforms with link previews

## 4. Features to Enable

Go to **Settings** → **General** → **Features**

Enable:
- [x] **Issues** - For bug reports and feature requests
- [x] **Discussions** - For community questions (optional)

## 5. Pages Settings (If not already configured)

Go to **Settings** → **Pages**

- **Source:** Deploy from a branch
- **Branch:** `main` (or your default branch)
- **Folder:** `/docs`

## 6. Security Settings

Go to **Settings** → **Code security and analysis**

Consider enabling:
- [x] Dependency graph
- [x] Dependabot alerts

## 7. Create a Release

Go to **Releases** → **Create a new release**

1. **Tag:** `v1.0.1` (or current version from manifest.json)
2. **Title:** `SkipIt v1.0.1`
3. **Description:**
   ```markdown
   ## SkipIt v1.0.1

   ### Features
   - Automatically skip intros and recaps on Netflix, Disney+, Prime Video, and more
   - Video playback speed control from 0.25x to 4.0x
   - 8 customizable speed presets
   - Keyboard shortcuts for quick control
   - Dark mode support
   - Statistics tracking

   ### Supported Platforms
   - Netflix
   - Disney+
   - Amazon Prime Video
   - Crunchyroll
   - Apple TV+
   - Paramount+

   ### Installation
   Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/skipit/accbbbbemppchhcifkagiegdhfgjmilb)
   ```

4. Check **Set as the latest release**
5. Click **Publish release**

---

## Checklist

After completing these steps, verify:

- [ ] Repository has a clear description with emoji
- [ ] Topics are visible below the description
- [ ] Social preview image shows when sharing the link
- [ ] Issues are enabled
- [ ] GitHub Pages is serving the landing page
- [ ] At least one release exists

## Result

Your repository should now be more discoverable through:
- GitHub search (via topics and description)
- Google search (GitHub repos are indexed)
- Social media shares (via social preview)
- GitHub Explore page (popular topics)
