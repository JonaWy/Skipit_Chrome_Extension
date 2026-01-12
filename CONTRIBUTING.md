# Contributing to SkipIt

Thank you for your interest in contributing to SkipIt! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Style Guidelines](#style-guidelines)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all experience levels.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Skipit_Chrome_Extension.git
   cd Skipit_Chrome_Extension
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/Jonawy/Skipit_Chrome_Extension.git
   ```

## Development Setup

### Prerequisites

- Google Chrome browser
- Basic knowledge of JavaScript and Chrome Extension APIs

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the project directory

### Testing Changes

After making changes:
1. Go to `chrome://extensions/`
2. Click the refresh icon on the SkipIt extension card
3. Test your changes on supported platforms

## Project Structure

```
Skipit_Chrome_Extension/
├── manifest.json       # Extension manifest (Manifest V3)
├── background.js       # Service worker for background tasks
├── content.js          # Content script injected into pages
├── content.css         # Styles for content script elements
├── popup.html          # Extension popup UI
├── popup.js            # Popup functionality
├── popup.css           # Popup styles
├── options.html        # Options/settings page
├── options.js          # Options page functionality
├── options.css         # Options page styles
├── icons/              # Extension icons (16, 48, 128px)
├── docs/               # GitHub Pages landing page
└── .github/            # GitHub templates
```

### Key Files

| File | Purpose |
|------|---------|
| `manifest.json` | Defines extension metadata, permissions, and scripts |
| `background.js` | Handles extension lifecycle, messaging, and storage |
| `content.js` | Runs on web pages, handles skip detection and speed control |
| `popup.js` | Controls the popup UI and user interactions |
| `options.js` | Manages extension settings and preferences |

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-hbo-support`
- `fix/netflix-skip-button`
- `docs/update-readme`

### Commit Messages

Write clear, concise commit messages:
```
feat: add support for HBO Max skip buttons
fix: resolve speed control issue on YouTube
docs: update installation instructions
refactor: simplify skip button detection logic
```

### Adding Support for New Platforms

To add skip button support for a new streaming platform:

1. Identify the skip button selectors on the platform
2. Add the selectors to the appropriate arrays in `content.js`
3. Test thoroughly across different content types
4. Update the README and landing page

## Submitting a Pull Request

1. **Update your fork**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and commit them

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** on GitHub
   - Use the PR template
   - Describe your changes clearly
   - Reference any related issues

## Style Guidelines

### JavaScript

- Use modern ES6+ syntax
- Use `const` and `let` instead of `var`
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small

### CSS

- Use CSS custom properties (variables) for theming
- Follow the existing naming conventions
- Ensure dark mode compatibility

### HTML

- Use semantic HTML elements
- Maintain accessibility (aria labels, proper structure)

## Reporting Issues

### Bug Reports

When reporting bugs, include:
- Chrome version
- SkipIt version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

### Feature Requests

For feature requests, describe:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## Questions?

If you have questions about contributing, feel free to:
- Open a [Discussion](https://github.com/Jonawy/Skipit_Chrome_Extension/discussions)
- Create an [Issue](https://github.com/Jonawy/Skipit_Chrome_Extension/issues)

---

Thank you for contributing to SkipIt!
