document.addEventListener('DOMContentLoaded', async () => {
    const speedSlider = document.getElementById('speedSlider');
    const speedDisplay = document.getElementById('speedValue');
    const presetContainer = document.getElementById('presetContainer');
    const openOptions = document.getElementById('openOptions');
    const upgradeBanner = document.getElementById('upgradeBanner');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const premiumBadge = document.getElementById('premiumBadge');
    const sliderMin = document.getElementById('sliderMin');
    const sliderMax = document.getElementById('sliderMax');

    // Initialize license checking
    await License.checkFromStorage();
    
    // Update UI based on license status
    updateLicenseUI();

    // Load and display streak
    loadStreak();

    // Check if onboarding is needed
    checkOnboarding();

    function updateLicenseUI() {
        if (License.isPremium) {
            // Premium user
            premiumBadge.style.display = 'inline-block';
            upgradeBanner.style.display = 'none';
            
            // Unlock full speed range
            speedSlider.min = '0.25';
            speedSlider.max = '4.0';
            sliderMin.textContent = '0.25x';
            sliderMax.textContent = '4.0x';
            
            // Remove free-tier class
            speedSlider.parentElement.classList.remove('free-tier');
        } else {
            // Free user
            premiumBadge.style.display = 'none';
            upgradeBanner.style.display = 'flex';
            
            // Limit speed range
            speedSlider.min = '1.0';
            speedSlider.max = '2.0';
            sliderMin.textContent = '1.0x';
            sliderMax.textContent = '2.0x';
            
            // Add free-tier class
            speedSlider.parentElement.classList.add('free-tier');
        }
    }

    // Upgrade button handler
    upgradeBtn?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openUpgradePage' });
    });

    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle');

    // Load Settings & Presets
    chrome.storage.sync.get(['presets', 'presetNames', 'darkMode', 'autoSkip'], (data) => {
        // Apply Dark Mode
        if (data.darkMode) {
            document.body.classList.add('dark-mode');
        }

        // Initialize Toggles
        const introToggle = document.getElementById('toggleIntro');
        const recapToggle = document.getElementById('toggleRecap');
        const skipAdsToggle = document.getElementById('toggleSkipAds');
        const skipAdsPremiumTag = document.getElementById('skipAdsPremiumTag');

        if (introToggle) introToggle.checked = data.autoSkip?.introEnabled || false;
        if (recapToggle) recapToggle.checked = data.autoSkip?.recapEnabled || false;
        if (skipAdsToggle) {
            skipAdsToggle.checked = data.autoSkip?.skipAdsEnabled || false;
            // Show premium tag if not premium
            if (skipAdsPremiumTag) {
                skipAdsPremiumTag.style.display = License.isPremium ? 'none' : 'inline-block';
            }
            // Disable if not premium
            if (!License.isPremium) {
                skipAdsToggle.disabled = true;
            }
        }

        // Bind Toggle Listeners
        // Theme Toggle (Moon/Sun icon)
        themeToggle?.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            chrome.storage.sync.set({ darkMode: isDark });
            // Notify other extension pages (options page) about the theme change
            chrome.runtime.sendMessage({ action: 'themeChanged', darkMode: isDark });
        });

        // Intro
        document.getElementById('toggleIntro')?.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            // update nested object safely
            chrome.storage.sync.get('autoSkip', (current) => {
                const autoSkip = current.autoSkip || {};
                autoSkip.introEnabled = enabled;
                chrome.storage.sync.set({ autoSkip });
            });
        });

        // Recap
        document.getElementById('toggleRecap')?.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            chrome.storage.sync.get('autoSkip', (current) => {
                const autoSkip = current.autoSkip || {};
                autoSkip.recapEnabled = enabled;
                chrome.storage.sync.set({ autoSkip });
            });
        });

        // Skip Ads
        document.getElementById('toggleSkipAds')?.addEventListener('change', (e) => {
            if (!License.isPremium) {
                e.target.checked = false;
                chrome.runtime.sendMessage({ action: 'openUpgradePage' });
                return;
            }
            const enabled = e.target.checked;
            chrome.storage.sync.get('autoSkip', (current) => {
                const autoSkip = current.autoSkip || {};
                autoSkip.skipAdsEnabled = enabled;
                chrome.storage.sync.set({ autoSkip });
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
                presetContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
            } else {
                presetContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
            }
        }

        presets.forEach((val, idx) => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            
            // Check if preset is within allowed range for free users
            const isLocked = !License.canUseSpeed(val);
            if (isLocked) {
                card.classList.add('locked');
            }
            
            // Show preset name if available, otherwise show speed
            const displayText = names[idx] || formatSpeed(val);
            card.textContent = displayText;
            card.dataset.speed = val;
            card.title = `${displayText} (${formatSpeed(val)}x)`;

            card.addEventListener('click', () => {
                if (isLocked) {
                    // Show upgrade prompt for locked presets
                    chrome.runtime.sendMessage({ action: 'openUpgradePage' });
                    return;
                }
                setSpeed(val);
            });
            presetContainer.appendChild(card);
        });
    });

    // Get current speed from active tab
    // Get current speed from active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "getSpeed" }, (response) => {
                // Ignore errors (timeouts if no video found on page)
                if (chrome.runtime.lastError) return;

                if (response && response.disabled) {
                    showDisabledState();
                    return;
                }
                if (response && response.speed !== undefined) {
                    updateUI(response.speed);
                }
            });
        }
    });

    function showDisabledState() {
        // Visual indication
        document.body.classList.add('disabled-state');
        speedSlider.disabled = true;
        speedDisplay.textContent = "OFF";
        presetContainer.style.pointerEvents = 'none';
        presetContainer.style.opacity = '0.5';

        // Maybe show message?
        const msg = document.createElement('div');
        msg.textContent = "Extension is disabled for this site.";
        msg.style.cssText = "text-align: center; color: var(--color-error); font-size: 13px; margin-top: 10px;";
        document.querySelector('.speed-display-section').appendChild(msg);
    }

    let isDragging = false;

    // Event Listeners
    speedSlider.addEventListener('mousedown', () => { isDragging = true; });
    speedSlider.addEventListener('mouseup', () => { isDragging = false; });
    // Also handle case where mouse leaves window while dragging?
    speedSlider.addEventListener('mouseleave', () => { isDragging = false; });

    speedSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        setSpeed(val, false); // Don't reload slider if dragging
    });
    // Ensure isDragging is cleared on change (final commit)
    speedSlider.addEventListener('change', () => { isDragging = false; });

    if (openOptions) {
        openOptions.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }

    // Keyboard Shortcuts inside Popup
    document.addEventListener('keydown', (e) => {
        // Ignore if focus is in an input (unlikely in this popup layout but good practice)
        if (e.target.matches('input') && e.target.type === 'text') return;

        const key = e.key;
        let action = null;

        if (key === '+' || key === 'NumpadAdd' || key === 'Add' || (key === '=' && e.shiftKey)) {
            action = 'faster';
        } else if (key === '-' || key === 'NumpadSubtract' || key === 'Subtract') {
            action = 'slower';
        } else if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(key)) {
            action = 'preset' + key;
        }

        if (action) {
            e.preventDefault();
            let currentSpeed = parseFloat(speedSlider.value);

            if (action === 'faster') {
                setSpeed(currentSpeed + 0.25);
            } else if (action === 'slower') {
                setSpeed(currentSpeed - 0.25);
            } else if (action.startsWith('preset')) {
                const index = parseInt(action.replace('preset', '')) - 1;
                const cards = document.querySelectorAll('.preset-card');
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
                chrome.tabs.sendMessage(tabs[0].id, { action: "setSpeed", speed: speed });
            }
        });
    }

    // Listen for updates from content script and theme changes
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "speedUpdate" && request.speed) {
            updateUI(request.speed);
        }
        // Listen for theme changes from options page
        if (request.action === 'themeChanged') {
            if (request.darkMode) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
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
        speedDisplay.textContent = speed.toFixed(2) + 'x';
    }

    function highlightPreset(speed) {
        const cards = document.querySelectorAll('.preset-card');
        cards.forEach(card => {
            const cardSpeed = parseFloat(card.dataset.speed);
            // Loose equality for float precision issues
            if (Math.abs(cardSpeed - speed) < 0.01) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    function formatSpeed(val) {
        if (Number.isInteger(val)) return val + '.0';
        return val.toString(); // e.g. 1.25
    }

    // Streak System
    function loadStreak() {
        chrome.runtime.sendMessage({ action: 'getStreak' }, (response) => {
            if (chrome.runtime.lastError) return;
            
            const streaks = response?.streaks || { current: 0, longest: 0, badges: [] };
            const streakDisplay = document.getElementById('streakDisplay');
            const streakValue = document.getElementById('streakValue');
            const streakBadges = document.getElementById('streakBadges');

            if (streakValue) {
                streakValue.textContent = streaks.current || 0;
            }

            if (streakDisplay) {
                streakDisplay.style.display = streaks.current > 0 ? 'block' : 'none';
            }

            // Display badges
            if (streakBadges && streaks.badges && streaks.badges.length > 0) {
                streakBadges.innerHTML = '';
                const badgeLabels = {
                    7: 'Week',
                    14: 'Fortnight',
                    30: 'Month',
                    60: '2 Months',
                    100: 'Century',
                    365: 'Year'
                };
                
                streaks.badges.forEach(badge => {
                    const badgeEl = document.createElement('span');
                    badgeEl.className = 'streak-badge';
                    badgeEl.textContent = `${badge}${badgeLabels[badge] ? ' ' + badgeLabels[badge] : ''}`;
                    streakBadges.appendChild(badgeEl);
                });
            }
        });
    }

    // Listen for new badges
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'newBadge') {
            loadStreak();
            // Show notification for new badges
            if (request.badges && request.badges.length > 0) {
                const badgeText = request.badges.map(b => `${b} days`).join(', ');
                console.log(`[SkipIt] New badge unlocked: ${badgeText}`);
            }
        }
    });

    // Onboarding System
    function checkOnboarding() {
        chrome.storage.local.get(['onboardingCompleted'], (data) => {
            if (!data.onboardingCompleted) {
                showOnboarding();
            } else {
                // Show occasional quick tips
                showQuickTip();
            }
        });
    }

    function showOnboarding() {
        const overlay = document.getElementById('onboardingOverlay');
        const stepsContainer = document.getElementById('onboardingSteps');
        const dotsContainer = document.querySelector('.onboarding-dots');
        const prevBtn = document.getElementById('onboardingPrev');
        const nextBtn = document.getElementById('onboardingNext');
        const skipBtn = document.getElementById('skipOnboarding');

        if (!overlay || !stepsContainer) return;

        const steps = [
            {
                title: 'Welcome to SkipIt!',
                content: 'SkipIt helps you control video playback speed and automatically skip intros, recaps, and ads on streaming platforms.',
                icon: '🎬'
            },
            {
                title: 'Speed Control',
                content: 'Use the slider or presets to adjust playback speed. Press + or - keys for quick adjustments.',
                icon: '⚡'
            },
            {
                title: 'Auto-Skip',
                content: 'Enable auto-skip for intros, recaps, and ads. Works on Netflix, YouTube, Disney+, and more!',
                icon: '⏩'
            },
            {
                title: 'Premium Features',
                content: 'Upgrade to unlock all platforms, speeds from 0.25x to 4x, and advanced features like mini player controls.',
                icon: '✨'
            }
        ];

        let currentStep = 0;

        function renderSteps() {
            stepsContainer.innerHTML = '';
            steps.forEach((step, index) => {
                const stepEl = document.createElement('div');
                stepEl.className = `onboarding-step ${index === currentStep ? 'active' : ''}`;
                stepEl.innerHTML = `
                    <div style="text-align: center; margin-bottom: 16px; font-size: 48px;">${step.icon}</div>
                    <h3 style="text-align: center; margin-bottom: 12px; font-size: 18px;">${step.title}</h3>
                    <p style="text-align: center; color: var(--color-text-secondary); line-height: 1.6;">${step.content}</p>
                `;
                stepsContainer.appendChild(stepEl);
            });

            // Update dots
            if (dotsContainer) {
                dotsContainer.innerHTML = '';
                steps.forEach((_, index) => {
                    const dot = document.createElement('div');
                    dot.className = `onboarding-dot ${index === currentStep ? 'active' : ''}`;
                    dot.addEventListener('click', () => {
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
            if (prevBtn) prevBtn.style.display = currentStep > 0 ? 'block' : 'none';
            if (nextBtn) {
                nextBtn.textContent = currentStep === steps.length - 1 ? 'Get Started' : 'Next';
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
            overlay.style.display = 'none';
        }

        if (nextBtn) nextBtn.addEventListener('click', nextStep);
        if (prevBtn) prevBtn.addEventListener('click', prevStep);
        if (skipBtn) skipBtn.addEventListener('click', completeOnboarding);

        overlay.style.display = 'flex';
        renderSteps();
    }

    function showQuickTip() {
        // Show random quick tip occasionally
        const tips = [
            '💡 Tip: Use keyboard shortcuts + and - to adjust speed quickly',
            '💡 Tip: Enable auto-skip in settings to save time',
            '💡 Tip: Premium users get 8 speed presets instead of 4',
            '💡 Tip: Mini player controls appear when hovering over videos (Premium)'
        ];

        // Show tip randomly (10% chance)
        if (Math.random() < 0.1) {
            const quickTips = document.getElementById('quickTips');
            const tipText = document.getElementById('quickTipText');
            const dismissBtn = document.getElementById('dismissTip');

            if (quickTips && tipText) {
                tipText.textContent = tips[Math.floor(Math.random() * tips.length)];
                quickTips.style.display = 'block';

                if (dismissBtn) {
                    dismissBtn.addEventListener('click', () => {
                        quickTips.style.display = 'none';
                    });
                }

                // Auto-hide after 5 seconds
                setTimeout(() => {
                    quickTips.style.display = 'none';
                }, 5000);
            }
        }
    }
});
