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

  function updateLicenseUI() {
    if (License.isPremium) {
      // Premium user
      premiumBadge.style.display = "inline-block";
      upgradeBanner.style.display = "none";

      // Unlock full speed range
      speedSlider.min = "0.25";
      speedSlider.max = "4.0";
      sliderMin.textContent = "0.25x";
      sliderMax.textContent = "4.0x";

      // Remove free-tier class
      speedSlider.parentElement.classList.remove("free-tier");
    } else {
      // Free user
      premiumBadge.style.display = "none";
      upgradeBanner.style.display = "flex";

      // Limit speed range
      speedSlider.min = "1.0";
      speedSlider.max = "2.0";
      sliderMin.textContent = "1.0x";
      sliderMax.textContent = "2.0x";

      // Add free-tier class
      speedSlider.parentElement.classList.add("free-tier");
    }
  }

  // Upgrade button handler
  upgradeBtn?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openUpgradePage" });
  });

  // Theme toggle button
  const themeToggle = document.getElementById("themeToggle");

  // Load Settings & Presets
  chrome.storage.sync.get(
    ["presets", "presetNames", "darkMode", "autoSkip"],
    (data) => {
      // Apply Dark Mode
      if (data.darkMode) {
        document.body.classList.add("dark-mode");
      }

      // Initialize Toggles - Check if current site is supported first
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const introToggle = document.getElementById("toggleIntro");
        const recapToggle = document.getElementById("toggleRecap");

        if (tabs[0]) {
          const hostname = new URL(tabs[0].url || "").hostname;
          const isSupported = isSupportedStreamingPlatform(hostname);

          if (isSupported) {
            // Only set toggle states on supported sites
            if (introToggle)
              introToggle.checked = data.autoSkip?.introEnabled || false;
            if (recapToggle)
              recapToggle.checked = data.autoSkip?.recapEnabled || false;
          } else {
            // Disable and uncheck toggles on unsupported sites
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

      // Intro - Only enable on supported platforms
      document
        .getElementById("toggleIntro")
        ?.addEventListener("change", (e) => {
          // Check if current site is supported before allowing toggle
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              const hostname = new URL(tabs[0].url || "").hostname;
              if (!isSupportedStreamingPlatform(hostname)) {
                e.target.checked = false;
                return;
              }

              const enabled = e.target.checked;
              // update nested object safely
              chrome.storage.sync.get("autoSkip", (current) => {
                const autoSkip = current.autoSkip || {};
                autoSkip.introEnabled = enabled;
                chrome.storage.sync.set({ autoSkip });
              });
            }
          });
        });

      // Recap - Only enable on supported platforms
      document
        .getElementById("toggleRecap")
        ?.addEventListener("change", (e) => {
          // Check if current site is supported before allowing toggle
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              const hostname = new URL(tabs[0].url || "").hostname;
              if (!isSupportedStreamingPlatform(hostname)) {
                e.target.checked = false;
                return;
              }

              const enabled = e.target.checked;
              chrome.storage.sync.get("autoSkip", (current) => {
                const autoSkip = current.autoSkip || {};
                autoSkip.recapEnabled = enabled;
                chrome.storage.sync.set({ autoSkip });
              });
            }
          });
        });

      // Determine max presets based on license
      const maxPresets = License.isPremium ? 8 : 4;
      const defaultPresets = License.isPremium
        ? [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 3.0]
        : [1.0, 1.5, 2.0, 2.5];
      const defaultNames = License.isPremium
        ? ["Normal", "1.25x", "1.5x", "1.75x", "2.0x", "2.25x", "2.5x", "3.0x"]
        : ["Normal", "1.5x", "2.0x", "2.5x"];

      const presets = (data.presets || defaultPresets).slice(0, maxPresets);
      const names = (data.presetNames || defaultNames).slice(0, maxPresets);

      // Update grid layout based on number of presets
      if (presetContainer) {
        if (maxPresets === 8) {
          presetContainer.style.gridTemplateColumns = "repeat(4, 1fr)";
        } else {
          presetContainer.style.gridTemplateColumns = "repeat(4, 1fr)";
        }
      }

      presets.forEach((val, idx) => {
        const card = document.createElement("div");
        card.className = "preset-card";

        // Check if preset is within allowed range for free users
        const isLocked = !License.canUseSpeed(val);
        if (isLocked) {
          card.classList.add("locked");
        }

        // Show preset name if available, otherwise show speed
        const displayText = names[idx] || formatSpeed(val);
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

  // Get current speed from active tab and check if site is supported
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      // Check if current site supports skip features
      const hostname = new URL(tabs[0].url || "").hostname;
      const isSupported = isSupportedStreamingPlatform(hostname);

      // Show/disable skip toggles based on site support
      const togglesSection = document.querySelector(".toggles-section");
      const introToggle = document.getElementById("toggleIntro");
      const recapToggle = document.getElementById("toggleRecap");
      const unsupportedNote = document.getElementById("unsupportedNote");

      if (!isSupported) {
        // Show toggles section but disable toggles and show note
        if (togglesSection) {
          togglesSection.classList.add("unsupported");
        }
        if (unsupportedNote) {
          unsupportedNote.style.display = "block";
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
      {
        title: "Premium Features",
        content:
          "Upgrade to unlock all platforms, speeds from 0.25x to 4x, and advanced features like mini player controls.",
        icon: "✨",
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
