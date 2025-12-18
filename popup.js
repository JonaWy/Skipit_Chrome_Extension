document.addEventListener('DOMContentLoaded', () => {
    const speedSlider = document.getElementById('speedSlider');
    const speedDisplay = document.getElementById('speedValue');
    const presetContainer = document.getElementById('presetContainer');
    const openOptions = document.getElementById('openOptions');

    // Load Settings & Presets
    chrome.storage.sync.get(['presets', 'presetNames', 'darkMode'], (data) => {
        // Apply Dark Mode
        if (data.darkMode) {
            document.body.classList.add('dark-mode');
        }

        const presets = data.presets || [1.0, 1.5, 2.0, 2.5];
        const names = data.presetNames || ["Normal", "1.5x", "2.0x", "2.5x"];

        presets.forEach((val, idx) => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            // Use name if short, else value? Design has values like "1.25". 
            // If user named it "Speed 1.5x" it might be long. 
            // Let's stick to values for the card display as per ASCII art, or try to use name if fits.
            // The prompt ASCII shows "1.25", "1.50". 
            // The user settings might have names.
            // I'll show the value formatted nicely.
            card.textContent = formatSpeed(val);
            card.dataset.speed = val;

            card.addEventListener('click', () => {
                setSpeed(val);
            });
            presetContainer.appendChild(card);
        });
    });

    // Get current speed from active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "getSpeed" }, (response) => {
                if (response && response.speed !== undefined) {
                    updateUI(response.speed);
                }
            });
        }
    });

    // Event Listeners
    speedSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        setSpeed(val, false); // Don't reload slider if dragging
    });

    if (openOptions) {
        openOptions.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }

    function setSpeed(speed, updateSlider = true) {
        // Bounds
        speed = Math.max(0.25, Math.min(4.0, speed));
        speed = Math.round(speed * 100) / 100;

        if (updateSlider) updateUI(speed);
        else updateDisplayOnly(speed);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "setSpeed", speed: speed });
            }
        });
    }

    function updateUI(speed) {
        speedSlider.value = speed;
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
