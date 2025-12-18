const defaultSettings = {
    shortcuts: {
        faster: "+",
        slower: "-"
    }
};

const shortcutLabels = {
    faster: "Schneller (+0.25)",
    slower: "Langsamer (-0.25)"
};

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    document.getElementById('saveBtn').addEventListener('click', saveSettings);
    document.getElementById('resetBtn').addEventListener('click', resetSettings);
    document.getElementById('resetStats').addEventListener('click', resetStats);

    // Instant Dark Mode Preview
    document.getElementById('darkMode').addEventListener('change', (e) => {
        if (e.target.checked) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
    });
});

function loadSettings() {
    chrome.storage.sync.get(null, (settings) => {
        // Dark Mode
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkMode').checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            document.getElementById('darkMode').checked = false;
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

        // Monitor key events for hardcoded presets
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




        // Auto Skip
        document.getElementById('introEnabled').checked = settings.autoSkip?.introEnabled || false;
        document.getElementById('recapSkipEnabled').checked = settings.autoSkip?.recapEnabled || false;

        document.getElementById('showNotifications').checked = settings.autoSkip?.showNotifications !== false; // Default true

        document.getElementById('clickDelay').value = settings.autoSkip?.clickDelay || 500;

        // document.getElementById('outroEnabled').checked = settings.autoSkip?.outroEnabled || false;
        // document.getElementById('outroSeconds').value = settings.autoSkip?.outroSeconds || 15;
        document.getElementById('debugMode').checked = settings.autoSkip?.debugMode || false;

        // Stats
        if (settings.stats) {
            document.getElementById('statIntros').textContent = settings.stats.introsSkipped || 0;
            document.getElementById('statRecaps').textContent = settings.stats.recapsSkipped || 0;

        }

        // OSD
        document.getElementById('osdEnabled').checked = settings.osd?.enabled !== false;
        document.getElementById('osdPosition').value = settings.osd?.position || 'top-right';
    });
}

function saveSettings() {
    const newSettings = {
        darkMode: document.getElementById('darkMode').checked,
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

    // Auto Skip
    newSettings.autoSkip = {
        introEnabled: document.getElementById('introEnabled').checked,
        recapEnabled: document.getElementById('recapSkipEnabled').checked,

        introButtonClick: true, // Always use button click
        introFallbackSeconds: 10, // Default fallback if needed
        clickDelay: parseFloat(document.getElementById('clickDelay').value),
        introSeconds: 10,
        outroEnabled: false, // hidden/disabled for now as replaced by buttons or not prioritized
        // outroEnabled: document.getElementById('outroEnabled').checked,
        outroButtonClick: true,
        outroSeconds: 15, // Default
        showNotifications: document.getElementById('showNotifications').checked,
        debugMode: document.getElementById('debugMode').checked
    };

    // OSD
    newSettings.osd = {
        enabled: document.getElementById('osdEnabled').checked,
        position: document.getElementById('osdPosition').value,
        duration: 2000 // Keep default for now or add input
    };

    chrome.storage.sync.set(newSettings, () => {
        const btn = document.getElementById('saveBtn');
        const oldText = btn.textContent;
        btn.textContent = 'Gespeichert!';
        btn.style.background = '#0d652d';
        setTimeout(() => {
            btn.textContent = oldText;
            btn.style.background = '#8ab4f8';
        }, 1500);
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
    if (confirm('Statistiken zurücksetzen?')) {
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
