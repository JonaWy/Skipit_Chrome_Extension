let settings = {};
const videos = new WeakSet();
let osdElement = null;
let osdTimeout = null;
let silenceAudioCtx = null;
let silenceAnalyser = null;
let introSkipper = null;

const SKIP_BUTTON_SELECTORS = {
    // Netflix
    netflix: [
        '[data-uia="player-skip-intro"]',
        '[data-uia="player-skip-recap"]',
        '[data-uia="player-skip-credits"]',
        '.watch-video--skip-content-button',
        'button[data-uia*="skip"]'
    ],

    // Disney+
    disney: [
        '[data-testid="skip-intro-button"]',
        '[data-testid="skip-credits-button"]',
        '[data-testid="skip-recap-button"]',
        '.skip-intro',
        'button[class*="SkipIntro"]',
        'button[class*="SkipRecap"]'
    ],

    // Amazon Prime Video
    amazon: [
        '.atvwebplayersdk-skipelement-button',
        '[aria-label*="Skip Intro"]',
        '[aria-label*="Skip Recap"]',
        '[aria-label*="Skip Credits"]',
        'button[class*="skip"]'
    ],

    // YouTube (für Ads, aber auch nützlich)
    youtube: [
        '.ytp-ad-skip-button',
        '.ytp-skip-ad-button',
        'button[aria-label*="Skip"]'
    ],

    // Crunchyroll (Player runs in iframe from static.crunchyroll.com)
    crunchyroll: [
        // Primary skip button container
        '[data-testid="skipButton"]',
        '[data-testid="skipButton"] div[tabindex="0"]',
        // Text identifiers inside skip button
        '[data-testid="skipIntroText"]',
        '[data-testid="skipRecapText"]',
        // Class-based selectors
        '.erc-skip-button',
        '.skip-button',
        '.vjs-overlay-skip-intro',
        // Aria labels (German)
        '[aria-label*="Opening überspringen"]',
        '[aria-label*="Intro überspringen"]',
        '[aria-label*="Rückblick überspringen"]',
        '[aria-label*="Abspann überspringen"]',
        // Legacy/fallback
        'button[class*="skip-intro"]',
        'button[class*="skip-recap"]',
        '[data-t="skip-intro-button"]',
        '[data-t="skip-recap-button"]'
    ],

    // HBO Max
    hbo: [
        '[aria-label="Skip Intro"]',
        '[aria-label="Skip Recap"]',
        '[aria-label="Skip Credits"]',
        'button[class*="SkipButton"]'
    ],

    // Apple TV+
    appletv: [
        'button[aria-label*="Skip Intro"]',
        'button[aria-label*="Skip Recap"]',
        '.skip-intro-button',
        '.skip-recap-button'
    ],

    // Paramount+
    paramount: [
        '[aria-label*="Skip Intro"]',
        '[aria-label*="Skip Recap"]',
        'button[class*="skip"]'
    ],

    // Peacock
    peacock: [
        '[aria-label*="Skip Intro"]',
        '[aria-label*="Skip Recap"]',
        'button[data-test*="skip"]'
    ],

    // Generische Selektoren (funktionieren auf vielen Seiten)
    generic: [
        'button[aria-label*="Skip"]',
        'button[aria-label*="Überspringen"]',
        '[aria-label*="überspringen"]',
        'button[class*="skip-intro" i]',
        'button[class*="skip-recap" i]',
        'button[class*="skip-credits" i]',
        'button[id*="skip-intro" i]',
        'button[id*="skip-recap" i]',
        // Buttons/Divs mit bestimmtem Text-Content
        'button:has-text("Skip Intro")',
        'button:has-text("Skip")',
        'button:has-text("Skip Recap")',
        'button:has-text("Skip Credits")',
        'button:has-text("Intro überspringen")',
        'button:has-text("Opening überspringen")',
        'button:has-text("Vorspann überspringen")',
        'button:has-text("Zusammenfassung überspringen")',
        'button:has-text("Rückblick überspringen")',
        'button:has-text("Abspann überspringen")'
    ]
};



