const defaultSettings = {
    shortcuts: {
        faster: "+",
        slower: "-"
    }
};

const shortcutLabels = {
    faster: "Faster (+0.25)",
    slower: "Slower (-0.25)"
};
const supportedSites = [
    { id: 'netflix', name: 'Netflix' },
    { id: 'youtube', name: 'YouTube' },
    { id: 'disney', name: 'Disney+' },
    { id: 'amazon', name: 'Prime Video' },
    { id: 'crunchyroll', name: 'Crunchyroll' },
    { id: 'appletv', name: 'Apple TV+' },
    { id: 'paramount', name: 'Paramount+' }
];

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize license checking
    await License.checkFromStorage();
    
    // Update UI based on license status
    updateLicenseUI();
    
    loadSettings();

    // document.getElementById('saveBtn') is removed
    document.getElementById('resetBtn').addEventListener('click', resetSettings);
    document.getElementById('resetStats').addEventListener('click', resetStats);
    
    // Upgrade button handler
    document.getElementById('upgradeBtn')?.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openUpgradePage' });
    });
    
    // Manage subscription button handler (for premium users)
    document.getElementById('manageSubscriptionBtn')?.addEventListener('click', () => {
        // Opens the same ExtPay page, which shows subscription management for paid users
        chrome.runtime.sendMessage({ action: 'openUpgradePage' });
    });
    
    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    themeToggle?.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        chrome.storage.sync.set({ darkMode: isDark });
        // Notify other extension pages (popup) about the theme change
        chrome.runtime.sendMessage({ action: 'themeChanged', darkMode: isDark });
    });
    
    // Advanced settings collapsible section
    const advancedToggle = document.getElementById('advancedSettingsToggle');
    const advancedContent = document.getElementById('advancedSettingsContent');
    
    advancedToggle?.addEventListener('click', () => {
        const isExpanded = advancedToggle.getAttribute('aria-expanded') === 'true';
        advancedToggle.setAttribute('aria-expanded', !isExpanded);
        advancedContent.classList.toggle('expanded', !isExpanded);
        
        // Save preference
        chrome.storage.local.set({ advancedSettingsExpanded: !isExpanded });
    });
    
    // Restore collapsed state preference
    chrome.storage.local.get('advancedSettingsExpanded', (data) => {
        if (data.advancedSettingsExpanded === true) {
            advancedToggle?.setAttribute('aria-expanded', 'true');
            advancedContent?.classList.add('expanded');
        }
    });
    
    // Listen for theme changes from popup
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'themeChanged') {
            if (request.darkMode) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
    });
});

