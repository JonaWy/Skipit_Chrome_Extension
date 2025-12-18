### 4. Auto-Skip Funktionen
- **Intro Skip**: Automatisch "Intro überspringen" Button erkennen und klicken (Netflix, Disney+, Amazon Prime, etc.)
- **Button-Erkennung**: Intelligente Erkennung von Skip-Buttons auf verschiedenen Plattformen
- **Fallback**: Optional manueller Sekunden-Skip falls kein Button gefunden wird
- **Outro Skip**: Automatisch "Nächste Folge" oder ähnliche Buttons klicken
- **Per-Website-Einstellungen**: Auto-Skip für verschiedene Domains aktivieren/deaktivieren

5. **Auto-Skip**:
   - **Intro-Button-Erkennung**: MutationObserver für dynamisch erscheinende Skip-Buttons
   - **Platform-spezifische Selektoren**:
     - Netflix: `[data-uia="player-skip-intro"]` oder `.watch-video--skip-content-button`
     - Disney+: `[data-testid="skip-intro-button"]` oder `.skip-intro`
     - Amazon Prime: `.atvwebplayersdk-skipelement-button` oder `[aria-label*="Skip"]`
     - YouTube: `.ytp-ad-skip-button` oder `.ytp-skip-ad-button`
     - Crunchyroll: `.skip-button` oder `[class*="skip"]`
     - HBO Max: `[aria-label="Skip Intro"]`
     - Apple TV+: Button mit Text "Skip Intro"
     - Generisch: Buttons mit Text "Skip", "Intro überspringen", "Vorspann überspringen"
   - **Button-Click-Simulation**: Automatisch `.click()` ausführen wenn Button erscheint
   - **Debouncing**: Nicht mehrfach klicken (z.B. nur einmal pro 5 Sekunden)
   - **Logging**: Console-Log wenn Button gefunden und geklickt wurde (für Debugging)
   - **Fallback**: Falls kein Button gefunden, optionaler manueller Sekunden-Skip
   - **Settings aus Storage**: Pro Domain aktivierbar/deaktivierbar

## FEATURE: INTELLIGENTER INTRO AUTO-SKIPPER

### Konzept
Statt feste Sekunden zu überspringen, soll die Extension automatisch "Intro überspringen" Buttons auf Streaming-Plattformen erkennen und klicken.

### Implementierung in content.js

#### 1. Platform-spezifische Button-Selektoren
Erstelle eine Mapping-Tabelle für verschiedene Plattformen:

```javascript
const SKIP_BUTTON_SELECTORS = {
  // Netflix
  netflix: [
    '[data-uia="player-skip-intro"]',
    '[data-uia="player-skip-recap"]',
    '.watch-video--skip-content-button',
    'button[data-uia*="skip"]'
  ],
  
  // Disney+
  disney: [
    '[data-testid="skip-intro-button"]',
    '[data-testid="skip-credits-button"]',
    '.skip-intro',
    'button[class*="SkipIntro"]'
  ],
  
  // Amazon Prime Video
  amazon: [
    '.atvwebplayersdk-skipelement-button',
    '[aria-label*="Skip Intro"]',
    '[aria-label*="Skip Recap"]',
    'button[class*="skip"]'
  ],
  
  // YouTube (für Ads, aber auch nützlich)
  youtube: [
    '.ytp-ad-skip-button',
    '.ytp-skip-ad-button',
    'button[aria-label*="Skip"]'
  ],
  
  // Crunchyroll
  crunchyroll: [
    '.skip-button',
    'button[class*="skip-intro"]',
    '[data-t="skip-intro-button"]'
  ],
  
  // HBO Max
  hbo: [
    '[aria-label="Skip Intro"]',
    '[aria-label="Skip Recap"]',
    'button[class*="SkipButton"]'
  ],
  
  // Apple TV+
  appletv: [
    'button[aria-label*="Skip Intro"]',
    '.skip-intro-button'
  ],
  
  // Paramount+
  paramount: [
    '[aria-label*="Skip Intro"]',
    'button[class*="skip"]'
  ],
  
  // Peacock
  peacock: [
    '[aria-label*="Skip Intro"]',
    'button[data-test*="skip"]'
  ],
  
  // Generische Selektoren (funktionieren auf vielen Seiten)
  generic: [
    'button[aria-label*="Skip"]',
    'button[aria-label*="Überspringen"]',
    'button[class*="skip-intro" i]',
    'button[class*="skip-recap" i]',
    'button[id*="skip-intro" i]',
    // Buttons mit bestimmtem Text-Content
    'button:has-text("Skip Intro")',
    'button:has-text("Skip")',
    'button:has-text("Intro überspringen")',
    'button:has-text("Vorspann überspringen")'
  ]
};

// Hilfsfunktion: Domain erkennen
function getPlatform(hostname) {
  if (hostname.includes('netflix.com')) return 'netflix';
  if (hostname.includes('disneyplus.com') || hostname.includes('disney+')) return 'disney';
  if (hostname.includes('amazon.com') || hostname.includes('primevideo.com')) return 'amazon';
  if (hostname.includes('youtube.com')) return 'youtube';
  if (hostname.includes('crunchyroll.com')) return 'crunchyroll';
  if (hostname.includes('hbo.com') || hostname.includes('hbomax.com')) return 'hbo';
  if (hostname.includes('tv.apple.com')) return 'appletv';
  if (hostname.includes('paramountplus.com')) return 'paramount';
  if (hostname.includes('peacocktv.com')) return 'peacock';
  return 'generic';
}
```

