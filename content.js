let settings = {};
const videos = new WeakSet();
let osdElement = null;
let osdTimeout = null;
let introSkipper = null;

// Cached values for performance (Point 7: Cache getPlatform result)
let cachedPlatform = null;
let cachedHostname = null;

// Cache for isVideoPlaybackPage (Point 3)
let isPlaybackPageCache = null;
let lastPlaybackCheckUrl = null;

// Debounce timer for savePerSiteSpeed (Point 6 bonus)
let saveSpeedTimeout = null;

// Performance optimizations: Lazy loading and caching
const featureCache = {
  osdInitialized: false
};

// Debounce helper function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const SKIP_BUTTON_SELECTORS = {
  // Netflix
  netflix: [
    '[data-uia="player-skip-intro"]',
    '[data-uia="player-skip-recap"]',
    '[data-uia="player-skip-credits"]',
    ".watch-video--skip-content-button",
    'button[data-uia*="skip"]',
  ],

  // Disney+
  disney: [
    // Data-testid selectors
    '[data-testid="skip-intro-button"]',
    '[data-testid="skip-credits-button"]',
    '[data-testid="skip-recap-button"]',
    '[data-testid="SkipIntroButton"]',
    '[data-testid="SkipRecapButton"]',
    '[data-testid="SkipCreditsButton"]',
    // Class-based selectors
    ".skip-intro",
    ".skip-recap",
    ".skip-credits",
    'button[class*="SkipIntro"]',
    'button[class*="SkipRecap"]',
    'button[class*="skip-intro"]',
    'button[class*="skip-recap"]',
    '[class*="SkipButton"]',
    '[class*="skipButton"]',
    // Aria labels (English)
    '[aria-label*="Skip Intro"]',
    '[aria-label*="Skip Recap"]',
    '[aria-label*="Skip Credits"]',
    '[aria-label*="skip intro"]',
    '[aria-label*="skip recap"]',
    // Aria labels (German)
    '[aria-label*="Intro überspringen"]',
    '[aria-label*="Vorspann überspringen"]',
    '[aria-label*="Rückblick überspringen"]',
    '[aria-label*="Zusammenfassung überspringen"]',
    '[aria-label*="Abspann überspringen"]',
    '[aria-label*="überspringen"]',
    // Text-based search (will use findButtonByText)
    'button:has-text("Skip Intro")',
    'button:has-text("Skip Recap")',
    'button:has-text("Skip")',
    'button:has-text("Intro überspringen")',
    'button:has-text("Vorspann überspringen")',
    'button:has-text("Rückblick überspringen")',
    'button:has-text("Zusammenfassung überspringen")',
    'button:has-text("Abspann überspringen")',
    'button:has-text("Überspringen")',
  ],

  // Amazon Prime Video
  amazon: [
    // Primary skip button class
    ".atvwebplayersdk-skipelement-button",
    ".skipelement",
    "[class*='skipelement']",
    "[class*='skip-element']",
    // Aria labels (English)
    '[aria-label*="Skip Intro"]',
    '[aria-label*="Skip Recap"]',
    '[aria-label*="Skip Credits"]',
    '[aria-label*="Skip"]',
    // Aria labels (German)
    '[aria-label*="Intro überspringen"]',
    '[aria-label*="Vorspann überspringen"]',
    '[aria-label*="Rückblick überspringen"]',
    '[aria-label*="überspringen"]',
    // Class-based
    'button[class*="skip"]',
    '[class*="skipButton"]',
    '[class*="SkipButton"]',
    // Data attributes
    '[data-testid*="skip"]',
    // Text-based search
    'button:has-text("Skip Intro")',
    'button:has-text("Skip Recap")',
    'button:has-text("Skip")',
    'button:has-text("Intro überspringen")',
    'button:has-text("Überspringen")',
  ],

  // YouTube - Skip Ads support
  youtube: [
    // YouTube Skip Ad button selectors
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-container',
    'button[class*="skip"]',
    '[class*="skip-ad"]',
    '[aria-label*="Skip ad"]',
    '[aria-label*="Werbung überspringen"]',
    'button:has-text("Skip ad")',
    'button:has-text("Skip")',
    'button:has-text("Werbung überspringen")',
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
    ".erc-skip-button",
    ".skip-button",
    ".vjs-overlay-skip-intro",
    // Aria labels (German)
    '[aria-label*="Opening überspringen"]',
    '[aria-label*="Intro überspringen"]',
    '[aria-label*="Rückblick überspringen"]',
    '[aria-label*="Abspann überspringen"]',
    // Legacy/fallback
    'button[class*="skip-intro"]',
    'button[class*="skip-recap"]',
    '[data-t="skip-intro-button"]',
    '[data-t="skip-recap-button"]',
  ],

  // Apple TV+
  appletv: [
    'button[aria-label*="Skip Intro"]',
    'button[aria-label*="Skip Recap"]',
    ".skip-intro-button",
    ".skip-recap-button",
  ],

  // Paramount+
  paramount: [
    '[aria-label*="Skip Intro"]',
    '[aria-label*="Skip Recap"]',
    'button[class*="skip"]',
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
    'button:has-text("Abspann überspringen")',
    // Generic ad skip selectors
    'button[class*="skip-ad" i]',
    'button[id*="skip-ad" i]',
    '[aria-label*="Skip ad" i]',
    '[aria-label*="Werbung überspringen" i]',
  ],
};

// List of officially supported streaming platforms for auto-skip
// YouTube is excluded as it doesn't have intro/recap skip buttons
const SUPPORTED_STREAMING_PLATFORMS = [
  "netflix",
  "disney",
  "amazon",
  "crunchyroll",
  "appletv",
  "paramount",
];

