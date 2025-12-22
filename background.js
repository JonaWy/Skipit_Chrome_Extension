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

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    const defaultSettings = {
      defaultSpeed: 1.0,
      darkMode: true,
      presets: [1.0, 1.5, 2.0, 2.5],
      presetNames: ["Normal", "Speed 1.5x", "Speed 2.0x", "Speed 2.5x"],
      shortcuts: {
        faster: "+",
        slower: "-"
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
        debugMode: false
      },
      stats: {
        introsSkipped: 0,
        recapsSkipped: 0,
        totalTimeSaved: 0
      },
      osd: {
        enabled: true,
        position: "top-right",
        duration: 2000,
        opacity: 0.8
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
});