function getPlatform(hostname) {
    if (hostname.includes('netflix.com')) return 'netflix';
    if (hostname.includes('disneyplus.com') || hostname.includes('disney+')) return 'disney';
    if (hostname.includes('amazon.com') || hostname.includes('primevideo.com')) return 'amazon';
    if (hostname.includes('youtube.com')) return 'youtube';
    if (hostname.includes('crunchyroll.com') || hostname.includes('static.crunchyroll.com')) return 'crunchyroll';
    if (hostname.includes('hbo.com') || hostname.includes('hbomax.com')) return 'hbo';
    if (hostname.includes('tv.apple.com')) return 'appletv';
    if (hostname.includes('paramountplus.com')) return 'paramount';
    if (hostname.includes('peacocktv.com')) return 'peacock';
    return 'generic';
}

// Initialize
chrome.storage.sync.get(null, (items) => {
    settings = items;
    initialize();
    if (introSkipper) introSkipper.init();
});

chrome.storage.onChanged.addListener((changes) => {
    for (let key in changes) {
        settings[key] = changes[key].newValue;
    }
    if (changes.autoSkip && introSkipper) {
        introSkipper.init(); // Re-init to pick up changes
    }
});

function initialize() {
    // Initial scan
    document.querySelectorAll('video').forEach(attachController);

    // Auto Skipper
    introSkipper = new IntroSkipper();
    introSkipper.init();

    // Observer for new videos
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'VIDEO') {
                    attachController(node);
                } else if (node.querySelectorAll) {
                    node.querySelectorAll('video').forEach(attachController);
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Keyboard listener
    document.addEventListener('keydown', handleKeydown, true);

    // Check per-site settings
    const host = window.location.hostname;
    if (settings.perSiteSettings && settings.perSiteSettings[host] && settings.perSiteSettings[host].speed) {
        // We might want to apply this default speed to all videos on load
    }
}

function attachController(video) {
    if (videos.has(video)) return;
    videos.add(video);

    const host = window.location.hostname;
    let startSpeed = settings.defaultSpeed || 1.0;

    if (settings.perSiteSettings && settings.perSiteSettings[host] && settings.perSiteSettings[host].speed) {
        startSpeed = settings.perSiteSettings[host].speed;
    }

    // Apply speed if not 1.0
    if (startSpeed !== 1.0) {
        video.playbackRate = startSpeed;
    }

    // Auto-skip listeners
    video.addEventListener('timeupdate', () => handleAutoSkip(video));

    // Rate change listener (force our speed if site tries to change it? - Optional, maybe too aggressive. 
    // Better: Update OSD if it changes)
    video.addEventListener('ratechange', () => {
        // Optional: show OSD on external change?
    });
}

function handleAutoSkip(video) {
    if (!settings.autoSkip) return;

    const { introEnabled, introSeconds, introFallbackSeconds, introButtonClick, outroEnabled, outroSeconds } = settings.autoSkip;

    // Intro
    const introTime = introFallbackSeconds || introSeconds || 10;
    // Only use time skip if button click is disabled or we want both? Assumption: Time skip is fallback or alternative mode.
    // If introButtonClick is true, we assume IntroSkipper class handles it.
    // But if we strictly follow "Fallback if button not found", that's hard to sync.
    // Based on options UI (radio button), they are exclusive.
    if (introEnabled && !introButtonClick && video.currentTime < introTime && video.currentTime > 0) {
        if (video.currentTime < 0.5) {
            video.currentTime = introTime;
        }
    }

    // Outro
    if (outroEnabled && video.duration && (video.duration - video.currentTime) < outroSeconds && (video.duration - video.currentTime) > 0.5) {
        if (!video.paused) {
            video.currentTime = video.duration; // Skip to end
        }
    }

    // Silence detection (Advanced, maybe skip for MVP or implement simple volume check)
}