// Point 7: Cached getPlatform() - only recalculates when hostname changes
function getPlatform(hostname) {
  // Return cached value if hostname hasn't changed
  if (cachedHostname === hostname && cachedPlatform !== null) {
    return cachedPlatform;
  }

  cachedHostname = hostname;

  if (hostname.includes("netflix.com")) cachedPlatform = "netflix";
  else if (hostname.includes("disneyplus.com") || hostname.includes("disney+"))
    cachedPlatform = "disney";
  else if (hostname.includes("amazon.") || hostname.includes("primevideo."))
    cachedPlatform = "amazon";
  else if (hostname.includes("youtube.com")) cachedPlatform = "youtube";
  else if (
    hostname.includes("crunchyroll.com") ||
    hostname.includes("static.crunchyroll.com")
  )
    cachedPlatform = "crunchyroll";
  else if (hostname.includes("tv.apple.com")) cachedPlatform = "appletv";
  else if (hostname.includes("paramountplus.com")) cachedPlatform = "paramount";
  else cachedPlatform = "generic";

  return cachedPlatform;
}

// Check if current site is a supported streaming platform
function isSupportedStreamingPlatform() {
  const platform = getPlatform(window.location.hostname);
  return SUPPORTED_STREAMING_PLATFORMS.includes(platform);
}

// Initialize
chrome.storage.sync.get(null, async (items) => {
  settings = items;

  // Initialize license checking
  await License.checkFromStorage();

  // Check if site is enabled
  const host = window.location.hostname;
  const platform = getPlatform(host);

  // Default to true if not present
  if (settings.siteSettings && settings.siteSettings[platform] === false) {
    console.log("[SkipIt] Disabled on this site");
    return;
  }

  // Check platform access (Free: Netflix/YouTube only)
  if (!License.canUsePlatform(platform)) {
    console.log("[SkipIt] Platform requires Premium:", platform);
    showUpgradePrompt(platform);
    return;
  }

  initialize();
  if (introSkipper) introSkipper.init();
});

// Debounced storage change handler for better performance
const debouncedStorageChange = debounce((changes) => {
  for (let key in changes) {
    settings[key] = changes[key].newValue;
  }
  if (changes.autoSkip && introSkipper) {
    introSkipper.init(); // Re-init to pick up changes
  }
  // Reset feature cache when settings change
  if (changes.osd) {
    featureCache.osdInitialized = false;
  }
}, 100);

chrome.storage.onChanged.addListener((changes) => {
  debouncedStorageChange(changes);
});

