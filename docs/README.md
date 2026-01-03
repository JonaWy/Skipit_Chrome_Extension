# SkipIt - Documentation

SkipIt is a Google Chrome extension designed to optimize video playback. The extension automates the skipping of segments (intros, recaps) and provides advanced playback speed control.

## Key Features

### Automation
- Automatically skips intros, recaps, and credits on supported platforms.
- Supported services: Netflix, Disney+, Amazon Prime Video, Crunchyroll, Apple TV+, and Paramount+.

### Speed Control
- Adjust playback rate between 0.25x and 4.0x.
- Support for all HTML5 video players (including YouTube and Vimeo).
- Eight configurable presets for quick access.
- Domain-specific speed setting persistence.

## Usage and Keyboard Shortcuts

Control is available through the popup interface or via the following keyboard shortcuts:

- **+ / NumPad +**: Increase speed by 0.25x.
- **- / NumPad -**: Decrease speed by 0.25x.
- **1 to 8**: Activate the corresponding speed preset.

## Installation

### Chrome Web Store
Standard installation through the Chrome Web Store.

### Manual Installation (Developer Mode)
1. Clone or download the repository.
2. Open `chrome://extensions/` in your browser and enable "Developer mode".
3. Select "Load unpacked" and choose the project directory.

## Technical Specifications

- **Manifest Version**: 3
- **Permissions**: Requires `storage` access for preference persistence and host permissions for video content.
- **Privacy**: All data (statistics and settings) is stored locally or synchronized via Chrome Sync. No data is transmitted to external servers.

## License

This project is free software and can be used and modified in accordance with the repository's guidelines.