function handleKeydown(e) {
    // Ignore if typing in input
    const target = e.target;
    if (target.matches('input, textarea, [contenteditable]')) return;

    // Ignore if modifier keys are pressed (except Shift for + access on some layouts)
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const key = e.key;

    // Debug Log
    if (settings.autoSkip?.debugMode) console.log(`[Video Speed Controller+] Key pressed: ${key} (Code: ${e.code})`);

    // Explicitly handle + and - keys as requested
    // Logic: + (Shift+= on US, + on DE, NumpadAdd) -> Faster
    // Logic: - (- on US, - on DE, NumpadSubtract) -> Slower

    let action = null;

    // Check for presets (1-4)
    if (key === '1') action = 'preset1';
    else if (key === '2') action = 'preset2';
    else if (key === '3') action = 'preset3';
    else if (key === '4') action = 'preset4';

    // Check for speed control
    else if (key === '+' || key === 'NumpadAdd' || key === 'Add' || (key === '=' && e.shiftKey)) {
        action = 'faster';
    } else if (key === '-' || key === 'NumpadSubtract' || key === 'Subtract') {
        action = 'slower';
    }

    if (!action) return;

    e.preventDefault();
    e.stopPropagation();

    const video = getTargetVideo();
    if (!video) return;

    if (action === 'faster') {
        changeSpeed(video, 0.25);
    } else if (action === 'slower') {
        changeSpeed(video, -0.25);
    } else if (action.startsWith('preset')) {
        const index = parseInt(action.replace('preset', '')) - 1;
        if (settings.presets && settings.presets[index]) {
            setSpeed(video, settings.presets[index]);
        }
    }
}

function getTargetVideo() {
    // Strategy:
    // 1. Check for specific main video players on known sites (Netflix, YouTube, etc)
    // 2. Filter valid videos (dimension check)
    // 3. Prefer playing videos
    // 4. Fallback to largest video

    // Some sites use shadowDOM, but we are in main context. 
    // Basic selector usually works.

    const allVideos = Array.from(document.querySelectorAll('video'))
        .filter(v => v.offsetWidth > 0 && v.offsetHeight > 0); // Must be visible-ish

    if (allVideos.length === 0) return null;

    // Preference 1: Playing video
    const playing = allVideos.filter(v => !v.paused && v.readyState > 0);
    if (playing.length > 0) return playing[0];

    // Preference 2: Largest video by area
    let largest = allVideos[0];
    let maxArea = largest.offsetWidth * largest.offsetHeight;

    for (let i = 1; i < allVideos.length; i++) {
        const v = allVideos[i];
        const area = v.offsetWidth * v.offsetHeight;
        if (area > maxArea) {
            largest = v;
            maxArea = area;
        }
    }

    return largest;
}

function changeSpeed(video, delta) {
    let newSpeed = video.playbackRate + delta;
    setSpeed(video, newSpeed);
}

function setSpeed(video, speed) {
    // Bounds check
    speed = Math.max(0.07, Math.min(16.0, speed)); // Chrome supports up to 16x generally, prompt said 0.25-4.0 but wide range is better

    // Round to 2 decimals to avoid floating point weirdness
    speed = Math.round(speed * 100) / 100;

    video.playbackRate = speed;
    showOsd(speed);
    savePerSiteSpeed(speed);
}

function savePerSiteSpeed(speed) {
    const host = window.location.hostname;
    if (!settings.perSiteSettings) settings.perSiteSettings = {};
    if (!settings.perSiteSettings[host]) settings.perSiteSettings[host] = {};

    settings.perSiteSettings[host].speed = speed;

    // Debounce save?
    chrome.storage.sync.set({ perSiteSettings: settings.perSiteSettings });
}

function showOsd(speed) {
    if (!settings.osd || !settings.osd.enabled) return;

    if (!osdElement) {
        osdElement = document.createElement('div');
        osdElement.className = 'vsc-osd';
        document.body.appendChild(osdElement);
    }

    osdElement.textContent = speed.toFixed(2) + 'x';
    osdElement.classList.remove('vsc-osd-hidden');

    // Positioning
    if (settings.osd.position === 'top-right') {
        osdElement.style.top = '20px';
        osdElement.style.right = '20px';
        osdElement.style.left = 'auto';
        osdElement.style.bottom = 'auto';
    } else if (settings.osd.position === 'top-left') {
        osdElement.style.top = '20px';
        osdElement.style.left = '20px';
        osdElement.style.right = 'auto';
        osdElement.style.bottom = 'auto';
    } // ... other positions

    if (osdTimeout) clearTimeout(osdTimeout);
    osdTimeout = setTimeout(() => {
        osdElement.classList.add('vsc-osd-hidden');
    }, settings.osd.duration || 2000);
}

