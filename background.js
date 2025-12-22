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
      console.log('Default settings saved');
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
});
