// Performance: Cache frequently accessed data
let cachedSettings = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute cache

async function getCachedSettings() {
  const now = Date.now();
  if (!cachedSettings || now - cacheTimestamp > CACHE_DURATION) {
    cachedSettings = await chrome.storage.sync.get(null);
    cacheTimestamp = now;
  }
  return cachedSettings;
}

// Invalidate cache when storage changes
chrome.storage.onChanged.addListener(() => {
  cachedSettings = null;
  cacheTimestamp = 0;
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    const defaultSettings = {
      defaultSpeed: 1.0,
      darkMode: true,
      presets: [1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0],
      presetNames: ["1.0x", "1.25x", "1.5x", "1.75x", "2.0x", "2.5x", "3.0x", "4.0x"],
      shortcuts: {
        faster: "+",
        slower: "-",
      },
      autoSkip: {
        introEnabled: true,
        recapEnabled: true,
        introButtonClick: true,
        introFallbackSeconds: 10,
        outroEnabled: false,
        outroButtonClick: true,
        clickDelay: 500,
        buttonCheckInterval: 1000,
        showNotifications: true,
        silenceEnabled: false,
        silenceThreshold: 30,
        debugMode: false,
      },
      stats: {
        introsSkipped: 0,
        recapsSkipped: 0,
        adsSkipped: 0,
        totalTimeSaved: 0,
      },
      osd: {
        enabled: true,
        position: "top-right",
        duration: 2000,
        fontSize: 20,
        fontFamily: "system",
        textColor: "#FFFFFF",
        opacity: 0.75,
        showInfo: false,
      },
      perSiteSettings: {},
      siteSettings: {},
      blacklist: [],
    };

    chrome.storage.sync.set(defaultSettings, () => {
      console.log("[SkipIt] Default settings saved");
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "keyPress") {
    // Relay to all frames in the tab
    if (sender.tab) {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "simulateKey",
        key: request.key,
        code: request.code,
        shiftKey: request.shiftKey,
      });
    }
  }

  // Handle upgrade page request -> Donate
  if (request.action === "openUpgradePage") {
    chrome.tabs.create({
      url: "https://buymeacoffee.com/jonawy",
    });
  }
});