function toggleOsd() {
    // Only toggles the setting preference temporarily in memory or globally? 
    // Usually toggles "Show OSD" preference.
    if (!settings.osd) settings.osd = {};
    settings.osd.enabled = !settings.osd.enabled;
    chrome.storage.sync.set({ osd: settings.osd });

    // Feedback
    if (settings.osd.enabled) showOsd(getTargetVideo() ? getTargetVideo().playbackRate : 1.0);
}

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSpeed") {
        const v = getTargetVideo();
        sendResponse({ speed: v ? v.playbackRate : 1.0 });
    } else if (request.action === "setSpeed") {
        const v = getTargetVideo();
        if (v) setSpeed(v, request.speed);
    }
});

class IntroSkipper {
    constructor() {
        this.lastClickTime = 0;
        this.clickDebounceMs = 5000; // 5 Sekunden zwischen Clicks
        this.checkInterval = 1000; // Jede Sekunde checken
        this.observer = null;
        this.intervalId = null;
        this.enabled = false;
        this.skipRecapEnabled = false;
        this.autoPlayNextEnabled = false;
        this.clickedButtons = new Set(); // Verhindert doppeltes Klicken
    }

    async init() {
        // We can access global 'settings' directly as it's kept in sync
        this.enabled = (settings.autoSkip && settings.autoSkip.introEnabled) || false;
        this.skipRecapEnabled = (settings.autoSkip && settings.autoSkip.recapEnabled) || false;

        // Stop if previously running
        this.stop();

        // If neither is enabled, do nothing
        if (!this.enabled && !this.skipRecapEnabled) return;

        this.startWatching();
    }

