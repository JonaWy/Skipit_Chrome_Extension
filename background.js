// Import ExtPay for payment processing
// See: https://github.com/glench/ExtPay
importScripts('ExtPay.js');

// Initialize ExtPay with your extension ID from extensionpay.com
const extpay = ExtPay('skipit');

// Start background payment checking
extpay.startBackground();

// Listen for payment events
extpay.onPaid.addListener(user => {
  console.log('[SkipIt] User paid! Activating premium...');
  chrome.storage.local.set({ premiumStatus: true }, () => {
    // Notify all tabs about license change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: "licenseUpdated",
          isPremium: true
        }).catch(() => {});
      });
    });
  });
});

// Sync premium status on extension startup
async function syncPremiumStatus() {
  try {
    const user = await extpay.getUser();
    const isPremium = user.paid === true;
    await chrome.storage.local.set({ 
      premiumStatus: isPremium,
      lastLicenseCheck: Date.now()
    });
    console.log('[SkipIt] Premium status synced:', isPremium ? 'PREMIUM' : 'FREE');
  } catch (error) {
    console.error('[SkipIt] Failed to sync premium status:', error);
  }
}

// Sync on service worker startup
syncPremiumStatus();

// Performance: Cache frequently accessed data
let cachedSettings = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute cache

async function getCachedSettings() {
  const now = Date.now();
  if (!cachedSettings || (now - cacheTimestamp) > CACHE_DURATION) {
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
  if (details.reason === 'install') {
    const defaultSettings = {
      defaultSpeed: 1.0,
      darkMode: true,
      presets: [1.0, 1.5, 2.0, 2.5],
      presetNames: ["Normal", "1.5x", "2.0x", "2.5x"],
      shortcuts: {
        faster: "+",
        slower: "-"
      },
      autoSkip: {
        introEnabled: true,
        recapEnabled: true,
        skipAdsEnabled: false,
        introButtonClick: true,
        introFallbackSeconds: 10,
        outroEnabled: false,
        outroButtonClick: true,
        clickDelay: 500,
        buttonCheckInterval: 1000,
        showNotifications: true,
        silenceEnabled: false,
        silenceThreshold: 30,
        debugMode: false
      },
      stats: {
        introsSkipped: 0,
        recapsSkipped: 0,
        adsSkipped: 0,
        totalTimeSaved: 0
      },
      streaks: {
        current: 0,
        longest: 0,
        lastDate: null,
        badges: []
      },
      osd: {
        enabled: true,
        position: "top-right",
        duration: 2000,
        fontSize: 20,
        fontFamily: "system",
        textColor: "#FFFFFF",
        opacity: 0.75,
        showInfo: false
      },
      perSiteSettings: {},
      siteSettings: {},
      blacklist: []
    };

    chrome.storage.sync.set(defaultSettings, () => {
      console.log('[SkipIt] Default settings saved');
    });

    // Initialize premium status as false for new installs
    chrome.storage.local.set({ premiumStatus: false }, () => {
      console.log('[SkipIt] License initialized (Free tier)');
    });
  }
});

// Streak management functions
async function updateStreak() {
  try {
    const data = await chrome.storage.sync.get(['streaks']);
    const streaks = data.streaks || {
      current: 0,
      longest: 0,
      lastDate: null,
      badges: []
    };

    const today = new Date().toDateString();
    const lastDate = streaks.lastDate ? new Date(streaks.lastDate).toDateString() : null;

    if (lastDate === today) {
      // Already updated today, no change needed
      return streaks;
    }

    if (lastDate && lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (lastDate === yesterdayStr) {
        // Consecutive day - increment streak
        streaks.current = (streaks.current || 0) + 1;
      } else {
        // Streak broken - reset to 1
        streaks.current = 1;
      }
    } else {
      // First time or new day - start streak
      streaks.current = streaks.current ? streaks.current + 1 : 1;
    }

    // Update longest streak
    if (streaks.current > streaks.longest) {
      streaks.longest = streaks.current;
    }

    streaks.lastDate = today;

    // Check for badge milestones
    const badgeMilestones = [7, 14, 30, 60, 100, 365];
    const newBadges = [];
    badgeMilestones.forEach(milestone => {
      if (streaks.current === milestone && !streaks.badges.includes(milestone)) {
        streaks.badges.push(milestone);
        newBadges.push(milestone);
      }
    });

    await chrome.storage.sync.set({ streaks });

    // Notify about new badges
    if (newBadges.length > 0) {
      chrome.runtime.sendMessage({
        action: "newBadge",
        badges: newBadges
      }).catch(() => {});
    }

    return streaks;
  } catch (error) {
    console.error('[SkipIt] Error updating streak:', error);
    return null;
  }
}

// Debounced streak update for better performance
let streakUpdateTimeout = null;
chrome.storage.onChanged.addListener((changes) => {
  if (changes.stats) {
    // Debounce streak update to avoid excessive calculations
    if (streakUpdateTimeout) clearTimeout(streakUpdateTimeout);
    streakUpdateTimeout = setTimeout(() => {
      updateStreak();
    }, 500);
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
        shiftKey: request.shiftKey
      });
    }
  }
  
  // Handle upgrade page request
  if (request.action === "openUpgradePage") {
    // Open ExtensionPay payment page
    extpay.openPaymentPage();
  }
  
  // Handle license status request
  if (request.action === "getLicenseStatus") {
    chrome.storage.local.get(['premiumStatus'], (data) => {
      sendResponse({ isPremium: data.premiumStatus === true });
    });
    return true; // Keep channel open for async response
  }
  
  // Handle license change notification
  if (request.action === "licenseChanged") {
    // Broadcast to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: "licenseUpdated",
          isPremium: request.isPremium
        }).catch(() => {});
      });
    });
  }

  // Handle streak update request
  if (request.action === "updateStreak") {
    updateStreak().then(streaks => {
      sendResponse({ streaks });
    });
    return true; // Keep channel open for async response
  }

  // Handle get streak request
  if (request.action === "getStreak") {
    chrome.storage.sync.get(['streaks'], (data) => {
      sendResponse({ streaks: data.streaks || { current: 0, longest: 0, lastDate: null, badges: [] } });
    });
    return true; // Keep channel open for async response
  }
});