function updateLicenseUI() {
    const premiumBadge = document.getElementById('premiumBadge');
    const upgradeCard = document.getElementById('upgradeCard');
    const subscriptionCard = document.getElementById('subscriptionCard');
    const platformsPremiumTag = document.getElementById('platformsPremiumTag');
    const platformsHint = document.getElementById('platformsHint');
    
    if (License.isPremium) {
        // Premium user
        if (premiumBadge) premiumBadge.style.display = 'inline-block';
        if (upgradeCard) upgradeCard.style.display = 'none';
        if (subscriptionCard) subscriptionCard.style.display = 'block';
        if (platformsPremiumTag) platformsPremiumTag.style.display = 'none';
        if (platformsHint) platformsHint.style.display = 'none';
    } else {
        // Free user
        if (premiumBadge) premiumBadge.style.display = 'none';
        if (upgradeCard) upgradeCard.style.display = 'block';
        if (subscriptionCard) subscriptionCard.style.display = 'none';
        if (platformsPremiumTag) platformsPremiumTag.style.display = 'inline-block';
        if (platformsHint) platformsHint.style.display = 'block';
    }
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
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(el => {
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
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        // Shortcuts
        const scContainer = document.getElementById('shortcutsContainer');
        scContainer.innerHTML = '';

        // Always enforce only these two exist for display, regardless of storage garbage
        const minimalShortcuts = ['faster', 'slower'];

        minimalShortcuts.forEach(key => {
            const val = settings.shortcuts?.[key] || defaultSettings.shortcuts[key];
            const row = document.createElement('div');
            row.className = 'shortcut-row';
            row.innerHTML = `
                <label>${shortcutLabels[key] || key}</label>
                <input type="text" maxlength="1" id="sc_${key}" value="${val}">
             `;
            scContainer.appendChild(row);
        });

        // Presets - Support up to 8 for Premium
        const pContainer = document.getElementById('presetsContainer');
        pContainer.innerHTML = '';
        
        const maxPresets = License.isPremium ? 8 : 4;
        const defaultPresets = License.isPremium 
            ? [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 3.0]
            : [1.0, 1.5, 2.0, 2.5];
        const defaultNames = License.isPremium
            ? ["Normal", "1.25x", "1.5x", "1.75x", "2.0x", "2.25x", "2.5x", "3.0x"]
            : ["Normal", "1.5x", "2.0x", "2.5x"];

        const presets = (settings.presets || defaultPresets).slice(0, maxPresets);
        const names = (settings.presetNames || defaultNames).slice(0, maxPresets);

        // Add info text
        const infoText = document.createElement('p');
        infoText.className = 'description';
        infoText.style.marginBottom = '12px';
        infoText.textContent = License.isPremium 
            ? 'Customize up to 8 speed presets' 
            : 'Free: 4 presets. Upgrade for 8 presets.';
        pContainer.appendChild(infoText);

        for (let i = 0; i < maxPresets; i++) {
            const row = document.createElement('div');
            row.className = 'form-group';
            row.style.display = 'flex';
            row.style.gap = '10px';
            row.style.alignItems = 'center';
            row.style.marginBottom = '8px';
            
            const presetValue = presets[i] !== undefined ? presets[i] : defaultPresets[i];
            const presetName = names[i] !== undefined ? names[i] : defaultNames[i];
            
            row.innerHTML = `
                <label style="min-width: 60px; font-size: 13px;">Preset ${i + 1}:</label>
                <input type="text" id="pname_${i}" value="${presetName}" placeholder="Name" style="flex: 1;">
                <input type="number" id="pval_${i}" value="${presetValue}" step="0.05" min="0.25" max="4.0" style="width: 80px">
            `;
            pContainer.appendChild(row);
        }

        // Add upgrade prompt for free users
        if (!License.isPremium && maxPresets < 8) {
            const upgradePrompt = document.createElement('div');
            upgradePrompt.className = 'upgrade-prompt';
            upgradePrompt.style.marginTop = '12px';
            upgradePrompt.style.padding = '12px';
            upgradePrompt.style.background = 'var(--color-bg-tertiary)';
            upgradePrompt.style.borderRadius = '8px';
            upgradePrompt.innerHTML = `
                <p style="margin: 0 0 8px 0; font-size: 13px;">Unlock 8 presets with Premium!</p>
                <button id="upgradePresetsBtn" class="primary-button" style="width: 100%; padding: 8px;">Upgrade Now</button>
            `;
            pContainer.appendChild(upgradePrompt);
            
            document.getElementById('upgradePresetsBtn')?.addEventListener('click', () => {
                chrome.runtime.sendMessage({ action: 'openUpgradePage' });
            });
        }

        // Streaming Services
        const sContainer = document.getElementById('servicesContainer');
        sContainer.innerHTML = '';
        const siteSettings = settings.siteSettings || {};

        // Free platforms (available without premium)
        const freePlatforms = ['netflix', 'youtube'];

        supportedSites.forEach(site => {
            const isEnabled = siteSettings[site.id] !== false; // Default true
            const isLocked = !License.isPremium && !freePlatforms.includes(site.id);
            
            const div = document.createElement('label');
            div.className = 'toggle-container service-item' + (isLocked ? ' locked' : '');
            
            const lockIcon = isLocked ? '<span class="pro-tag">PRO</span>' : '';
            const disabledAttr = isLocked ? 'disabled' : '';
            
            div.innerHTML = `
                <span class="toggle-label">${site.name}${lockIcon}</span>
                <input type="checkbox" id="site_${site.id}" class="toggle-checkbox" ${isEnabled && !isLocked ? 'checked' : ''} ${disabledAttr}>
                <span class="toggle-switch"></span>
            `;
            sContainer.appendChild(div);
            
            // If locked, show upgrade prompt on click
            if (isLocked) {
                div.addEventListener('click', (e) => {
                    e.preventDefault();
                    chrome.runtime.sendMessage({ action: 'openUpgradePage' });
                });
            }
        });

        // Auto Skip Static Inputs
        const skipAdsEnabled = document.getElementById('skipAdsEnabled');
        const skipAdsPremiumTag = document.getElementById('skipAdsPremiumTagOptions');
        if (skipAdsEnabled) {
            skipAdsEnabled.checked = settings.autoSkip?.skipAdsEnabled || false;
            if (skipAdsPremiumTag) {
                skipAdsPremiumTag.style.display = License.isPremium ? 'none' : 'inline-block';
            }
            if (!License.isPremium) {
                skipAdsEnabled.disabled = true;
            }
        }
        document.getElementById('showNotifications').checked = settings.autoSkip?.showNotifications !== false; // Default true
        document.getElementById('clickDelay').value = settings.autoSkip?.clickDelay || 500;
        document.getElementById('debugMode').checked = settings.autoSkip?.debugMode || false;

        // Stats
        if (settings.stats) {
            document.getElementById('statIntros').textContent = settings.stats.introsSkipped || 0;
            document.getElementById('statRecaps').textContent = settings.stats.recapsSkipped || 0;
            document.getElementById('statAds').textContent = settings.stats.adsSkipped || 0;
            document.getElementById('statTimeSaved').textContent = formatTimeSaved(settings.stats.totalTimeSaved || 0);
        }

        // OSD
        const osdEnabled = document.getElementById('osdEnabled');
        const osdPosition = document.getElementById('osdPosition');
        const osdFontSize = document.getElementById('osdFontSize');
        const osdFontSizeValue = document.getElementById('osdFontSizeValue');
        const osdFontFamily = document.getElementById('osdFontFamily');
        const osdTextColor = document.getElementById('osdTextColor');
        const osdOpacity = document.getElementById('osdOpacity');
        const osdOpacityValue = document.getElementById('osdOpacityValue');
        const osdShowInfo = document.getElementById('osdShowInfo');

        if (osdEnabled) osdEnabled.checked = settings.osd?.enabled !== false;
        if (osdPosition) osdPosition.value = settings.osd?.position || 'top-right';
        
        // Advanced OSD options (Premium)
        const isPremium = License.isPremium;
        const premiumTags = ['osdAdvancedPremiumTag', 'osdSizePremiumTag', 'osdFontPremiumTag', 
                            'osdColorPremiumTag', 'osdOpacityPremiumTag', 'osdInfoPremiumTag'];
        premiumTags.forEach(tagId => {
            const tag = document.getElementById(tagId);
            if (tag) tag.style.display = isPremium ? 'none' : 'inline-block';
        });

        if (osdFontSize) {
            osdFontSize.value = settings.osd?.fontSize || 20;
            osdFontSize.disabled = !isPremium;
            if (osdFontSizeValue) {
                osdFontSizeValue.textContent = `${osdFontSize.value}px`;
            }
            osdFontSize.addEventListener('input', (e) => {
                if (osdFontSizeValue) {
                    osdFontSizeValue.textContent = `${e.target.value}px`;
                }
            });
        }

        if (osdFontFamily) {
            osdFontFamily.value = settings.osd?.fontFamily || 'system';
            osdFontFamily.disabled = !isPremium;
        }

        if (osdTextColor) {
            osdTextColor.value = settings.osd?.textColor || '#FFFFFF';
            osdTextColor.disabled = !isPremium;
        }

        if (osdOpacity) {
            osdOpacity.value = settings.osd?.opacity !== undefined ? settings.osd.opacity * 100 : 75;
            osdOpacity.disabled = !isPremium;
            if (osdOpacityValue) {
                osdOpacityValue.textContent = `${osdOpacity.value}%`;
            }
            osdOpacity.addEventListener('input', (e) => {
                if (osdOpacityValue) {
                    osdOpacityValue.textContent = `${e.target.value}%`;
                }
            });
        }

        if (osdShowInfo) {
            osdShowInfo.checked = settings.osd?.showInfo || false;
            osdShowInfo.disabled = !isPremium;
        }

        // ATTACH LISTENERS TO EVERYTHING NOW
        document.querySelectorAll('input, select').forEach(el => {
            // Checkboxes and Selects -> Immediate Save
            if (el.type === 'checkbox' || el.tagName === 'SELECT') {
                el.addEventListener('change', saveSettings);
            } else {
                // Text/Number inputs -> Debounced Save
                el.addEventListener('input', debouncedSave);
            }
        });
    });
}