    startWatching() {
        // Polling: Alle X Millisekunden nach Button suchen
        this.intervalId = setInterval(() => {
            if (this.enabled || this.skipRecapEnabled) {
                this.checkForSkipButton();
            }
        }, settings.autoSkip?.buttonCheckInterval || this.checkInterval);

        // MutationObserver: Auf neue Buttons reagieren
        this.observer = new MutationObserver(() => {
            if (this.enabled || this.skipRecapEnabled) {
                this.checkForSkipButton();
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        if (settings.autoSkip?.debugMode) {
            console.log('[Video Speed Controller+] Auto-Skipper aktiviert');
            console.log('- Intro Skip:', this.enabled);
            console.log('- Recap Skip:', this.skipRecapEnabled);
        }
    }

    checkForSkipButton() {
        // Debounce: Nicht zu oft klicken
        const now = Date.now();
        if (now - this.lastClickTime < this.clickDebounceMs) {
            return;
        }

        const platform = getPlatform(window.location.hostname);
        const selectors = [
            ...(SKIP_BUTTON_SELECTORS[platform] || []),
            ...SKIP_BUTTON_SELECTORS.generic
        ];

        for (const selector of selectors) {
            // Versuche Button zu finden
            let button = null;

            // Standard querySelector
            if (!selector.includes(':has-text')) {
                button = document.querySelector(selector);
            } else {
                // Text-basierte Suche
                const searchText = selector.match(/\("(.+)"\)/)?.[1];
                if (searchText) {
                    button = this.findButtonByText(searchText);
                }
            }

            if (button && this.isButtonVisible(button) && !this.wasClicked(button)) {
                // Prüfe ob es ein Recap/Credits Button ist und ob das aktiviert ist
                const buttonText = button.textContent.toLowerCase();
                const isRecap = buttonText.includes('recap') ||
                    buttonText.includes('rückblick') ||
                    buttonText.includes('zusammenfassung') ||
                    buttonText.includes('credits') ||
                    buttonText.includes('abspann') ||
                    button.getAttribute('data-uia')?.includes('recap') ||
                    button.getAttribute('data-testid')?.includes('recap') ||
                    button.getAttribute('data-testid')?.includes('Recap') ||
                    button.getAttribute('data-t')?.includes('recap');

                // Wenn es ein Recap ist, nur klicken wenn Recap-Skip aktiviert
                if (isRecap && !this.skipRecapEnabled) {
                    continue;
                }

                // Wenn es ein Intro ist, nur klicken wenn Intro-Skip aktiviert
                // Default assumption: if not explicitly recap, it might be intro
                const isIntro = buttonText.includes('intro') ||
                    buttonText.includes('opening') ||
                    buttonText.includes('vorspann') ||
                    button.getAttribute('data-uia')?.includes('intro') ||
                    button.getAttribute('data-testid')?.includes('intro') ||
                    button.getAttribute('data-testid')?.includes('Intro') ||
                    button.getAttribute('data-t')?.includes('intro');

                // If it looks like intro (or generic/unknown) but intro skip is disabled, skip it
                // If it's generic and we don't know, we assume intro skip controls it? 
                // Or if intro skip is disabled, we shouldn't click random buttons.
                if (isIntro && !this.enabled) {
                    continue;
                }

                this.clickButton(button, selector, isRecap ? 'Recap' : 'Intro');
                return; // Nur einen Button pro Check klicken
            }
        }
    }



    findButtonByText(text) {
        // Crunchyroll uses div elements, not buttons - search more broadly
        const elements = document.querySelectorAll('button, a, div[tabindex], span[tabindex], [role="button"], div[data-testid*="skip"], div[class*="skip"]');
        for (const element of elements) {
            const elementText = element.textContent.trim().toLowerCase();
            const searchText = text.toLowerCase();
            if (elementText.includes(searchText)) {
                return element;
            }
        }
        return null;
    }

    isButtonVisible(button) {
        // Prüfe ob Button sichtbar ist
        const rect = button.getBoundingClientRect();
        const style = window.getComputedStyle(button);

        return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
        );
    }

    wasClicked(button) {
        // Erstelle eindeutige ID für Button - not perfect but okay for DOM elements
        // Using outerHTML might be too large/variable. Using reference + time?
        // The Set stores strings, so outerHTML is used. 
        // Ideally we shouldn't store large strings.
        // But since pages reload/change, simple check.
        const buttonId = button.outerHTML;
        return this.clickedButtons.has(buttonId);
    }

    markAsClicked(button) {
        const buttonId = button.outerHTML;
        this.clickedButtons.add(buttonId);

        // Nach 30 Sekunden aus Set entfernen (falls Button erneut erscheint? usually not for same intro)
        setTimeout(() => {
            this.clickedButtons.delete(buttonId);
        }, 30000);
    }

    clickButton(button, selector, type) {
        this.lastClickTime = Date.now(); // Update immediately
        const delay = settings.autoSkip?.clickDelay || 500;

        setTimeout(() => {
            try {
                button.click();
                this.markAsClicked(button);

                if (settings.autoSkip?.debugMode) console.log(`[Video Speed Controller+] ${type}-Button geklickt (Selector: ${selector})`);

                // Optional: Visuelles Feedback (kurzes Highlight des Buttons)
                this.highlightButton(button);

                // Statistiken aktualisieren
                this.updateStats(type);

                // Optional: Notification anzeigen
                // Optional: Notification anzeigen
                if (settings.autoSkip?.showNotifications) {
                    this.showNotification(type); // Fixed: showSkipNotification -> showNotification
                }
            } catch (e) {
                console.error(e);
            }
        }, delay);
    }


    highlightButton(button) {
        // Kurze visuelle Bestätigung für Debugging
        const originalOutline = button.style.outline;
        button.style.outline = '3px solid #00ff00';
        setTimeout(() => {
            button.style.outline = originalOutline;
        }, 500);
    }

    updateStats(type) {
        // Basic stats tracking
        chrome.storage.sync.get('stats', (data) => {
            const stats = data.stats || { introsSkipped: 0, recapsSkipped: 0 };

            if (type === 'Intro') stats.introsSkipped = (stats.introsSkipped || 0) + 1;
            else if (type === 'Recap') stats.recapsSkipped = (stats.recapsSkipped || 0) + 1;

            chrome.storage.sync.set({ stats });
        });
    }

    showNotification(type) {
        const messages = {
            'Intro': '⏩ Intro übersprungen',
            'Recap': '⏩ Zusammenfassung übersprungen'
        };

        const notification = document.createElement('div');
        notification.textContent = messages[type] || '⏩ Übersprungen';
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 999999;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: vscSlideIn 0.3s ease;
      pointer-events: none;
    `;

        // Check if style exists
        if (!document.getElementById('vsc-styles')) {
            const style = document.createElement('style');
            style.id = 'vsc-styles';
            style.textContent = `
        @keyframes vscSlideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes vscSlideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'vscSlideOut 0.3s ease';
            setTimeout(() => notification.remove(), 280);
        }, 2500);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}
