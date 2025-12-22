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

    // Load Settings & Presets
    chrome.storage.sync.get(['presets', 'presetNames', 'darkMode', 'autoSkip'], (data) => {
        // Apply Dark Mode
        if (data.darkMode) {
            document.body.classList.add('dark-mode');
            const dmToggle = document.getElementById('toggleDarkMode');
            if (dmToggle) dmToggle.checked = true;
        }

        // Initialize Toggles
        const introToggle = document.getElementById('toggleIntro');
        const recapToggle = document.getElementById('toggleRecap');

        if (introToggle) introToggle.checked = data.autoSkip?.introEnabled || false;
        if (recapToggle) recapToggle.checked = data.autoSkip?.recapEnabled || false;

        // Bind Toggle Listeners
        // Dark Mode
        document.getElementById('toggleDarkMode')?.addEventListener('change', (e) => {
            const isDark = e.target.checked;
            if (isDark) document.body.classList.add('dark-mode');
            else document.body.classList.remove('dark-mode');
            chrome.storage.sync.set({ darkMode: isDark });
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

        const presets = data.presets || [1.0, 1.5, 2.0, 2.5];
        const names = data.presetNames || ["Normal", "1.5x", "2.0x", "2.5x"];

        presets.forEach((val, idx) => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            
            // Check if preset is within allowed range for free users
            const isLocked = !License.canUseSpeed(val);
            if (isLocked) {
                card.classList.add('locked');
            }
            
            card.textContent = formatSpeed(val);
            card.dataset.speed = val;

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
        } else if (['1', '2', '3', '4'].includes(key)) {
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

    // Listen for updates from content script
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "speedUpdate" && request.speed) {
            updateUI(request.speed);
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
});