#### 2. Button-Detection und Auto-Click Funktion

```javascript
class IntroSkipper {
  constructor() {
    this.lastClickTime = 0;
    this.clickDebounceMs = 5000; // 5 Sekunden zwischen Clicks
    this.checkInterval = 1000; // Jede Sekunde checken
    this.observer = null;
    this.intervalId = null;
    this.enabled = false;
  }

  async init() {
    // Settings laden
    const settings = await chrome.storage.sync.get('autoSkip');
    this.enabled = settings.autoSkip?.introEnabled && settings.autoSkip?.introButtonClick;
    
    if (!this.enabled) return;
    
    this.startWatching();
  }

  startWatching() {
    // Polling: Alle X Millisekunden nach Button suchen
    this.intervalId = setInterval(() => {
      this.checkForSkipButton();
    }, this.checkInterval);
    
    // MutationObserver: Auf neue Buttons reagieren
    this.observer = new MutationObserver(() => {
      this.checkForSkipButton();
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[Video Speed Controller+] Intro Auto-Skipper aktiviert');
  }

  checkForSkipButton() {
    // Debounce: Nicht zu oft klicken
    const now = Date.now();
    if (now - this.lastClickTime < this.clickDebounceMs) {
      return;
    }

    const platform = getPlatform(window.location.hostname);
    const selectors = [
      ...(SKIP_BUTTON_SELECTORS[platform] || []),
      ...SKIP_BUTTON_SELECTORS.generic
    ];

    for (const selector of selectors) {
      // Versuche Button zu finden
      let button = null;
      
      // Standard querySelector
      if (!selector.includes(':has-text')) {
        button = document.querySelector(selector);
      } else {
        // Text-basierte Suche
        const searchText = selector.match(/\("(.+)"\)/)?.[1];
        if (searchText) {
          button = this.findButtonByText(searchText);
        }
      }

      if (button && this.isButtonVisible(button)) {
        this.clickButton(button, selector);
        return; // Nur einen Button pro Check klicken
      }
    }
  }

  findButtonByText(text) {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const buttonText = button.textContent.trim().toLowerCase();
      const searchText = text.toLowerCase();
      if (buttonText.includes(searchText)) {
        return button;
      }
    }
    return null;
  }

  isButtonVisible(button) {
    // Prüfe ob Button sichtbar ist
    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  async clickButton(button, selector) {
    try {
      // Optional: Verzögerung vor dem Klick
      const settings = await chrome.storage.sync.get('autoSkip');
      const delay = settings.autoSkip?.clickDelay || 500;
      
      setTimeout(() => {
        button.click();
        this.lastClickTime = Date.now();
        console.log(`[Video Speed Controller+] Intro-Button geklickt (Selector: ${selector})`);
        
        // Optional: Visuelles Feedback (kurzes Highlight des Buttons)
        this.highlightButton(button);
      }, delay);
      
    } catch (error) {
      console.error('[Video Speed Controller+] Fehler beim Klicken:', error);
    }
  }

  highlightButton(button) {
    // Kurze visuelle Bestätigung für Debugging
    const originalOutline = button.style.outline;
    button.style.outline = '3px solid #00ff00';
    setTimeout(() => {
      button.style.outline = originalOutline;
    }, 500);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Initialisierung
const introSkipper = new IntroSkipper();
introSkipper.init();
```