function saveSettings() {
    chrome.storage.sync.get(['autoSkip'], (data) => {
        const existingAutoSkip = data.autoSkip || {};

        const newSettings = {
            shortcuts: {},
            presets: [],
            presetNames: [],
            autoSkip: {},
            osd: {}
        };

        // Shortcuts
        document.querySelectorAll('[id^="sc_"]').forEach(input => {
            const key = input.id.replace('sc_', '');
            newSettings.shortcuts[key] = input.value.toLowerCase();
        });

        // Presets - Support up to 8 for Premium
        const maxPresets = License.isPremium ? 8 : 4;
        newSettings.presetNames = [];
        newSettings.presets = [];
        
        for (let i = 0; i < maxPresets; i++) {
            const nameInput = document.getElementById(`pname_${i}`);
            const valInput = document.getElementById(`pval_${i}`);
            if (nameInput && valInput) {
                newSettings.presetNames.push(nameInput.value || `Preset ${i + 1}`);
                const speed = parseFloat(valInput.value) || 1.0;
                // Clamp speed to allowed range
                const clampedSpeed = License.clampSpeed(speed);
                newSettings.presets.push(clampedSpeed);
            }
        }

        // Site Settings
        const siteSettings = {};
        supportedSites.forEach(site => {
            const cb = document.getElementById(`site_${site.id}`);
            if (cb) {
                siteSettings[site.id] = cb.checked;
            } else {
                siteSettings[site.id] = true;
            }
        });
        newSettings.siteSettings = siteSettings;

        // Auto Skip (Merge with existing toggles)
        const skipAdsCheckbox = document.getElementById('skipAdsEnabled');
        const skipAdsValue = skipAdsCheckbox && License.isPremium ? skipAdsCheckbox.checked : false;
        
        newSettings.autoSkip = {
            ...existingAutoSkip, // Preserve introEnabled, recapEnabled

            introButtonClick: true,
            introFallbackSeconds: 10,
            clickDelay: parseFloat(document.getElementById('clickDelay').value),
            introSeconds: 10,
            outroEnabled: false,
            outroButtonClick: true,
            outroSeconds: 15,
            skipAdsEnabled: skipAdsValue,
            showNotifications: document.getElementById('showNotifications').checked,
            debugMode: document.getElementById('debugMode').checked
        };

        // OSD
        const osdEnabledEl = document.getElementById('osdEnabled');
        const osdPositionEl = document.getElementById('osdPosition');
        const osdFontSizeEl = document.getElementById('osdFontSize');
        const osdFontFamilyEl = document.getElementById('osdFontFamily');
        const osdTextColorEl = document.getElementById('osdTextColor');
        const osdOpacityEl = document.getElementById('osdOpacity');
        const osdShowInfoEl = document.getElementById('osdShowInfo');

        newSettings.osd = {
            enabled: osdEnabledEl ? osdEnabledEl.checked : true,
            position: osdPositionEl ? osdPositionEl.value : 'top-right',
            duration: 2000,
            fontSize: License.isPremium && osdFontSizeEl ? parseInt(osdFontSizeEl.value) : 20,
            fontFamily: License.isPremium && osdFontFamilyEl ? osdFontFamilyEl.value : 'system',
            textColor: License.isPremium && osdTextColorEl ? osdTextColorEl.value : '#FFFFFF',
            opacity: License.isPremium && osdOpacityEl ? parseFloat(osdOpacityEl.value) / 100 : 0.75,
            showInfo: License.isPremium && osdShowInfoEl ? osdShowInfoEl.checked : false
        };

        chrome.storage.sync.set(newSettings, () => {
            // Auto-save silent success
        });
    });
}

function resetSettings() {
    if (confirm('Reset all settings to default?')) {
        chrome.runtime.sendMessage({ action: 'resetSettings' }); // Can be handled in background or just clear storage/reload defaults
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
    if (confirm('Reset statistics?')) {
        chrome.storage.sync.set({
            stats: {
                introsSkipped: 0,
                recapsSkipped: 0,
                adsSkipped: 0,
                totalTimeSaved: 0
            }
        }, () => {
            loadSettings(); // Reload UI
        });
    }
}
