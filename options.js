const supportedSites = [
  { id: "netflix", name: "Netflix" },
  { id: "youtube", name: "YouTube" },
  { id: "disney", name: "Disney+" },
  { id: "amazon", name: "Prime Video" },
  { id: "crunchyroll", name: "Crunchyroll" },
  { id: "appletv", name: "Apple TV+" },
  { id: "paramount", name: "Paramount+" },
];

document.addEventListener("DOMContentLoaded", async () => {
  loadSettings();

  // Check for milestone-based support prompts
  // Wait a bit to let the page fully load before showing prompt
  setTimeout(() => {
    if (typeof SupportPrompts !== 'undefined') {
      SupportPrompts.checkAndShow();
    }
  }, 1000);

  // document.getElementById('saveBtn') is removed
  document.getElementById("resetBtn").addEventListener("click", resetSettings);
  document.getElementById("resetStats").addEventListener("click", resetStats);

  // Support button handlers
  document.getElementById("donateBtn")?.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://buymeacoffee.com/jonawy" });
  });

  document.getElementById("rateBtn")?.addEventListener("click", () => {
    // Replace with actual Chrome Web Store URL when published
    chrome.tabs.create({ url: "https://chrome.google.com/webstore" });
  });

  document.getElementById("shareBtn")?.addEventListener("click", () => {
    // Copy extension URL to clipboard
    const extensionUrl = "https://chrome.google.com/webstore"; // Replace with actual URL
    navigator.clipboard.writeText(extensionUrl).then(() => {
      // Show temporary feedback
      const btn = document.getElementById("shareBtn");
      const originalText = btn.querySelector(".support-option-title").textContent;
      btn.querySelector(".support-option-title").textContent = "Link copied!";
      setTimeout(() => {
        btn.querySelector(".support-option-title").textContent = originalText;
      }, 2000);
    });
  });

  document.getElementById("feedbackBtn")?.addEventListener("click", () => {
    // Open feedback form or email
    chrome.tabs.create({ url: "mailto:feedback@example.com?subject=SkipIt Feedback" });
  });

  // Theme toggle button
  const themeToggle = document.getElementById("themeToggle");
  themeToggle?.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    chrome.storage.sync.set({ darkMode: isDark });
    // Notify other extension pages (popup) about the theme change
    chrome.runtime.sendMessage({ action: "themeChanged", darkMode: isDark });
  });

  // Advanced settings collapsible section
  const advancedToggle = document.getElementById("advancedSettingsToggle");
  const advancedContent = document.getElementById("advancedSettingsContent");

  advancedToggle?.addEventListener("click", () => {
    const isExpanded = advancedToggle.getAttribute("aria-expanded") === "true";
    advancedToggle.setAttribute("aria-expanded", !isExpanded);
    advancedContent.classList.toggle("expanded", !isExpanded);

    // Save preference
    chrome.storage.local.set({ advancedSettingsExpanded: !isExpanded });
  });

  // Restore collapsed state preference
  chrome.storage.local.get("advancedSettingsExpanded", (data) => {
    if (data.advancedSettingsExpanded === true) {
      advancedToggle?.setAttribute("aria-expanded", "true");
      advancedContent?.classList.add("expanded");
    }
  });

  // Listen for theme changes from popup
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "themeChanged") {
      if (request.darkMode) {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
    }
  });
});


function formatSpeedForName(val) {
  // Format speed value as preset name (e.g., 2.0 -> "2.0", 1.25 -> "1.25")
  if (Number.isInteger(val)) {
    return val + ".0";
  }
  return val.toString();
}

