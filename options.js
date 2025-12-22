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
    { id: 'hbo', name: 'HBO Max' },
    { id: 'appletv', name: 'Apple TV+' },
    { id: 'paramount', name: 'Paramount+' },
    { id: 'peacock', name: 'Peacock' }
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

        // Presets
        const pContainer = document.getElementById('presetsContainer');
        pContainer.innerHTML = '';
        const presets = settings.presets || [1.0, 1.5, 2.0, 2.5];
        const names = settings.presetNames || ["Normal", "Speed 1.5x", "Speed 2.0x", "Speed 2.5x"];

        for (let i = 0; i < 4; i++) {
            const row = document.createElement('div');
            row.className = 'form-group';
            row.style.display = 'flex';
            row.style.gap = '10px';
            row.innerHTML = `
                <input type="text" id="pname_${i}" value="${names[i]}" placeholder="Name">
                <input type="number" id="pval_${i}" value="${presets[i]}" step="0.05" style="width: 80px">
            `;
            pContainer.appendChild(row);
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
        document.getElementById('showNotifications').checked = settings.autoSkip?.showNotifications !== false; // Default true
        document.getElementById('clickDelay').value = settings.autoSkip?.clickDelay || 500;
        document.getElementById('debugMode').checked = settings.autoSkip?.debugMode || false;

        // Stats
        if (settings.stats) {
            document.getElementById('statIntros').textContent = settings.stats.introsSkipped || 0;
            document.getElementById('statRecaps').textContent = settings.stats.recapsSkipped || 0;
        }

        // OSD
        document.getElementById('osdEnabled').checked = settings.osd?.enabled !== false;
        document.getElementById('osdPosition').value = settings.osd?.position || 'top-right';

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

        // Presets
        for (let i = 0; i < 4; i++) {
            newSettings.presetNames.push(document.getElementById(`pname_${i}`).value);
            newSettings.presets.push(parseFloat(document.getElementById(`pval_${i}`).value));
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
        newSettings.autoSkip = {
            ...existingAutoSkip, // Preserve introEnabled, recapEnabled

            introButtonClick: true,
            introFallbackSeconds: 10,
            clickDelay: parseFloat(document.getElementById('clickDelay').value),
            introSeconds: 10,
            outroEnabled: false,
            outroButtonClick: true,
            outroSeconds: 15,
            showNotifications: document.getElementById('showNotifications').checked,
            debugMode: document.getElementById('debugMode').checked
        };

        // OSD
        newSettings.osd = {
            enabled: document.getElementById('osdEnabled').checked,
            position: document.getElementById('osdPosition').value,
            duration: 2000
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

function resetStats() {
    if (confirm('Reset statistics?')) {
        chrome.storage.sync.set({
            stats: {
                introsSkipped: 0,
                recapsSkipped: 0,
                totalTimeSaved: 0
            }
        }, () => {
            loadSettings(); // Reload UI
        });
    }
}