#### 3. Options Page Integration

In `options.html` neue Einstellungen hinzufügen:

```html
<div class="settings-section">
  <h3>Auto-Skip Einstellungen</h3>
  
  <div class="setting-item">
    <label>
      <input type="checkbox" id="introSkipEnabled">
      Intro automatisch überspringen
    </label>
  </div>
  
  <div class="setting-item indent">
    <label>
      <input type="radio" name="introSkipMethod" value="button" checked>
      Button automatisch klicken (empfohlen)
    </label>
    <p class="description">
      Erkennt und klickt automatisch "Intro überspringen" Buttons auf Netflix, Disney+, Amazon Prime, etc.
    </p>
  </div>
  
  <div class="setting-item indent">
    <label>
      <input type="radio" name="introSkipMethod" value="time">
      Feste Zeit überspringen (Fallback)
    </label>
    <input type="number" id="introFallbackSeconds" min="0" max="120" value="10">
    <span>Sekunden</span>
    <p class="description">
      Wird nur verwendet, wenn kein Button gefunden wird
    </p>
  </div>
  
  <div class="setting-item">
    <label>
      Verzögerung vor Klick:
      <input type="number" id="clickDelay" min="0" max="5000" value="500" step="100">
      ms
    </label>
    <p class="description">
      Zeit warten bevor Button geklickt wird (zur Sicherheit)
    </p>
  </div>
  
  <div class="setting-item">
    <label>
      <input type="checkbox" id="debugMode">
      Debug-Modus (zeigt Konsolen-Logs)
    </label>
  </div>
</div>
```

#### 4. Testing auf verschiedenen Plattformen


#### 5. Erweiterte Features (Optional)

```javascript
// Statistiken tracken
let skippedIntros = 0;

// Nach jedem erfolgreichen Skip
chrome.storage.sync.get('stats', (data) => {
  const stats = data.stats || { introsSkipped: 0 };
  stats.introsSkipped++;
  chrome.storage.sync.set({ stats });
});

// User-Notification (optional)
function showSkipNotification() {
  const notification = document.createElement('div');
  notification.textContent = '⏩ Intro übersprungen';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    z-index: 999999;
    font-size: 14px;
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2000);
}
```

### Wichtige Hinweise für die Implementierung
1. **Performance**: MutationObserver + Polling kombinieren für beste Erkennung
2. **Debouncing**: Unbedingt implementieren um Spam zu vermeiden
3. **Platform-Detection**: Hostname-basiert für optimale Selektoren
4. **Fallback**: Wenn kein Button gefunden, optional auf Zeit-basiertes Skip zurückfallen
5. **Sichtbarkeits-Check**: Button muss wirklich sichtbar sein (nicht `display: none`)
6. **User-Control**: User muss Feature in Settings aktivieren können
7. **Logging**: Console-Logs für Debugging (abschaltbar in Settings)
8. **Compatibility**: Selektoren regelmäßig testen, da Streaming-Seiten Updates machen

### Storage-Update
```javascript
{
  "autoSkip": {
    "introEnabled": true,
    "introMethod": "button",          // "button" oder "time"
    "introButtonClick": true,
    "introFallbackSeconds": 10,
    "clickDelay": 500,
    "checkInterval": 1000,
    "debugMode": false
  },
  "stats": {
    "introsSkipped": 0,
    "totalTimeSaved": 0
  }
}
```