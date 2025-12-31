// List of officially supported streaming platforms for auto-skip
const SUPPORTED_STREAMING_PLATFORMS = [
  "netflix",
  "disney",
  "amazon",
  "crunchyroll",
  "appletv",
  "paramount",
];

// Get platform from hostname
function getPlatform(hostname) {
  if (hostname.includes("netflix.com")) return "netflix";
  else if (hostname.includes("disneyplus.com") || hostname.includes("disney+"))
    return "disney";
  else if (hostname.includes("amazon.") || hostname.includes("primevideo."))
    return "amazon";
  else if (hostname.includes("youtube.com")) return "youtube";
  else if (
    hostname.includes("crunchyroll.com") ||
    hostname.includes("static.crunchyroll.com")
  )
    return "crunchyroll";
  else if (hostname.includes("tv.apple.com")) return "appletv";
  else if (hostname.includes("paramountplus.com")) return "paramount";
  else return "generic";
}

// Check if current site is a supported streaming platform
function isSupportedStreamingPlatform(hostname) {
  const platform = getPlatform(hostname);
  return SUPPORTED_STREAMING_PLATFORMS.includes(platform);
}

document.addEventListener("DOMContentLoaded", async () => {
  const speedSlider = document.getElementById("speedSlider");
  const speedDisplay = document.getElementById("speedValue");
  const presetContainer = document.getElementById("presetContainer");
  const openOptions = document.getElementById("openOptions");
  const upgradeBanner = document.getElementById("upgradeBanner");
  const upgradeBtn = document.getElementById("upgradeBtn");
  const premiumBadge = document.getElementById("premiumBadge");
  const sliderMin = document.getElementById("sliderMin");
  const sliderMax = document.getElementById("sliderMax");

  // Initialize license checking
  await License.checkFromStorage();

  // Update UI based on license status
  updateLicenseUI();

  // Check if onboarding is needed
  checkOnboarding();

  // Check for support prompts after a delay (but not during onboarding)
  setTimeout(() => {
    chrome.storage.local.get(['onboardingCompleted'], (data) => {
      if (data.onboardingCompleted && typeof SupportPrompts !== 'undefined') {
        SupportPrompts.checkAndShow();
      }
    });
  }, 2000);

  // Add pulse animation to coffee button if user has saved significant time
  chrome.storage.sync.get(['stats'], (data) => {
    const stats = data.stats || {};
    const timeSaved = stats.totalTimeSaved || 0;
    const coffeeButton = document.getElementById("coffeeButton");
    
    // Add pulse if user has saved more than 30 minutes
    if (timeSaved > 1800 && coffeeButton) {
      coffeeButton.classList.add("pulse");
    }
  });

  function updateLicenseUI() {
    // Always full features
    const speedSlider = document.getElementById("speedSlider");
    const sliderMin = document.getElementById("sliderMin");
    const sliderMax = document.getElementById("sliderMax");

    // Unlock full speed range
    speedSlider.min = "0.25";
    speedSlider.max = "4.0";
    sliderMin.textContent = "0.25x";
    sliderMax.textContent = "4.0x";
    
    // Remove free-tier class
    speedSlider.parentElement.classList.remove("free-tier");
  }

  // Upgrade button handler (removed)

  // Theme toggle button
  const themeToggle = document.getElementById("themeToggle");

  // Load Settings & Presets
  chrome.storage.sync.get(
    ["presets", "presetNames", "darkMode", "autoSkip", "siteSettings"],
    (data) => {
      // Apply Dark Mode
      if (data.darkMode) {
        document.body.classList.add("dark-mode");
      }

      // Initialize Toggles - Check if current site is supported and enabled
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const introToggle = document.getElementById("toggleIntro");
        const recapToggle = document.getElementById("toggleRecap");

        if (tabs[0]) {
          const hostname = new URL(tabs[0].url || "").hostname;
          const platform = getPlatform(hostname);
          const isSupported = isSupportedStreamingPlatform(hostname);

          // Check if the platform is enabled in site settings (default: true)
          const siteSettings = data.siteSettings || {};
          const isPlatformEnabled = siteSettings[platform] !== false;

          // Toggles should only be active if site is supported AND enabled in settings
          const shouldEnableToggles = isSupported && isPlatformEnabled;

          if (shouldEnableToggles) {
            // Only set toggle states on supported and enabled sites
            if (introToggle)
              introToggle.checked = data.autoSkip?.introEnabled || false;
            if (recapToggle)
              recapToggle.checked = data.autoSkip?.recapEnabled || false;
          } else {
            // Disable and uncheck toggles on unsupported or disabled sites
            if (introToggle) {
              introToggle.checked = false;
              introToggle.disabled = true;
            }
            if (recapToggle) {
              recapToggle.checked = false;
              recapToggle.disabled = true;
            }
          }
        } else {
          // Fallback: if we can't get tab info, disable toggles
          if (introToggle) {
            introToggle.checked = false;
            introToggle.disabled = true;
          }
          if (recapToggle) {
            recapToggle.checked = false;
            recapToggle.disabled = true;
          }
        }
      });

      // Bind Toggle Listeners
      // Theme Toggle (Moon/Sun icon)
      themeToggle?.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-mode");
        chrome.storage.sync.set({ darkMode: isDark });
        // Notify other extension pages (options page) about the theme change
        chrome.runtime.sendMessage({
          action: "themeChanged",
          darkMode: isDark,
        });
      });

      // Intro - Only enable on supported and enabled platforms
      document
        .getElementById("toggleIntro")
        ?.addEventListener("change", (e) => {
          // Check if current site is supported and enabled before allowing toggle
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              const hostname = new URL(tabs[0].url || "").hostname;
              const platform = getPlatform(hostname);

              chrome.storage.sync.get(
                ["autoSkip", "siteSettings"],
                (current) => {
                  const siteSettings = current.siteSettings || {};
                  const isPlatformEnabled = siteSettings[platform] !== false;

                  if (
                    !isSupportedStreamingPlatform(hostname) ||
                    !isPlatformEnabled
                  ) {
                    e.target.checked = false;
                    return;
                  }

                  const enabled = e.target.checked;
                  const autoSkip = current.autoSkip || {};
                  autoSkip.introEnabled = enabled;
                  chrome.storage.sync.set({ autoSkip });
                }
              );
            }
          });
        });

      // Recap - Only enable on supported and enabled platforms
      document
        .getElementById("toggleRecap")
        ?.addEventListener("change", (e) => {
          // Check if current site is supported and enabled before allowing toggle
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              const hostname = new URL(tabs[0].url || "").hostname;
              const platform = getPlatform(hostname);

              chrome.storage.sync.get(
                ["autoSkip", "siteSettings"],
                (current) => {
                  const siteSettings = current.siteSettings || {};
                  const isPlatformEnabled = siteSettings[platform] !== false;

                  if (
                    !isSupportedStreamingPlatform(hostname) ||
                    !isPlatformEnabled
                  ) {
                    e.target.checked = false;
                    return;
                  }

                  const enabled = e.target.checked;
                  const autoSkip = current.autoSkip || {};
                  autoSkip.recapEnabled = enabled;
                  chrome.storage.sync.set({ autoSkip });
                }
              );
            }
          });
        });

      // Always show 8 presets, but mark some as Pro for free users
      const defaultPresets = [1.0, 1.25, 1.5, 1.75, 2.5, 3.0, 3.5, 4.0];
      const defaultNames = [
        "Normal",
        "1.25x",
        "1.5x",
        "1.75x",
        "2.5x",
        "3.0x",
        "3.5x",
        "4.0x",
      ];

      // Get saved presets (only first 4 for free users)
      const savedPresets = data.presets || [];
      const savedNames = data.presetNames || [];

      // Build final presets array: use saved for first 4, always use defaults for last 4
      const finalPresets = [];
      const finalNames = [];

      for (let i = 0; i < 8; i++) {
        if (i < 4) {
          // First 4: use saved if available, otherwise default
          finalPresets[i] =
            savedPresets[i] !== undefined ? savedPresets[i] : defaultPresets[i];
          finalNames[i] =
            savedNames[i] !== undefined ? savedNames[i] : defaultNames[i];
        } else {
          // Last 4: always use defaults (these are locked for free users)
          finalPresets[i] = defaultPresets[i];
          finalNames[i] = defaultNames[i];
        }
      }

      // Always use 4-column grid for 8 presets
      if (presetContainer) {
        presetContainer.style.gridTemplateColumns = "repeat(4, 1fr)";
      }

      finalPresets.forEach((val, idx) => {
        const card = document.createElement("div");
        card.className = "preset-card";

        // Check if preset should be locked for free users
        // No locking anymore
        const isLocked = false;
        if (isLocked) {
          card.classList.add("locked");
        }

        // Show preset name if available, otherwise show speed
        const displayText = finalNames[idx] || formatSpeed(val);
        card.textContent = displayText;
        card.dataset.speed = val;
        card.title = `${displayText} (${formatSpeed(val)}x)`;

        card.addEventListener("click", () => {
          if (isLocked) {
            // Show upgrade prompt for locked presets
            chrome.runtime.sendMessage({ action: "openUpgradePage" });
            return;
          }
          setSpeed(val);
        });
        presetContainer.appendChild(card);
      });
    }
  );

  // Get current speed from active tab and check if site is supported and enabled
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      // Check if current site supports skip features and is enabled in settings
      const hostname = new URL(tabs[0].url || "").hostname;
      const platform = getPlatform(hostname);
      const isSupported = isSupportedStreamingPlatform(hostname);

      // Show/disable skip toggles based on site support and settings
      const togglesSection = document.querySelector(".toggles-section");
      const introToggle = document.getElementById("toggleIntro");
      const recapToggle = document.getElementById("toggleRecap");
      const unsupportedNote = document.getElementById("unsupportedNote");

      // Also check site settings
      chrome.storage.sync.get(["siteSettings"], (data) => {
        const siteSettings = data.siteSettings || {};
        const isPlatformEnabled = siteSettings[platform] !== false;
        const shouldEnableToggles = isSupported && isPlatformEnabled;

        if (!shouldEnableToggles) {
          // Show toggles section but disable toggles and show note
          if (togglesSection) {
            togglesSection.classList.add("unsupported");
          }
          if (unsupportedNote) {
            unsupportedNote.style.display = "block";
            // Show different message based on reason
            if (isSupported && !isPlatformEnabled) {
              unsupportedNote.textContent =
                "This service is disabled in settings.";
            } else {
              unsupportedNote.textContent = "Not available on this site.";
            }
          }
        } else {
          // Show toggles section fully enabled
          if (togglesSection) {
            togglesSection.classList.remove("unsupported");
          }
          if (unsupportedNote) {
            unsupportedNote.style.display = "none";
          }
        }
      });

      // Fetch speed with retry logic for race conditions
      // (video might not be ready immediately after page load)
      const tabId = tabs[0].id;

      function fetchSpeed(retries = 3) {
        chrome.tabs.sendMessage(tabId, { action: "getSpeed" }, (response) => {
          // Handle connection errors
          if (chrome.runtime.lastError) {
            if (retries > 0) {
              setTimeout(() => fetchSpeed(retries - 1), 500);
            } else {
              // Fallback: set default speed so slider remains functional
              updateUI(1.0);
            }
            return;
          }

          if (response && response.disabled) {
            showDisabledState();
            return;
          }

          // If no video found yet, retry
          if (response && response.noVideo) {
            if (retries > 0) {
              setTimeout(() => fetchSpeed(retries - 1), 500);
            } else {
              // Fallback: set default speed so slider remains functional
              updateUI(1.0);
            }
            return;
          }

          if (response && response.speed !== undefined) {
            updateUI(response.speed);
          }
        });
      }

      fetchSpeed();
    }
  });

  function showDisabledState() {
    // Visual indication
    document.body.classList.add("disabled-state");
    speedSlider.disabled = true;
    speedDisplay.textContent = "OFF";
    presetContainer.style.pointerEvents = "none";
    presetContainer.style.opacity = "0.5";

    // Maybe show message?
    const msg = document.createElement("div");
    msg.textContent = "Extension is disabled for this site.";
    msg.style.cssText =
      "text-align: center; color: var(--color-error); font-size: 13px; margin-top: 10px;";
    document.querySelector(".speed-display-section").appendChild(msg);
  }

  let isDragging = false;

  // Event Listeners
  speedSlider.addEventListener("mousedown", () => {
    isDragging = true;
  });
  speedSlider.addEventListener("mouseup", () => {
    isDragging = false;
  });
  // Also handle case where mouse leaves window while dragging?
  speedSlider.addEventListener("mouseleave", () => {
    isDragging = false;
  });

  speedSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    setSpeed(val, false); // Don't reload slider if dragging
  });
  // Ensure isDragging is cleared on change (final commit)
  speedSlider.addEventListener("change", () => {
    isDragging = false;
  });

  if (openOptions) {
    openOptions.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // Coffee button handler
  const coffeeButton = document.getElementById("coffeeButton");
  if (coffeeButton) {
    coffeeButton.addEventListener("click", () => {
      chrome.tabs.create({ url: "https://www.buymeacoffee.com/" });
      // Track that user clicked coffee button
      chrome.storage.sync.get(['supportPrompt'], (data) => {
        const supportPrompt = data.supportPrompt || {};
        supportPrompt.supported = true;
        supportPrompt.supportedDate = Date.now();
        chrome.storage.sync.set({ supportPrompt });
      });
    });
  }

  // Keyboard Shortcuts inside Popup
  document.addEventListener("keydown", (e) => {
    // Ignore if focus is in an input (unlikely in this popup layout but good practice)
    if (e.target.matches("input") && e.target.type === "text") return;

    const key = e.key;
    let action = null;

    if (
      key === "+" ||
      key === "NumpadAdd" ||
      key === "Add" ||
      (key === "=" && e.shiftKey)
    ) {
      action = "faster";
    } else if (key === "-" || key === "NumpadSubtract" || key === "Subtract") {
      action = "slower";
    } else if (["1", "2", "3", "4", "5", "6", "7", "8"].includes(key)) {
      action = "preset" + key;
    }

    if (action) {
      e.preventDefault();
      let currentSpeed = parseFloat(speedSlider.value);

      if (action === "faster") {
        setSpeed(currentSpeed + 0.25);
      } else if (action === "slower") {
        setSpeed(currentSpeed - 0.25);
      } else if (action.startsWith("preset")) {
        const index = parseInt(action.replace("preset", "")) - 1;
        const cards = document.querySelectorAll(".preset-card");
        if (cards[index]) {
          cards[index].click();
        }
      }
    }
  });

  function setSpeed(speed, updateSlider = true) {
    // Apply license-based bounds
    speed = License.clampSpeed(speed);
    speed = Math.round(speed * 100) / 100;

    if (updateSlider) updateUI(speed);
    else updateDisplayOnly(speed);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "setSpeed",
          speed: speed,
        });
      }
    });
  }

  // Listen for updates from content script and theme changes
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "speedUpdate" && request.speed) {
      updateUI(request.speed);
    }
    // Listen for theme changes from options page
    if (request.action === "themeChanged") {
      if (request.darkMode) {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
    }
  });

  function updateUI(speed) {
    if (!isDragging) {
      speedSlider.value = speed;
    }
    updateDisplayOnly(speed);
    highlightPreset(speed);
  }

  function updateDisplayOnly(speed) {
    speedDisplay.textContent = speed.toFixed(2) + "x";
  }

  function highlightPreset(speed) {
    const cards = document.querySelectorAll(".preset-card");
    cards.forEach((card) => {
      const cardSpeed = parseFloat(card.dataset.speed);
      // Loose equality for float precision issues
      if (Math.abs(cardSpeed - speed) < 0.01) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    });
  }

  function formatSpeed(val) {
    if (Number.isInteger(val)) return val + ".0";
    return val.toString(); // e.g. 1.25
  }

  // Onboarding System
  function checkOnboarding() {
    chrome.storage.local.get(["onboardingCompleted"], (data) => {
      if (!data.onboardingCompleted) {
        showOnboarding();
      }
    });
  }

  function showOnboarding() {
    const overlay = document.getElementById("onboardingOverlay");
    const stepsContainer = document.getElementById("onboardingSteps");
    const dotsContainer = document.querySelector(".onboarding-dots");
    const prevBtn = document.getElementById("onboardingPrev");
    const nextBtn = document.getElementById("onboardingNext");
    const skipBtn = document.getElementById("skipOnboarding");

    if (!overlay || !stepsContainer) return;

    const steps = [
      {
        title: "Welcome to SkipIt!",
        content:
          "SkipIt helps you control video playback speed and automatically skip intros, recaps, and ads on streaming platforms.",
        icon: "🎬",
      },
      {
        title: "Speed Control",
        content:
          "Use the slider or presets to adjust playback speed. Press + or - keys for quick adjustments.",
        icon: "⚡",
      },
      {
        title: "Auto-Skip",
        content:
          "Enable auto-skip for intros, recaps, and ads. Works on Netflix, YouTube, Disney+, and more!",
        icon: "⏩",
      },
    ];

    let currentStep = 0;

    function renderSteps() {
      stepsContainer.innerHTML = "";
      steps.forEach((step, index) => {
        const stepEl = document.createElement("div");
        stepEl.className = `onboarding-step ${
          index === currentStep ? "active" : ""
        }`;
        stepEl.innerHTML = `
                    <div style="text-align: center; margin-bottom: 16px; font-size: 48px;">${step.icon}</div>
                    <h3 style="text-align: center; margin-bottom: 12px; font-size: 18px;">${step.title}</h3>
                    <p style="text-align: center; color: var(--color-text-secondary); line-height: 1.6;">${step.content}</p>
                `;
        stepsContainer.appendChild(stepEl);
      });

      // Update dots
      if (dotsContainer) {
        dotsContainer.innerHTML = "";
        steps.forEach((_, index) => {
          const dot = document.createElement("div");
          dot.className = `onboarding-dot ${
            index === currentStep ? "active" : ""
          }`;
          dot.addEventListener("click", () => {
            currentStep = index;
            renderSteps();
            updateButtons();
          });
          dotsContainer.appendChild(dot);
        });
      }

      updateButtons();
    }

    function updateButtons() {
      if (prevBtn) prevBtn.style.display = currentStep > 0 ? "block" : "none";
      if (nextBtn) {
        nextBtn.textContent =
          currentStep === steps.length - 1 ? "Get Started" : "Next";
      }
    }

    function nextStep() {
      if (currentStep < steps.length - 1) {
        currentStep++;
        renderSteps();
      } else {
        completeOnboarding();
      }
    }

    function prevStep() {
      if (currentStep > 0) {
        currentStep--;
        renderSteps();
      }
    }

    function completeOnboarding() {
      chrome.storage.local.set({ onboardingCompleted: true });
      overlay.style.display = "none";
    }

    if (nextBtn) nextBtn.addEventListener("click", nextStep);
    if (prevBtn) prevBtn.addEventListener("click", prevStep);
    if (skipBtn) skipBtn.addEventListener("click", completeOnboarding);

    overlay.style.display = "flex";
    renderSteps();
  }
});