function parseSpeedValue(value) {
  // Parse speed value accepting both comma and dot as decimal separator
  // Replace comma with dot for parsing
  const normalizedValue = String(value).replace(/,/g, ".");
  return parseFloat(normalizedValue);
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const debouncedSave = debounce(saveSettings, 600);

function attachAutoSave() {
  // Attach to all inputs
  const inputs = document.querySelectorAll("input, select");
  inputs.forEach((el) => {
    // Avoid double binding if called multiple times?
    // Simple way: clear old listeners? No, easier to just use { once: true } or ensure called once.
    // Since loadSettings overwrites innerHTML for some containers, new elements need new listeners.
    // Static elements (like checkboxes) only need listeners once if not overwritten.
    // But simpler: just re-attach to everything?
    // We will attach explicitly to dynamic elements in loadSettings and static ones here?
    // Let's attach to ALREADY EXISTING static inputs now, and dynamic ones in loadSettings.
    // Actually best place is in loadSettings after everything is ready.
    // But for static inputs (clickDelay etc) they exist on load.
  });
}

function loadSettings() {
  chrome.storage.sync.get(null, (settings) => {
    // Dark Mode
    if (settings.darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

    // Presets - Support up to 8 for Premium, always show all 8 slots
    const pContainer = document.getElementById("presetsContainer");
    pContainer.innerHTML = "";

    const totalPresets = 8;
    const maxEditablePresets = 8;
    const defaultPresets = [1.0, 1.25, 1.5, 1.75, 2.5, 3.0, 3.5, 4.0];

    const presets =
      settings.presets || defaultPresets.slice(0, maxEditablePresets);

    // Add info text
    const infoText = document.createElement("p");
    infoText.className = "presets-info";
    infoText.textContent = "Click any preset to edit its speed value";
    pContainer.appendChild(infoText);

    // Create preset grid
    const presetsGrid = document.createElement("div");
    presetsGrid.className = "presets-grid";
    pContainer.appendChild(presetsGrid);

    for (let i = 0; i < totalPresets; i++) {
      const isLocked = false;
      let presetValue =
        presets[i] !== undefined ? presets[i] : defaultPresets[i];
      // No clamping needed
      
      const displayValue = formatSpeedForName(presetValue);

      const presetItem = document.createElement("div");
      presetItem.className = "preset-item";

      const input = document.createElement("input");
      input.type = "text";
      input.id = `pval_${i}`;
      input.className = "preset-button-input" + (isLocked ? " locked" : "");
      input.value = displayValue;
      input.setAttribute("data-speed", presetValue);

      if (isLocked) {
        input.disabled = true;
        input.title = "Upgrade to PRO to unlock";
      } else {
        // Handle input formatting
        input.addEventListener("focus", function () {
          // Show raw number on focus for easier editing
          this.select();
        });

        input.addEventListener("blur", function () {
          // Parse and format on blur
          let val = parseSpeedValue(this.value);
          if (isNaN(val)) val = 1.0;
          // Clamp to valid range
          val = Math.max(0.25, Math.min(4.0, val));
          const formatted = formatSpeedForName(val);
          this.value = formatted;
          this.setAttribute("data-speed", val);
        });

        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            this.blur();
          }
        });
      }

      const label = document.createElement("span");
      label.className = "preset-label";
      label.textContent = `Preset ${i + 1}`;

      presetItem.appendChild(input);
      presetItem.appendChild(label);

      // Add PRO badge for locked presets (free users)
      if (isLocked) {
        const proBadge = document.createElement("span");
        proBadge.className = "preset-pro-tag";
        proBadge.textContent = "PRO";
        presetItem.appendChild(proBadge);
      }

      presetsGrid.appendChild(presetItem);
    }

    // Streaming Services - Chip/Pill Style
    const sContainer = document.getElementById("servicesContainer");
    sContainer.innerHTML = "";
    sContainer.className = "services-chips";
    const siteSettings = settings.siteSettings || {};

    // Free platforms (available without premium)
    const freePlatforms = ["netflix", "youtube"];

    supportedSites.forEach((site) => {
      const isEnabled = siteSettings[site.id] !== false; // Default true
      const isLocked = false;

      const chip = document.createElement("div");
      chip.className = "service-chip";
      chip.dataset.siteId = site.id;

      if (isEnabled && !isLocked) {
        chip.classList.add("active");
      }
      if (isLocked) {
        chip.classList.add("locked");
      }

      const proBadge = isLocked ? '<span class="pro-badge">PRO</span>' : "";
      chip.innerHTML = `${site.name}${proBadge}`;

      // Hidden checkbox for form compatibility
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `site_${site.id}`;
      checkbox.className = "toggle-checkbox";
      checkbox.style.display = "none";
      checkbox.checked = isEnabled && !isLocked;
      checkbox.disabled = isLocked;
      chip.appendChild(checkbox);

      // Click handler - disabled for locked services
      if (!isLocked) {
        chip.addEventListener("click", (e) => {
          chip.classList.toggle("active");
          checkbox.checked = chip.classList.contains("active");
          saveSettings();
        });
      } else {
        // Add tooltip for locked services
        chip.title = "Available for Pro users";
      }

      sContainer.appendChild(chip);
    });

    // Auto Skip Static Inputs
    document.getElementById("clickDelay").value =
      settings.autoSkip?.clickDelay || 500;
    document.getElementById("debugMode").checked =
      settings.autoSkip?.debugMode || false;

    // Stats
    if (settings.stats) {
      const timeSaved = settings.stats.totalTimeSaved || 0;
      const introsSkipped = settings.stats.introsSkipped || 0;
      const recapsSkipped = settings.stats.recapsSkipped || 0;
      
      document.getElementById("statTimeSaved").textContent = formatTimeSaved(timeSaved);
      document.getElementById("statIntros").textContent = introsSkipped;
      document.getElementById("statRecaps").textContent = recapsSkipped;
      
      // Show appreciation message if user has meaningful stats
      const totalSkips = introsSkipped + recapsSkipped;
      if (timeSaved > 60 || totalSkips > 5) {
        const appreciation = document.getElementById("statsAppreciation");
        const message = document.getElementById("statsAppreciationMessage");
        
        if (appreciation && message) {
          // Generate contextual message based on stats
          let msg = "";
          if (timeSaved >= 3600) {
            const hours = Math.floor(timeSaved / 3600);
            msg = `You've saved over ${hours} hour${hours !== 1 ? 's' : ''} with SkipIt!`;
          } else if (timeSaved >= 1800) {
            msg = `You've saved over 30 minutes with SkipIt!`;
          } else if (totalSkips >= 50) {
            msg = `You've skipped ${totalSkips}+ intros and recaps!`;
          } else if (totalSkips >= 20) {
            msg = `You've skipped ${totalSkips} intros and recaps so far!`;
          } else {
            msg = `You're saving time with SkipIt!`;
          }
          
          message.textContent = msg;
          appreciation.style.display = "flex";
        }
      }
    }

    // ATTACH LISTENERS TO EVERYTHING NOW
    document.querySelectorAll("input, select").forEach((el) => {
      // Checkboxes and Selects -> Immediate Save
      if (el.type === "checkbox" || el.tagName === "SELECT") {
        el.addEventListener("change", saveSettings);
      } else {
        // Text/Number inputs -> Debounced Save
        el.addEventListener("input", debouncedSave);
      }
    });
  });
}