function initialize() {
  // Initial scan
  document.querySelectorAll("video").forEach(attachController);

  // Auto Skipper
  introSkipper = new IntroSkipper();
  introSkipper.init();

  // Observer for new videos
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === "VIDEO") {
          attachController(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll("video").forEach(attachController);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Keyboard listener
  document.addEventListener("keydown", handleKeydown, true);

  // Check per-site settings
  const host = window.location.hostname;
  if (
    settings.perSiteSettings &&
    settings.perSiteSettings[host] &&
    settings.perSiteSettings[host].speed
  ) {
    // We might want to apply this default speed to all videos on load
  }
}

function attachController(video) {
  if (videos.has(video)) return;
  videos.add(video);

  const host = window.location.hostname;
  let startSpeed = settings.defaultSpeed || 1.0;

  if (
    settings.perSiteSettings &&
    settings.perSiteSettings[host] &&
    settings.perSiteSettings[host].speed
  ) {
    startSpeed = settings.perSiteSettings[host].speed;
  }

  // Apply speed if not 1.0
  if (startSpeed !== 1.0) {
    video.playbackRate = startSpeed;
  }

  // Auto-skip listeners
  video.addEventListener("timeupdate", () => handleAutoSkip(video));

  // Rate change listener (force our speed if site tries to change it? - Optional, maybe too aggressive.
  // Better: Update OSD if it changes)
  video.addEventListener("ratechange", () => {
    // Optional: show OSD on external change?
  });
}

function handleAutoSkip(video) {
  if (!settings.autoSkip) return;

  const {
    introEnabled,
    introSeconds,
    introFallbackSeconds,
    introButtonClick,
    outroEnabled,
    outroSeconds,
  } = settings.autoSkip;

  // Intro
  const introTime = introFallbackSeconds || introSeconds || 10;
  // Only use time skip if button click is disabled or we want both? Assumption: Time skip is fallback or alternative mode.
  // If introButtonClick is true, we assume IntroSkipper class handles it.
  // But if we strictly follow "Fallback if button not found", that's hard to sync.
  // Based on options UI (radio button), they are exclusive.
  if (
    introEnabled &&
    !introButtonClick &&
    video.currentTime < introTime &&
    video.currentTime > 0
  ) {
    if (video.currentTime < 0.5) {
      video.currentTime = introTime;
    }
  }

  // Outro
  if (
    outroEnabled &&
    video.duration &&
    video.duration - video.currentTime < outroSeconds &&
    video.duration - video.currentTime > 0.5
  ) {
    if (!video.paused) {
      video.currentTime = video.duration; // Skip to end
    }
  }

  // Silence detection (Advanced, maybe skip for MVP or implement simple volume check)
}

function handleKeydown(e) {
  // Ignore if typing in input
  const target = e.target;
  if (target.matches("input, textarea, [contenteditable]")) return;

  // Ignore if modifier keys are pressed (except Shift for + access on some layouts)
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const key = e.key;

  // Debug Log
  if (settings.autoSkip?.debugMode)
    console.log(`[SkipIt] Key pressed: ${key} (Code: ${e.code})`);

  // Explicitly handle + and - keys as requested
  // Logic: + (Shift+= on US, + on DE, NumpadAdd) -> Faster
  // Logic: - (- on US, - on DE, NumpadSubtract) -> Slower

  let action = null;

  // Check for presets (1-8)
  if (key === "1") action = "preset1";
  else if (key === "2") action = "preset2";
  else if (key === "3") action = "preset3";
  else if (key === "4") action = "preset4";
  else if (key === "5") action = "preset5";
  else if (key === "6") action = "preset6";
  else if (key === "7") action = "preset7";
  else if (key === "8") action = "preset8";
  // Check for speed control
  else if (
    key === "+" ||
    key === "NumpadAdd" ||
    key === "Add" ||
    (key === "=" && e.shiftKey)
  ) {
    action = "faster";
  } else if (key === "-" || key === "NumpadSubtract" || key === "Subtract") {
    action = "slower";
  }

  if (!action) return;

  e.preventDefault();
  e.stopPropagation();

  // Check local video first
  const video = getTargetVideo();

  if (video) {
    if (action === "faster") {
      changeSpeed(video, 0.25);
    } else if (action === "slower") {
      changeSpeed(video, -0.25);
    } else if (action.startsWith("preset")) {
      const index = parseInt(action.replace("preset", "")) - 1;
      if (settings.presets && settings.presets[index]) {
        setSpeed(video, settings.presets[index]);
      }
    }
  } else {
    // No video found in this frame (e.g. we are Top Frame, video is in Iframe)
    // Send to background to relay to other frames in this tab
    chrome.runtime.sendMessage({
      action: "keyPress",
      key: key,
      code: e.code,
      shiftKey: e.shiftKey,
    });
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

  const allVideos = Array.from(document.querySelectorAll("video")).filter(
    (v) => v.offsetWidth > 0 && v.offsetHeight > 0
  ); // Must be visible-ish

  if (allVideos.length === 0) return null;

  // Preference 1: Playing video
  const playing = allVideos.filter((v) => !v.paused && v.readyState > 0);
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
  // Apply license-based speed limits
  // Premium: 0.25 - 4.0, Free: 1.0 - 2.0
  speed = License.clampSpeed(speed);

  // Round to 2 decimals to avoid floating point weirdness
  speed = Math.round(speed * 100) / 100;

  video.playbackRate = speed;
  showOsd(speed);
  savePerSiteSpeed(speed);

  // Notify popup (if open)
  try {
    chrome.runtime.sendMessage({ action: "speedUpdate", speed: speed });
  } catch (e) {
    // Ignored, happens if no listener (popup closed)
  }
}

// Debounced save function for better performance
const debouncedSavePerSiteSpeed = debounce((perSiteSettings) => {
  chrome.storage.sync.set({ perSiteSettings });
}, 1000);

function savePerSiteSpeed(speed) {
  const host = window.location.hostname;
  if (!settings.perSiteSettings) settings.perSiteSettings = {};
  if (!settings.perSiteSettings[host]) settings.perSiteSettings[host] = {};

  settings.perSiteSettings[host].speed = speed;

  // Use debounced save to avoid excessive storage writes
  debouncedSavePerSiteSpeed(settings.perSiteSettings);
}

function showOsd(speed) {
  if (!settings.osd || !settings.osd.enabled) return;

  if (!osdElement) {
    osdElement = document.createElement("div");
    osdElement.className = "vsc-osd";
    document.body.appendChild(osdElement);
  }

  // Build OSD content
  let osdContent = speed.toFixed(2) + "x";
  
  // Add additional info if enabled (Premium feature)
  if (settings.osd.showInfo && License.isPremium) {
    chrome.storage.sync.get(['stats', 'streaks'], (data) => {
      const stats = data.stats || {};
      const streaks = data.streaks || {};
      const timeSaved = formatTimeSaved(stats.totalTimeSaved || 0);
      const streak = streaks.current || 0;
      
      osdElement.innerHTML = `
        <div style="font-size: ${settings.osd.fontSize || 20}px; line-height: 1.2;">
          <div>${speed.toFixed(2)}x</div>
          ${timeSaved ? `<div style="font-size: ${(settings.osd.fontSize || 20) * 0.7}px; opacity: 0.8; margin-top: 4px;">${timeSaved} saved</div>` : ''}
          ${streak > 0 ? `<div style="font-size: ${(settings.osd.fontSize || 20) * 0.7}px; opacity: 0.8; margin-top: 2px;">🔥 ${streak} days</div>` : ''}
        </div>
      `;
    });
  } else {
    osdElement.textContent = osdContent;
  }

  // Apply custom styling (Premium features)
  if (License.isPremium) {
    if (settings.osd.fontSize) {
      osdElement.style.fontSize = settings.osd.fontSize + "px";
    }
    
    if (settings.osd.fontFamily) {
      const fontMap = {
        'system': '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        'monospace': 'Monaco, "Courier New", monospace',
        'sans-serif': 'Arial, Helvetica, sans-serif',
        'serif': 'Georgia, "Times New Roman", serif'
      };
      osdElement.style.fontFamily = fontMap[settings.osd.fontFamily] || fontMap.system;
    }
    
    if (settings.osd.textColor) {
      osdElement.style.color = settings.osd.textColor;
    }
    
    if (settings.osd.opacity !== undefined) {
      const bgOpacity = settings.osd.opacity;
      osdElement.style.background = `rgba(0, 0, 0, ${bgOpacity})`;
    }
  }

  osdElement.classList.remove("vsc-osd-hidden");

  // Positioning
  if (settings.osd.position === "top-right") {
    osdElement.style.top = "20px";
    osdElement.style.right = "20px";
    osdElement.style.left = "auto";
    osdElement.style.bottom = "auto";
  } else if (settings.osd.position === "top-left") {
    osdElement.style.top = "20px";
    osdElement.style.left = "20px";
    osdElement.style.right = "auto";
    osdElement.style.bottom = "auto";
  } else if (settings.osd.position === "bottom-right") {
    osdElement.style.bottom = "20px";
    osdElement.style.right = "20px";
    osdElement.style.top = "auto";
    osdElement.style.left = "auto";
  } else if (settings.osd.position === "bottom-left") {
    osdElement.style.bottom = "20px";
    osdElement.style.left = "20px";
    osdElement.style.top = "auto";
    osdElement.style.right = "auto";
  }

  if (osdTimeout) clearTimeout(osdTimeout);
  osdTimeout = setTimeout(() => {
    osdElement.classList.add("vsc-osd-hidden");
  }, settings.osd.duration || 2000);
}

// Helper function to format time saved
function formatTimeSaved(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}

function toggleOsd() {
  // Only toggles the setting preference temporarily in memory or globally?
  // Usually toggles "Show OSD" preference.
  if (!settings.osd) settings.osd = {};
  settings.osd.enabled = !settings.osd.enabled;
  chrome.storage.sync.set({ osd: settings.osd });

  // Feedback
  if (settings.osd.enabled)
    showOsd(getTargetVideo() ? getTargetVideo().playbackRate : 1.0);
}

// Show upgrade prompt for non-premium users on premium platforms
function showUpgradePrompt(platform) {
  const platformNames = {
    disney: "Disney+",
    amazon: "Amazon Prime Video",
    crunchyroll: "Crunchyroll",
    appletv: "Apple TV+",
    paramount: "Paramount+",
  };

  const platformName = platformNames[platform] || platform;

  // Create upgrade prompt overlay
  const overlay = document.createElement("div");
  overlay.id = "skipit-upgrade-prompt";
  overlay.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4164D8, #6B8DD6);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(65, 100, 216, 0.4);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 300px;
            animation: skipitSlideIn 0.3s ease;
        ">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">
                🚀 SkipIt Premium
            </div>
            <div style="font-size: 13px; opacity: 0.95; margin-bottom: 12px;">
                Upgrade to use SkipIt on ${platformName} and 7 more streaming platforms!
            </div>
            <button id="skipit-upgrade-btn" style="
                background: white;
                color: #4164D8;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 12px;
                cursor: pointer;
                margin-right: 8px;
            ">Upgrade Now</button>
            <button id="skipit-dismiss-btn" style="
                background: transparent;
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
            ">Maybe Later</button>
        </div>
    `;

  // Add animation styles
  if (!document.getElementById("skipit-upgrade-styles")) {
    const style = document.createElement("style");
    style.id = "skipit-upgrade-styles";
    style.textContent = `
            @keyframes skipitSlideIn {
                from { transform: translateX(100px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes skipitSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100px); opacity: 0; }
            }
        `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);

  // Button handlers
  document
    .getElementById("skipit-upgrade-btn")
    ?.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "openUpgradePage" });
      overlay.remove();
    });

  document
    .getElementById("skipit-dismiss-btn")
    ?.addEventListener("click", () => {
      overlay.querySelector("div").style.animation = "skipitSlideOut 0.3s ease";
      setTimeout(() => overlay.remove(), 280);
    });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.getElementById("skipit-upgrade-prompt")) {
      overlay.querySelector("div").style.animation = "skipitSlideOut 0.3s ease";
      setTimeout(() => overlay.remove(), 280);
    }
  }, 10000);
}

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // If settings aren't loaded or site is disabled, don't execute actions
  if (!settings.siteSettings) {
    // If settings are empty, we might not have loaded them yet or it's a fresh install.
    // But usually content script runs get() on load.
    // We can check if site is disabled if we have settings.
    // If we don't have settings yet, we probably shouldn't act, or should default to enabled.
    // However, correct behavior for "disabled site" is to not act.
  }

  const host = window.location.hostname;
  const platform = getPlatform(host);

  try {
    if (
      settings &&
      settings.siteSettings &&
      settings.siteSettings[platform] === false
    ) {
      // Site is explicitly disabled - Ignore commands
      if (request.action === "getSpeed") {
        sendResponse({ speed: 1.0, disabled: true });
        return;
      }
      if (request.action === "setSpeed") {
        return; // Do nothing
      }
    }
  } catch (e) {
    // Fallback to enabled if check fails
    console.error(
      "[Video Speed Controller+] Error checking disabled status:",
      e
    );
  }

  if (request.action === "getSpeed") {
    const v = getTargetVideo();
    // Only respond if we found a video, otherwise let other frames answer
    if (v) {
      sendResponse({ speed: v.playbackRate });
    }
  } else if (request.action === "setSpeed") {
    console.log("[VSC+] Received setSpeed:", request.speed);
    const v = getTargetVideo();
    console.log("[VSC+] Target video:", v ? "found" : "NOT FOUND");
    if (v) {
      setSpeed(v, request.speed);
      console.log("[VSC+] Speed set to:", request.speed);
    }
  } else if (request.action === "simulateKey") {
    const video = getTargetVideo();
    if (video) {
      // Re-use logic or call simplified handler
      // Just map keys to actions directly
      const key = request.key;
      let action = null;
      if (
        key === "+" ||
        key === "NumpadAdd" ||
        key === "Add" ||
        (key === "=" && request.shiftKey)
      )
        action = "faster";
      else if (key === "-" || key === "NumpadSubtract" || key === "Subtract")
        action = "slower";
      // presets...
      else if (key === "1") action = "preset1";
      else if (key === "2") action = "preset2";
      else if (key === "3") action = "preset3";
      else if (key === "4") action = "preset4";

      if (action) {
        if (action === "faster") changeSpeed(video, 0.25);
        else if (action === "slower") changeSpeed(video, -0.25);
        else if (action.startsWith("preset")) {
          const index = parseInt(action.replace("preset", "")) - 1;
          if (settings.presets && settings.presets[index]) {
            setSpeed(video, settings.presets[index]);
          }
        }
      }
    }
  }
});

class IntroSkipper {
  constructor() {
    this.lastClickTime = 0;
    this.clickDebounceMs = 5000; // 5 seconds between clicks
    this.checkInterval = 1000; // Check every second
    this.observer = null;
    this.intervalId = null;
    this.enabled = false;
    this.skipRecapEnabled = false;
    // Point 1: Use WeakSet for clicked buttons to avoid memory leaks
    this.clickedButtonsWeak = new WeakSet();
    // Fallback: Small map with timestamps for non-referenceable cases
    this.clickedButtonIds = new Map();
  }

  // Point 3: Cached isVideoPlaybackPage() - only recalculates when URL changes or video added
  isVideoPlaybackPage() {
    const currentUrl = window.location.href.toLowerCase();

    // Return cached result if URL hasn't changed
    if (lastPlaybackCheckUrl === currentUrl && isPlaybackPageCache !== null) {
      return isPlaybackPageCache;
    }

    lastPlaybackCheckUrl = currentUrl;
    const platform = getPlatform(window.location.hostname);

    // Debug info (only log on actual recalculation)
    if (settings.autoSkip?.debugMode) {
      console.log("[SkipIt] Checking playback page (cache miss):", {
        url: currentUrl,
        platform: platform,
      });
    }

    // First, quick URL pattern check (fastest)
    const playbackPatterns = {
      disney: ["/video/", "/play/", "/watch", "/episode", "/movie"],
      netflix: ["/watch/"],
      amazon: ["/watch/", "/detail/", "/gp/video/"],
      crunchyroll: ["/watch/"],
      appletv: ["/episode/", "/movie/"],
      paramount: ["/video/"],
    };

    const patterns = playbackPatterns[platform] || [];
    for (const pattern of patterns) {
      if (currentUrl.includes(pattern)) {
        isPlaybackPageCache = true;
        return true;
      }
    }

    // Fallback: Check for video elements
    const videos = document.querySelectorAll("video");
    for (const video of videos) {
      const rect = video.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 80) {
        isPlaybackPageCache = true;
        return true;
      }
    }

    isPlaybackPageCache = false;
    return false;
  }

  // Invalidate cache when video is added (called from MutationObserver)
  invalidatePlaybackCache() {
    isPlaybackPageCache = null;
  }

  async init() {
    // We can access global 'settings' directly as it's kept in sync
    this.enabled =
      (settings.autoSkip && settings.autoSkip.introEnabled) || false;
    this.skipRecapEnabled =
      (settings.autoSkip && settings.autoSkip.recapEnabled) || false;
    this.skipAdsEnabled =
      (settings.autoSkip && settings.autoSkip.skipAdsEnabled) || false;

    // Stop if previously running
    this.stop();

    // If none are enabled, do nothing
    if (!this.enabled && !this.skipRecapEnabled && !this.skipAdsEnabled) return;

    const platform = getPlatform(window.location.hostname);
    
    // For ad skipping, check if it's YouTube or generic platform
    if (this.skipAdsEnabled && (platform === "youtube" || platform === "generic")) {
      // Check license: Ad skipping is Premium feature
      if (!License.isPremium) {
        if (settings.autoSkip?.debugMode) {
          console.log("[SkipIt] Skip Ads requires Premium");
        }
        return;
      }
      this.startWatching();
      return;
    }

    // Only run auto-skip on supported streaming platforms for intro/recap
    if (!isSupportedStreamingPlatform() && platform !== "youtube") {
      if (settings.autoSkip?.debugMode) {
        console.log(
          "[SkipIt] Auto-Skip disabled: Not a supported streaming platform"
        );
      }
      return;
    }

    // Check license: Free users can only use Auto-Skip on Netflix/YouTube
    if (!License.canUseAutoSkip(platform)) {
      if (settings.autoSkip?.debugMode) {
        console.log(
          "[SkipIt] Auto-Skip on this platform requires Premium:",
          platform
        );
      }
      return;
    }

    this.startWatching();
  }

  startWatching() {
    // Polling: Alle X Millisekunden nach Button suchen
    this.intervalId = setInterval(() => {
      if (this.enabled || this.skipRecapEnabled || this.skipAdsEnabled) {
        this.checkForSkipButton();
      }
    }, settings.autoSkip?.buttonCheckInterval || this.checkInterval);

    // MutationObserver: React to new buttons (with debounce)
    this.mutationTimeout = null;
    this.observer = new MutationObserver((mutations) => {
      if (this.enabled || this.skipRecapEnabled || this.skipAdsEnabled) {
        // Check if any video elements were added - invalidate cache
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (
              node.nodeName === "VIDEO" ||
              (node.querySelector && node.querySelector("video"))
            ) {
              this.invalidatePlaybackCache();
              break;
            }
          }
        }

        // Debounce mutation observer to prevent excessive calls
        if (this.mutationTimeout) clearTimeout(this.mutationTimeout);
        this.mutationTimeout = setTimeout(() => {
          this.checkForSkipButton();
        }, 500);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false, // Don't watch attribute changes
      characterData: false, // Don't watch text changes
    });

    if (settings.autoSkip?.debugMode) {
      const platform = getPlatform(window.location.hostname);
      console.log("[SkipIt] Auto-Skipper activated");
      console.log("- Platform:", platform);
      console.log("- Intro Skip:", this.enabled);
      console.log("- Recap Skip:", this.skipRecapEnabled);
      console.log(
        "- Selectors for platform:",
        SKIP_BUTTON_SELECTORS[platform]?.length || 0
      );
    }
  }

  checkForSkipButton() {
    // Debounce: Nicht zu oft klicken
    const now = Date.now();
    if (now - this.lastClickTime < this.clickDebounceMs) {
      return;
    }

    const platform = getPlatform(window.location.hostname);

    // Only search for skip buttons on video playback pages
    // This prevents false positives on main pages, browse pages, etc.
    const isPlaybackPage = this.isVideoPlaybackPage();
    if (!isPlaybackPage) {
      return;
    }

    // Only use platform-specific selectors, no generic selectors
    // This prevents false positives on non-streaming sites
    const selectors = SKIP_BUTTON_SELECTORS[platform] || [];

    if (settings.autoSkip?.debugMode) {
      console.log(
        "[SkipIt] Searching for skip buttons, selectors:",
        selectors.length
      );
    }

    // If no selectors for this platform, don't try to skip anything
    if (selectors.length === 0) {
      return;
    }

    let foundButton = null;
    let foundSelector = null;

    // First, try all platform-specific selectors
    for (const selector of selectors) {
      let button = null;

      // Standard querySelector
      if (!selector.includes(":has-text")) {
        button = document.querySelector(selector);
        if (button && settings.autoSkip?.debugMode) {
          console.log("[SkipIt] Found button with selector:", selector);
        }
      } else {
        // Text-basierte Suche
        const searchText = selector.match(/\("(.+)"\)/)?.[1];
        if (searchText) {
          button = this.findButtonByText(searchText);
        }
      }

      if (button) {
        const isVisible = this.isButtonVisible(button);
        const wasClicked = this.wasClicked(button);
        if (settings.autoSkip?.debugMode) {
          console.log("[SkipIt] Button check:", {
            selector: selector.substring(0, 50),
            visible: isVisible,
            alreadyClicked: wasClicked,
            text: button.textContent?.substring(0, 30),
          });
        }
        if (isVisible && !wasClicked) {
          foundButton = button;
          foundSelector = selector;
          break;
        }
      }
    }

    // Fallback: Use the generic multi-language skip button finder
    if (!foundButton) {
      if (settings.autoSkip?.debugMode) {
        console.log(
          "[SkipIt] No button found with selectors, trying generic search..."
        );
      }
      foundButton = this.findAnySkipButton();
      if (foundButton && !this.wasClicked(foundButton)) {
        foundSelector = "generic-skip-search";
        if (settings.autoSkip?.debugMode) {
          console.log(
            "[SkipIt] Found skip button via generic search:",
            foundButton.textContent.trim()
          );
        }
      } else {
        if (settings.autoSkip?.debugMode) {
          console.log("[SkipIt] No skip button found on page");
        }
        foundButton = null;
      }
    }

    if (foundButton) {
      // Prüfe ob es ein Recap/Credits Button ist und ob das aktiviert ist
      const buttonText = foundButton.textContent.toLowerCase();
      const ariaLabel = (
        foundButton.getAttribute("aria-label") || ""
      ).toLowerCase();
      const dataTestId = (
        foundButton.getAttribute("data-testid") || ""
      ).toLowerCase();
      const dataUia = (
        foundButton.getAttribute("data-uia") || ""
      ).toLowerCase();

      const isRecap =
        buttonText.includes("recap") ||
        buttonText.includes("rückblick") ||
        buttonText.includes("zusammenfassung") ||
        buttonText.includes("credits") ||
        buttonText.includes("abspann") ||
        ariaLabel.includes("recap") ||
        ariaLabel.includes("rückblick") ||
        ariaLabel.includes("zusammenfassung") ||
        ariaLabel.includes("abspann") ||
        dataUia.includes("recap") ||
        dataTestId.includes("recap") ||
        dataTestId.includes("credits");

      // Check if it's an ad skip button
      const isAd =
        buttonText.includes("skip ad") ||
        buttonText.includes("werbung") ||
        buttonText.includes("ad") ||
        ariaLabel.includes("skip ad") ||
        ariaLabel.includes("werbung") ||
        dataTestId.includes("skip-ad") ||
        dataTestId.includes("skipAd") ||
        foundSelector.includes("ytp-ad-skip");

      // Wenn es ein Ad ist, nur klicken wenn Ad-Skip aktiviert
      if (isAd && !this.skipAdsEnabled) {
        return;
      }

      // Wenn es ein Recap ist, nur klicken wenn Recap-Skip aktiviert
      if (isRecap && !this.skipRecapEnabled) {
        return;
      }

      // Wenn es ein Intro ist, nur klicken wenn Intro-Skip aktiviert
      // Default assumption: if not explicitly recap, it might be intro
      const isIntro =
        buttonText.includes("intro") ||
        buttonText.includes("opening") ||
        buttonText.includes("vorspann") ||
        ariaLabel.includes("intro") ||
        ariaLabel.includes("vorspann") ||
        dataUia.includes("intro") ||
        dataTestId.includes("intro") ||
        dataTestId.includes("skip-intro");

      // If it looks like intro (or generic/unknown) but intro skip is disabled, skip it
      if (isIntro && !this.enabled) {
        return;
      }

      // For unknown buttons (neither clearly intro, recap, nor ad),
      // click if any skip is enabled
      if (!isIntro && !isRecap && !isAd && !this.enabled && !this.skipRecapEnabled && !this.skipAdsEnabled) {
        return;
      }

      // Determine skip type for stats
      let skipType = "Intro";
      if (isRecap) skipType = "Recap";
      else if (isAd) skipType = "Ad";

      this.clickButton(foundButton, foundSelector, skipType);
    }
  }

  findButtonByText(text) {
    // Search broadly for skip buttons - Disney+ and others use various elements
    const elements = document.querySelectorAll(
      'button, a, div[tabindex], span[tabindex], [role="button"], div[data-testid*="skip"], div[data-testid*="Skip"], div[class*="skip"], div[class*="Skip"], span[class*="skip"], span[class*="Skip"], [class*="button"], [class*="Button"]'
    );
    const searchText = text.toLowerCase();

    for (const element of elements) {
      // Check text content
      const elementText = element.textContent.trim().toLowerCase();
      if (elementText.includes(searchText)) {
        return element;
      }

      // Check aria-label
      const ariaLabel = (
        element.getAttribute("aria-label") || ""
      ).toLowerCase();
      if (ariaLabel.includes(searchText)) {
        return element;
      }

      // Check title attribute
      const title = (element.getAttribute("title") || "").toLowerCase();
      if (title.includes(searchText)) {
        return element;
      }
    }
    return null;
  }

  // Point 2: Optimized findAnySkipButton() with more specific selectors
  findAnySkipButton() {
    // Ordered by specificity - most likely selectors first for early exit
    const skipKeywords = [
      "skip",
      "überspringen",
      "passer",
      "saltar",
      "salta",
      "pular",
      "overslaan",
    ];

    // More specific selector - targets only likely skip button elements
    // Avoids broad selectors like [class*="button"] that match too many elements
    const elements = document.querySelectorAll(
      '[class*="skip" i], [class*="Skip"], [data-testid*="skip" i], [aria-label*="skip" i], [aria-label*="überspringen" i], button[class*="skip" i]'
    );

    // Fast path: Check specific skip-related elements first
    for (const element of elements) {
      if (this.isButtonVisible(element)) {
        return element;
      }
    }

    // Slower fallback: Search buttons by text content
    const buttons = document.querySelectorAll(
      'button, [role="button"], div[tabindex="0"]'
    );

    for (const element of buttons) {
      // Quick visibility check first (avoid expensive text operations on hidden elements)
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const elementText = element.textContent.trim().toLowerCase();

      // Check against keywords (using some() for early exit)
      if (skipKeywords.some((kw) => elementText.includes(kw))) {
        if (this.isButtonVisible(element)) {
          return element;
        }
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
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  // Point 1: Optimized click tracking using WeakSet (no memory leak)
  wasClicked(button) {
    // Primary check: WeakSet (fast, no memory leak)
    if (this.clickedButtonsWeak.has(button)) {
      return true;
    }
    // Fallback: Check by short ID (for edge cases where element is recreated)
    const shortId = this.getButtonShortId(button);
    return this.clickedButtonIds.has(shortId);
  }

  markAsClicked(button) {
    // Add to WeakSet (primary, memory-efficient)
    this.clickedButtonsWeak.add(button);

    // Also add short ID with timestamp (fallback, for recreated elements)
    const shortId = this.getButtonShortId(button);
    this.clickedButtonIds.set(shortId, Date.now());

    // Clean up old entries after 30 seconds
    setTimeout(() => {
      this.clickedButtonIds.delete(shortId);
    }, 30000);

    // Limit map size to prevent memory growth
    if (this.clickedButtonIds.size > 50) {
      const oldestKey = this.clickedButtonIds.keys().next().value;
      this.clickedButtonIds.delete(oldestKey);
    }
  }

  // Generate a short, stable ID for a button (much smaller than outerHTML)
  getButtonShortId(button) {
    const tag = button.tagName || "EL";
    const text = (button.textContent || "").trim().substring(0, 20);
    const cls = (
      typeof button.className === "string" ? button.className : ""
    ).substring(0, 30);
    const testId = button.getAttribute("data-testid") || "";
    return `${tag}:${text}:${cls}:${testId}`;
  }

  clickButton(button, selector, type) {
    this.lastClickTime = Date.now(); // Update immediately
    const delay = settings.autoSkip?.clickDelay || 500;

    setTimeout(() => {
      try {
        // Use robust click method for React/Vue-based sites like Disney+
        this.simulateRealClick(button);
        this.markAsClicked(button);

        if (settings.autoSkip?.debugMode)
          console.log(
            `[SkipIt] ${type} button clicked (Selector: ${selector})`
          );

        // Optional: Visuelles Feedback (kurzes Highlight des Buttons)
        this.highlightButton(button);

        // Statistiken aktualisieren
        this.updateStats(type);

        // Optional: Notification anzeigen
        if (settings.autoSkip?.showNotifications) {
          this.showNotification(type);
        }
      } catch (e) {
        console.error(e);
      }
    }, delay);
  }

  // Robust click simulation for React/Vue-based sites (Disney+, etc.)
  simulateRealClick(element) {
    const platform = getPlatform(window.location.hostname);

    // For Amazon Prime Video, use simple click to avoid triggering other controls
    if (platform === "amazon") {
      this.performSimpleClick(element);
      if (settings.autoSkip?.debugMode) {
        console.log("[SkipIt] Simple click on Amazon element");
      }
      return;
    }

    // For other platforms (Disney+, etc.), try multiple targets
    const clickTargets = this.getClickTargets(element);

    for (const target of clickTargets) {
      this.performClick(target);
    }

    if (settings.autoSkip?.debugMode) {
      console.log(
        "[SkipIt] Simulated clicks on",
        clickTargets.length,
        "targets"
      );
    }
  }

  // Simple click for platforms that don't need complex event simulation
  performSimpleClick(element) {
    try {
      // Focus first
      if (element.focus) element.focus();

      // Try native click
      if (element.click) {
        element.click();
      }

      // Also dispatch a basic click event
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      element.dispatchEvent(clickEvent);
    } catch (e) {
      if (settings.autoSkip?.debugMode) {
        console.log("[SkipIt] Simple click error:", e);
      }
    }
  }

  // Point 12: Simplified getClickTargets - only element + first interactive child
  getClickTargets(element) {
    const targets = [element];

    // Only add the first interactive child if present (avoid iterating all children)
    const firstChild = element.querySelector('button, [role="button"]');
    if (firstChild && !this.couldCauseNavigation(firstChild)) {
      targets.push(firstChild);
    }

    // Only add immediate parent if it looks like a button wrapper
    const parent = element.parentElement;
    if (
      parent &&
      parent.tagName !== "BODY" &&
      parent.tagName !== "HTML" &&
      (parent.getAttribute("role") === "button" ||
        parent.hasAttribute("tabindex"))
    ) {
      targets.push(parent);
    }

    return targets;
  }

  // Check if clicking an element could cause page navigation
  couldCauseNavigation(element) {
    try {
      // Check if it's a link with href
      if (element.tagName === "A" && element.href) {
        return true;
      }
      // Check for navigation-related classes or roles
      // className can be an SVGAnimatedString for SVG elements, so handle that
      let className = "";
      if (typeof element.className === "string") {
        className = element.className.toLowerCase();
      } else if (element.className?.baseVal) {
        className = element.className.baseVal.toLowerCase();
      }
      const role = (element.getAttribute("role") || "").toLowerCase();
      if (
        className.includes("nav") ||
        className.includes("menu") ||
        className.includes("link") ||
        role === "link" ||
        role === "navigation"
      ) {
        return true;
      }
      return false;
    } catch (e) {
      return false; // If we can't check, assume it's safe
    }
  }

  // Point 4: Optimized performClick with minimal necessary events
  performClick(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const eventOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0,
      buttons: 1,
      clientX: x,
      clientY: y,
      screenX: x + window.screenX,
      screenY: y + window.screenY,
    };

    try {
      // Focus first
      if (element.focus) element.focus();

      // Essential pointer events only (for React/Vue)
      element.dispatchEvent(
        new PointerEvent("pointerdown", { ...eventOptions, isPrimary: true })
      );
      element.dispatchEvent(
        new PointerEvent("pointerup", { ...eventOptions, isPrimary: true })
      );

      // Essential mouse events only
      element.dispatchEvent(new MouseEvent("click", eventOptions));

      // Native click as final fallback
      if (element.click) element.click();
    } catch (e) {
      // Ignore errors
    }
  }

  highlightButton(button) {
    // Kurze visuelle Bestätigung für Debugging
    const originalOutline = button.style.outline;
    button.style.outline = "3px solid #00ff00";
    setTimeout(() => {
      button.style.outline = originalOutline;
    }, 500);
  }

  updateStats(type) {
    // Average time saved per skip (in seconds)
    const AVG_INTRO_SECONDS = 30;
    const AVG_RECAP_SECONDS = 45;
    const AVG_AD_SECONDS = 15; // Average ad duration

    chrome.storage.sync.get("stats", (data) => {
      const stats = data.stats || {
        introsSkipped: 0,
        recapsSkipped: 0,
        adsSkipped: 0,
        totalTimeSaved: 0,
      };

      if (type === "Intro") {
        stats.introsSkipped = (stats.introsSkipped || 0) + 1;
        stats.totalTimeSaved = (stats.totalTimeSaved || 0) + AVG_INTRO_SECONDS;
      } else if (type === "Recap") {
        stats.recapsSkipped = (stats.recapsSkipped || 0) + 1;
        stats.totalTimeSaved = (stats.totalTimeSaved || 0) + AVG_RECAP_SECONDS;
      } else if (type === "Ad") {
        stats.adsSkipped = (stats.adsSkipped || 0) + 1;
        stats.totalTimeSaved = (stats.totalTimeSaved || 0) + AVG_AD_SECONDS;
      }

      chrome.storage.sync.set({ stats }, () => {
        // Trigger streak update when stats change
        chrome.runtime.sendMessage({ action: 'updateStreak' }).catch(() => {});
      });
    });
  }

  showNotification(type) {
    const messages = {
      Intro: "⏩ Intro skipped",
      Recap: "⏩ Recap skipped",
      Ad: "⏩ Ad skipped",
    };

    const notification = document.createElement("div");
    notification.textContent = messages[type] || "⏩ Skipped";
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
    if (!document.getElementById("vsc-styles")) {
      const style = document.createElement("style");
      style.id = "vsc-styles";
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
      notification.style.animation = "vscSlideOut 0.3s ease";
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