function saveSettings() {
  chrome.storage.sync.get(["autoSkip"], (data) => {
    const existingAutoSkip = data.autoSkip || {};

    const newSettings = {
      presets: [],
      presetNames: [],
      autoSkip: {},
      osd: {},
    };

    // Presets - Support up to 8 for Premium
    const maxPresets = 8;
    newSettings.presetNames = [];
    newSettings.presets = [];

    for (let i = 0; i < maxPresets; i++) {
      const valInput = document.getElementById(`pval_${i}`);
      if (valInput) {
        // Parse the displayed value (formatted speed string like "1.5" or "2.0")
        // Accepts both comma and dot as decimal separator
        let speed = parseSpeedValue(valInput.value) || 1.0;
        // Clamp speed to valid range
        speed = Math.max(0.25, Math.min(4.0, speed));
        // Auto-generate name from speed value
        const presetName = formatSpeedForName(speed);
        newSettings.presetNames.push(presetName);
        newSettings.presets.push(speed);
      }
    }

    // Site Settings
    const siteSettings = {};
    supportedSites.forEach((site) => {
      const cb = document.getElementById(`site_${site.id}`);
      if (cb) {
        siteSettings[site.id] = cb.checked;
      } else {
        siteSettings[site.id] = true;
      }
    });
    newSettings.siteSettings = siteSettings;

    // Auto Skip (Merge with existing toggles)
    newSettings.autoSkip = {
      ...existingAutoSkip, // Preserve introEnabled, recapEnabled

      introButtonClick: true,
      introFallbackSeconds: 10,
      clickDelay: parseFloat(document.getElementById("clickDelay").value),
      introSeconds: 10,
      outroEnabled: false,
      outroButtonClick: true,
      outroSeconds: 15,
      showNotifications: true, // Always enabled, no toggle available
      debugMode: document.getElementById("debugMode").checked,
    };

    // OSD - Always enabled, no toggle available
    newSettings.osd = {
      enabled: true,
    };

    chrome.storage.sync.set(newSettings, () => {
      // Auto-save silent success
    });
  });
}

function resetSettings() {
  if (confirm("Reset all settings to default?")) {
    chrome.runtime.sendMessage({ action: "resetSettings" }); // Can be handled in background or just clear storage/reload defaults
    // Simplify: Just clear and reload
    chrome.storage.sync.clear(() => {
      // Background will re-init or we can manually invoke
      chrome.runtime.reload(); // Simple way
    });
  }
}

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

function resetStats() {
  if (confirm("Reset statistics?")) {
    chrome.storage.sync.set(
      {
        stats: {
          introsSkipped: 0,
          recapsSkipped: 0,
          totalTimeSaved: 0,
        },
      },
      () => {
        loadSettings(); // Reload UI
      }
    );
  }
}
