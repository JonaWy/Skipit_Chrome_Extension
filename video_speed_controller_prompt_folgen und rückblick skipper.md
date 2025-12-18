# Prompt für Video Speed Controller+ Chrome Extension

## Projektübersicht
Erstelle eine Chrome Extension namens "Video Speed Controller+" die erweiterte Geschwindigkeitssteuerung für HTML5-Videos auf allen Websites bietet.

## Kernfunktionalitäten

### 1. Geschwindigkeitssteuerung
- **Variable Geschwindigkeit**: 0.25x bis 4.0x in 0.25er Schritten
- **Feinabstimmung**: 0.05er Schritte für präzise Anpassung
- **Standard-Geschwindigkeit**: 1.0x (normal)
- **Persistenz**: Letzte Einstellung pro Website speichern

### 2. Keyboard Shortcuts
Implementiere folgende Tastenkombinationen (alle customizable):
- `S` = Schneller (+0.25x)
- `A` = Langsamer (-0.25x)
- `D` = Reset auf 1.0x
- `Z` = Sehr langsam (0.5x)
- `X` = Doppelte Geschwindigkeit (2.0x)
- `Q` = Feinabstimmung schneller (+0.05x)
- `W` = Feinabstimmung langsamer (-0.05x)
- `R` = Zurück zu gespeicherter Standard-Geschwindigkeit
- `G` = Toggle Speed-Anzeige ein/aus

### 3. Speed Presets
- **4 speicherbare Preset-Slots**: Nutzer kann z.B. 0.75x, 1.5x, 2.0x, 2.5x speichern
- **Schnellzugriff**: Tasten `1`, `2`, `3`, `4` für direkten Zugriff
- **Preset-Verwaltung**: Im Popup konfigurierbar

### 4. Auto-Skip Funktionen
- **Intro Skip**: Automatisch "Intro überspringen" Button erkennen und klicken (Netflix, Disney+, Amazon Prime, etc.)
- **Recap/Zusammenfassungs-Skip**: Automatisch "Previously on..." und Recap-Buttons überspringen
- **Auto-Play Next Episode**: Automatisch "Nächste Folge" / "Next Episode" Buttons klicken für Serien-Binge
- **Button-Erkennung**: Intelligente Erkennung von Skip-Buttons auf verschiedenen Plattformen
- **Fallback**: Optional manueller Sekunden-Skip falls kein Button gefunden wird
- **Per-Website-Einstellungen**: Auto-Skip für verschiedene Domains aktivieren/deaktivieren
- **Unabhängige Steuerung**: Intro-Skip, Recap-Skip und Auto-Play Next sind separat aktivierbar

### 5. UI-Elemente

#### On-Screen Display (OSD)
- **Position**: Oben rechts im Video (konfigurierbar)
- **Anzeige**: Aktuelle Geschwindigkeit als Overlay (z.B. "2.0x")
- **Design**: Semi-transparent, klein, nicht störend
- **Dauer**: 2 Sekunden nach Änderung sichtbar, dann ausblenden
- **Toggle**: Ein/Aus schaltbar per Tastenkombination

#### Extension Popup
Wenn Nutzer auf Extension-Icon klickt:
- **Speed Slider**: Visueller Slider von 0.25x bis 4.0x
- **Aktuelle Geschwindigkeit**: Große Anzeige der aktuellen Speed
- **Preset-Buttons**: 4 Buttons für Presets (mit Edit-Modus)
- **Quick Actions**: Reset, +/- Buttons
- **Einstellungen**: Link zu Options-Page

#### Options Page
Detaillierte Einstellungsseite mit:
- **Keyboard Shortcuts**: Alle Shortcuts customizable
- **Preset-Verwaltung**: Namen und Werte für alle 4 Presets
- **Auto-Skip-Einstellungen**: 
  - Intro-Skip aktivieren/Sekunden
  - Outro-Skip aktivieren/Sekunden
  - Stille-Detektion aktivieren/Schwellenwert
- **OSD-Einstellungen**: Position, Größe, Transparenz, Anzeigedauer
- **Blacklist**: Websites ausschließen wo Extension nicht aktiv sein soll
- **Per-Website-Einstellungen**: Liste mit Domain-spezifischen Einstellungen

### 6. Video-Erkennung
- **Auto-Detection**: Alle HTML5 `<video>` Elemente auf der Seite finden
- **Dynamic Loading**: Auch Videos erkennen, die später geladen werden (MutationObserver)
- **Multi-Video-Support**: Wenn mehrere Videos auf Seite, auf fokussiertes Video anwenden
- **Kompatibilität**: Funktioniert auf YouTube, Vimeo, Netflix, Twitch, Coursera, Udemy, etc.

## Technische Anforderungen

### Manifest V3
```json
{
  "manifest_version": 3,
  "name": "Video Speed Controller+",
  "version": "1.0.0",
  "description": "Erweiterte Geschwindigkeitssteuerung für Videos mit Shortcuts und Presets",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["<all_urls>"],
  "background": { "service_worker": "background.js" },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["content.css"],
    "run_at": "document_end"
  }],
  "action": { "default_popup": "popup.html" },
  "options_page": "options.html",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### Dateistruktur
```
video-speed-controller/
├── manifest.json
├── background.js          (Service Worker)
├── content.js            (Haupt-Logic, Video-Control)
├── content.css           (OSD Styling)
├── popup.html            (Extension Popup)
├── popup.js              (Popup Logic)
├── popup.css             (Popup Styling)
├── options.html          (Settings Page)
├── options.js            (Settings Logic)
├── options.css           (Settings Styling)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Storage-Struktur
Verwende `chrome.storage.sync` für:
```javascript
{
  "defaultSpeed": 1.0,
  "presets": [1.25, 1.5, 2.0, 2.5],
  "presetNames": ["Langsam", "Normal+", "Schnell", "Sehr schnell"],
  "shortcuts": {
    "faster": "s",
    "slower": "a",
    "reset": "d",
    // ... alle shortcuts
  },
  "autoSkip": {
    "introEnabled": false,
    "recapEnabled": false,             // Recap/Zusammenfassungen überspringen
    "autoPlayNext": false,             // Nächste Folge automatisch starten
    "introButtonClick": true,          // Bevorzugt: Button automatisch klicken
    "introFallbackSeconds": 10,        // Fallback: Wenn kein Button gefunden
    "clickDelay": 500,                 // Verzögerung nach Button-Erkennung (ms)
    "buttonCheckInterval": 1000,       // Wie oft nach Button suchen (ms)
    "showNotifications": true          // Notifications bei Skip-Aktionen
  },
  "osd": {
    "enabled": true,
    "position": "top-right",
    "duration": 2000,
    "opacity": 0.8
  },
  "perSiteSettings": {
    "youtube.com": {
      "speed": 1.5,
      "autoSkip": { "introSeconds": 5 }
    }
    // ... weitere Domains
  },
  "blacklist": []
}
```

## Implementierungsdetails

### content.js - Hauptlogik
1. **Video-Erkennung**:
   - Beim Page Load alle `<video>` Elemente finden
   - MutationObserver für dynamisch geladene Videos
   - Event Listener für Video-Focus

2. **Speed-Anwendung**:
   - `video.playbackRate` Property setzen
   - Bounds-Checking (0.25 - 4.0)
   - OSD anzeigen bei Änderung

3. **Keyboard Listener**:
   - Event Listener auf `document` für alle Shortcuts
   - Prevent Default nur wenn Video existiert
   - Keine Interferenz mit Input-Feldern (wenn `event.target` ein Input ist, ignorieren)

4. **OSD Management**:
   - DIV-Element erstellen und über Video positionieren
   - CSS für Styling (semi-transparent, gut lesbar)
   - Timeout für Auto-Hide nach 2 Sekunden

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

### popup.js - Popup Interface
1. Speed-Slider mit Echtzeit-Update
2. Aktuelle Geschwindigkeit vom aktiven Tab holen
3. Preset-Buttons mit click handlers
4. Kommunikation mit content.js via `chrome.tabs.sendMessage`

### options.js - Settings Page
1. Alle Einstellungen aus Storage laden und anzeigen
2. Input-Felder für alle customizable Werte
3. Save-Button zum Speichern in `chrome.storage.sync`
4. Reset-Button für Standard-Einstellungen
5. Per-Site Settings Management (Add/Remove)

### background.js - Service Worker
1. Extension Install/Update Handler
2. Context Menu Items (optional, z.B. "Speed auf 2x setzen")
3. Storage-Migration bei Updates

## Design-Anforderungen

### OSD (On-Screen Display)
- **Größe**: 60x30px
- **Schrift**: 18px, bold, weiß mit schwarzem Schatten für Lesbarkeit
- **Hintergrund**: Schwarzer Hintergrund mit 80% Opacity
- **Border-Radius**: 8px
- **Position**: 20px vom rechten Rand, 20px von oben (konfigurierbar)
- **Animation**: Fade-in beim Erscheinen, Fade-out beim Verschwinden

### Popup
- **Breite**: 320px
- **Höhe**: ~400px
- **Design**: Modern, clean, dunkles Theme
- **Slider**: Große, gut greifbare Steuerung
- **Farben**: Blau/Grau Theme

### Options Page
- **Layout**: Zweispaltig, übersichtlich
- **Sektionen**: Klar getrennt mit Headers
- **Buttons**: Große, beschriftete Buttons
- **Responsiv**: Auch auf kleineren Bildschirmen nutzbar

## Testing-Checkliste
Teste die Extension auf folgenden Websites:
- [ ] YouTube (verschiedene Video-Typen)
- [ ] Netflix
- [ ] Vimeo
- [ ] Twitch
- [ ] Coursera/Udemy (Learning Platforms)
- [ ] Lokale HTML5 Video-Seiten
- [ ] Seiten mit mehreren Videos gleichzeitig

Teste folgende Szenarien:
- [ ] Alle Keyboard Shortcuts funktionieren
- [ ] Speed bleibt zwischen Page Reloads erhalten
- [ ] OSD wird korrekt angezeigt und ausgeblendet
- [ ] Presets können gespeichert und verwendet werden
- [ ] Auto-Skip funktioniert korrekt
- [ ] Keine Interferenz mit Website-eigenen Shortcuts
- [ ] Blacklist funktioniert
- [ ] Settings werden korrekt gespeichert

## Zusätzliche Features (Optional, Nice-to-have)
- **Speed History**: Letzte 5 verwendete Geschwindigkeiten speichern
- **Statistiken**: Wie viel Zeit durch Speed-Up gespart wurde
- **Sync**: Einstellungen über Chrome Sync zwischen Geräten
- **Dark/Light Theme**: Theme-Toggle für Popup und Options
- **Export/Import**: Settings als JSON exportieren/importieren
- **Rewind/Forward**: 5/10 Sekunden zurück/vor springen
- **Loop-Funktion**: A-B Loop für bestimmte Video-Abschnitte

## Wichtige Hinweise
- Verwende **keine** externen Libraries außer es ist absolut notwendig
- Code soll **clean, kommentiert und wartbar** sein
- Alle User-facing Texte sollten **lokalisierbar** sein (i18n vorbereiten)
- **Performance**: Minimaler Overhead, keine FPS-Drops im Video
- **Privacy**: Keine Daten sammeln, alles lokal speichern
- Fehlerbehandlung: Graceful degradation wenn Videos nicht unterstützt werden

---

## BUGFIXES & ÄNDERUNGEN

### Problem 1: Emoji-Encoding-Fehler im Popup
**Symptom**: Reset-Button zeigt "âŸ³" statt ⟳ und Einstellungen zeigt "âš™ï¸" statt ⚙️

**Ursache**: UTF-8 Encoding-Problem in der HTML-Datei

**Lösung**: 
1. In `popup.html` sicherstellen, dass im `<head>` folgendes steht:
   ```html
   <meta charset="UTF-8">
   ```

2. Die HTML-Datei muss als UTF-8 gespeichert werden (nicht als UTF-8 with BOM oder ANSI)

3. **Alternative Lösung** - Statt Emojis HTML-Entities oder Text verwenden:
   ```html
   <!-- Statt Emoji: -->
   <button id="resetBtn">Reset</button>
   <button id="settingsBtn">Einstellungen</button>
   
   <!-- Oder Unicode Entities: -->
   <button id="resetBtn">&#x21BB;</button>
   <button id="settingsBtn">&#x2699;&#xFE0F;</button>
   
   <!-- Oder SVG Icons für bessere Darstellung -->
   ```

4. **Empfohlene Lösung** - Verwende CSS mit ::before für Icons:
   ```css
   #resetBtn::before {
     content: "⟳";
     margin-right: 5px;
   }
   
   #settingsBtn::before {
     content: "⚙️";
     margin-right: 5px;
   }
   ```
   
   Und im HTML nur Text:
   ```html
   <button id="resetBtn">Reset</button>
   <button id="settingsBtn">Einstellungen</button>
   ```

### Problem 2: Fehlende Überschrift "Presets"
**Änderung**: Über den Preset-Buttons soll eine Überschrift "Presets" stehen

**Lösung**: In `popup.html` eine Überschrift vor den Preset-Buttons hinzufügen:

```html
<!-- Irgendwo im Popup nach dem Speed-Slider: -->
<div class="presets-section">
  <h3 class="section-title">Presets</h3>
  <div class="preset-buttons">
    <button class="preset-btn" data-preset="0">1</button>
    <button class="preset-btn" data-preset="1">2</button>
    <button class="preset-btn" data-preset="2">3</button>
    <button class="preset-btn" data-preset="3">4</button>
  </div>
</div>
```

**CSS für die Überschrift** in `popup.css`:
```css
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 15px 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Für Dark Theme: */
body.dark-theme .section-title {
  color: #e0e0e0;
}

.presets-section {
  margin-top: 20px;
}
```

### Vollständiges Beispiel für popup.html Struktur:
```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Speed Controller+</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <h2>Video Speed</h2>
    
    <!-- Speed Display -->
    <div class="speed-display">
      <span id="currentSpeed">1.00</span>x
    </div>
    
    <!-- Speed Slider -->
    <input type="range" id="speedSlider" min="0.25" max="4.0" step="0.05" value="1.0">
    
    <!-- Quick Actions -->
    <div class="quick-actions">
      <button id="slowerBtn">-</button>
      <button id="resetBtn">Reset</button>
      <button id="fasterBtn">+</button>
    </div>
    
    <!-- Presets Section -->
    <div class="presets-section">
      <h3 class="section-title">Presets</h3>
      <div class="preset-buttons">
        <button class="preset-btn" data-preset="0">
          <span class="preset-name">Preset 1</span>
          <span class="preset-value">1.25x</span>
        </button>
        <button class="preset-btn" data-preset="1">
          <span class="preset-name">Preset 2</span>
          <span class="preset-value">1.5x</span>
        </button>
        <button class="preset-btn" data-preset="2">
          <span class="preset-name">Preset 3</span>
          <span class="preset-value">2.0x</span>
        </button>
        <button class="preset-btn" data-preset="3">
          <span class="preset-name">Preset 4</span>
          <span class="preset-value">2.5x</span>
        </button>
      </div>
    </div>
    
    <!-- Settings Link -->
    <div class="footer">
      <button id="settingsBtn">Einstellungen</button>
    </div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
```

### Zusammenfassung der Änderungen:
1. ✅ `<meta charset="UTF-8">` im HTML Head hinzufügen
2. ✅ HTML-Datei als UTF-8 speichern (ohne BOM)
3. ✅ Buttons mit Text statt Emojis beschriften: "Reset" und "Einstellungen"
4. ✅ `<h3 class="section-title">Presets</h3>` über den Preset-Buttons hinzufügen
5. ✅ CSS für `.section-title` hinzufügen

---

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
    '[data-uia="player-skip-credits"]',
    '.watch-video--skip-content-button',
    'button[data-uia*="skip"]'
  ],
  
  // Disney+
  disney: [
    '[data-testid="skip-intro-button"]',
    '[data-testid="skip-credits-button"]',
    '[data-testid="skip-recap-button"]',
    '.skip-intro',
    'button[class*="SkipIntro"]',
    'button[class*="SkipRecap"]'
  ],
  
  // Amazon Prime Video
  amazon: [
    '.atvwebplayersdk-skipelement-button',
    '[aria-label*="Skip Intro"]',
    '[aria-label*="Skip Recap"]',
    '[aria-label*="Skip Credits"]',
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
    'button[class*="skip-recap"]',
    '[data-t="skip-intro-button"]',
    '[data-t="skip-recap-button"]'
  ],
  
  // HBO Max
  hbo: [
    '[aria-label="Skip Intro"]',
    '[aria-label="Skip Recap"]',
    '[aria-label="Skip Credits"]',
    'button[class*="SkipButton"]'
  ],
  
  // Apple TV+
  appletv: [
    'button[aria-label*="Skip Intro"]',
    'button[aria-label*="Skip Recap"]',
    '.skip-intro-button',
    '.skip-recap-button'
  ],
  
  // Paramount+
  paramount: [
    '[aria-label*="Skip Intro"]',
    '[aria-label*="Skip Recap"]',
    'button[class*="skip"]'
  ],
  
  // Peacock
  peacock: [
    '[aria-label*="Skip Intro"]',
    '[aria-label*="Skip Recap"]',
    'button[data-test*="skip"]'
  ],
  
  // Generische Selektoren (funktionieren auf vielen Seiten)
  generic: [
    'button[aria-label*="Skip"]',
    'button[aria-label*="Überspringen"]',
    'button[class*="skip-intro" i]',
    'button[class*="skip-recap" i]',
    'button[class*="skip-credits" i]',
    'button[id*="skip-intro" i]',
    'button[id*="skip-recap" i]',
    // Buttons mit bestimmtem Text-Content
    'button:has-text("Skip Intro")',
    'button:has-text("Skip")',
    'button:has-text("Skip Recap")',
    'button:has-text("Skip Credits")',
    'button:has-text("Intro überspringen")',
    'button:has-text("Vorspann überspringen")',
    'button:has-text("Zusammenfassung überspringen")',
    'button:has-text("Rückblick überspringen")'
  ]
};

// NEUE SELEKTOREN FÜR AUTO-PLAY NÄCHSTE FOLGE
const NEXT_EPISODE_SELECTORS = {
  // Netflix
  netflix: [
    '[data-uia="next-episode-seamless-button"]',
    '[data-uia="next-episode"]',
    'button[aria-label*="Next Episode"]',
    'button[data-uia*="next"]'
  ],
  
  // Disney+
  disney: [
    '[data-testid="next-episode-button"]',
    'button[aria-label*="Next Episode"]',
    'button[class*="NextEpisode"]'
  ],
  
  // Amazon Prime Video
  amazon: [
    '.atvwebplayersdk-nextup-button',
    '[aria-label*="Next Episode"]',
    'button[class*="next-episode"]'
  ],
  
  // YouTube
  youtube: [
    '.ytp-next-button',
    'a.ytp-next-button',
    '[aria-label*="Next video"]'
  ],
  
  // Crunchyroll
  crunchyroll: [
    '.next-episode-button',
    'button[class*="next-episode"]',
    '[data-t="next-episode-button"]'
  ],
  
  // HBO Max
  hbo: [
    '[aria-label*="Next Episode"]',
    'button[class*="NextEpisode"]'
  ],
  
  // Apple TV+
  appletv: [
    'button[aria-label*="Next Episode"]',
    '.next-episode-button'
  ],
  
  // Paramount+
  paramount: [
    '[aria-label*="Next Episode"]',
    'button[class*="next-episode"]'
  ],
  
  // Peacock
  peacock: [
    '[aria-label*="Next Episode"]',
    'button[data-test*="next-episode"]'
  ],
  
  // Generische Selektoren
  generic: [
    'button[aria-label*="Next"]',
    'button[aria-label*="Nächste Folge"]',
    'button[aria-label*="Play Next"]',
    'button[class*="next-episode" i]',
    'button[id*="next-episode" i]',
    'button:has-text("Next Episode")',
    'button:has-text("Next")',
    'button:has-text("Nächste Folge")',
    'button:has-text("Weiter")',
    'a:has-text("Next Episode")'
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
    this.skipRecapEnabled = false;
    this.autoPlayNextEnabled = false;
    this.clickedButtons = new Set(); // Verhindert doppeltes Klicken
  }

  async init() {
    // Settings laden
    const settings = await chrome.storage.sync.get('autoSkip');
    this.enabled = settings.autoSkip?.introEnabled && settings.autoSkip?.introButtonClick;
    this.skipRecapEnabled = settings.autoSkip?.recapEnabled;
    this.autoPlayNextEnabled = settings.autoSkip?.autoPlayNext;
    
    if (!this.enabled && !this.skipRecapEnabled && !this.autoPlayNextEnabled) return;
    
    this.startWatching();
  }

  startWatching() {
    // Polling: Alle X Millisekunden nach Button suchen
    this.intervalId = setInterval(() => {
      if (this.enabled || this.skipRecapEnabled) {
        this.checkForSkipButton();
      }
      if (this.autoPlayNextEnabled) {
        this.checkForNextEpisodeButton();
      }
    }, this.checkInterval);
    
    // MutationObserver: Auf neue Buttons reagieren
    this.observer = new MutationObserver(() => {
      if (this.enabled || this.skipRecapEnabled) {
        this.checkForSkipButton();
      }
      if (this.autoPlayNextEnabled) {
        this.checkForNextEpisodeButton();
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[Video Speed Controller+] Auto-Skipper aktiviert');
    console.log('- Intro Skip:', this.enabled);
    console.log('- Recap Skip:', this.skipRecapEnabled);
    console.log('- Auto-Play Next:', this.autoPlayNextEnabled);
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

      if (button && this.isButtonVisible(button) && !this.wasClicked(button)) {
        // Prüfe ob es ein Recap/Credits Button ist und ob das aktiviert ist
        const buttonText = button.textContent.toLowerCase();
        const isRecap = buttonText.includes('recap') || 
                        buttonText.includes('rückblick') || 
                        buttonText.includes('zusammenfassung') ||
                        buttonText.includes('credits') ||
                        button.getAttribute('data-uia')?.includes('recap');
        
        // Wenn es ein Recap ist, nur klicken wenn Recap-Skip aktiviert
        if (isRecap && !this.skipRecapEnabled) {
          continue;
        }
        
        // Wenn es ein Intro ist, nur klicken wenn Intro-Skip aktiviert
        const isIntro = buttonText.includes('intro') || 
                        buttonText.includes('vorspann') ||
                        button.getAttribute('data-uia')?.includes('intro');
        
        if (isIntro && !this.enabled) {
          continue;
        }
        
        this.clickButton(button, selector, isRecap ? 'Recap' : 'Intro');
        return; // Nur einen Button pro Check klicken
      }
    }
  }

  checkForNextEpisodeButton() {
    const now = Date.now();
    // Längeres Debouncing für Next Episode (10 Sekunden)
    if (now - this.lastClickTime < 10000) {
      return;
    }

    const platform = getPlatform(window.location.hostname);
    const selectors = [
      ...(NEXT_EPISODE_SELECTORS[platform] || []),
      ...NEXT_EPISODE_SELECTORS.generic
    ];

    for (const selector of selectors) {
      let button = null;
      
      if (!selector.includes(':has-text')) {
        button = document.querySelector(selector);
      } else {
        const searchText = selector.match(/\("(.+)"\)/)?.[1];
        if (searchText) {
          button = this.findButtonByText(searchText);
        }
      }

      if (button && this.isButtonVisible(button) && !this.wasClicked(button)) {
        this.clickButton(button, selector, 'Next Episode');
        return;
      }
    }
  }

  findButtonByText(text) {
    const buttons = document.querySelectorAll('button, a');
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

  wasClicked(button) {
    // Erstelle eindeutige ID für Button
    const buttonId = button.outerHTML;
    return this.clickedButtons.has(buttonId);
  }

  markAsClicked(button) {
    const buttonId = button.outerHTML;
    this.clickedButtons.add(buttonId);
    
    // Nach 30 Sekunden aus Set entfernen (falls Button erneut erscheint)
    setTimeout(() => {
      this.clickedButtons.delete(buttonId);
    }, 30000);
  }

  async clickButton(button, selector, type) {
    try {
      // Optional: Verzögerung vor dem Klick
      const settings = await chrome.storage.sync.get('autoSkip');
      const delay = settings.autoSkip?.clickDelay || 500;
      
      setTimeout(() => {
        button.click();
        this.lastClickTime = Date.now();
        this.markAsClicked(button);
        
        console.log(`[Video Speed Controller+] ${type}-Button geklickt (Selector: ${selector})`);
        
        // Optional: Visuelles Feedback (kurzes Highlight des Buttons)
        this.highlightButton(button);
        
        // Statistiken aktualisieren
        this.updateStats(type);
        
        // Optional: Notification anzeigen
        if (settings.autoSkip?.showNotifications) {
          this.showNotification(type);
        }
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

  async updateStats(type) {
    const settings = await chrome.storage.sync.get('stats');
    const stats = settings.stats || {
      introsSkipped: 0,
      recapsSkipped: 0,
      episodesAutoPlayed: 0
    };
    
    if (type === 'Intro') {
      stats.introsSkipped++;
    } else if (type === 'Recap') {
      stats.recapsSkipped++;
    } else if (type === 'Next Episode') {
      stats.episodesAutoPlayed++;
    }
    
    await chrome.storage.sync.set({ stats });
  }

  showNotification(type) {
    const messages = {
      'Intro': '⏩ Intro übersprungen',
      'Recap': '⏩ Zusammenfassung übersprungen',
      'Next Episode': '▶️ Nächste Folge wird abgespielt'
    };
    
    const notification = document.createElement('div');
    notification.textContent = messages[type] || '⏩ Übersprungen';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 999999;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    `;
    
    // CSS Animation inline
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 2500);
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
  
  <div class="setting-item">
    <label>
      <input type="checkbox" id="recapSkipEnabled">
      Zusammenfassungen & Rückblicke überspringen
    </label>
    <p class="description">
      Überspringt automatisch "Previously on..." und "Recap" Buttons
    </p>
  </div>
  
  <div class="setting-item">
    <label>
      <input type="checkbox" id="autoPlayNextEnabled">
      Nächste Folge automatisch abspielen
    </label>
    <p class="description">
      Klickt automatisch auf "Next Episode" / "Nächste Folge" Buttons
    </p>
  </div>
  
  <div class="setting-item indent">
    <label>
      <input type="radio" name="skipMethod" value="button" checked>
      Button automatisch klicken (empfohlen)
    </label>
    <p class="description">
      Erkennt und klickt automatisch Skip-Buttons auf Netflix, Disney+, Amazon Prime, etc.
    </p>
  </div>
  
  <div class="setting-item indent">
    <label>
      <input type="radio" name="skipMethod" value="time">
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
      <input type="checkbox" id="showNotifications">
      Benachrichtigungen anzeigen
    </label>
    <p class="description">
      Zeigt kurze Meldungen an wenn Intros/Recaps übersprungen werden
    </p>
  </div>
  
  <div class="setting-item">
    <label>
      <input type="checkbox" id="debugMode">
      Debug-Modus (zeigt Konsolen-Logs)
    </label>
  </div>
  
  <!-- Statistiken anzeigen -->
  <div class="stats-section">
    <h4>Statistiken</h4>
    <div class="stat-item">
      <span>Intros übersprungen:</span>
      <strong id="statIntros">0</strong>
    </div>
    <div class="stat-item">
      <span>Recaps übersprungen:</span>
      <strong id="statRecaps">0</strong>
    </div>
    <div class="stat-item">
      <span>Folgen auto-gestartet:</span>
      <strong id="statNextEpisodes">0</strong>
    </div>
    <button id="resetStats" class="secondary-btn">Statistiken zurücksetzen</button>
  </div>
</div>
```

#### 4. Testing auf verschiedenen Plattformen

**Test-Checklist:**
- [ ] Netflix: Intro-Skip Button wird erkannt und geklickt
- [ ] Netflix: Recap-Skip Button wird erkannt und geklickt
- [ ] Netflix: "Next Episode" Button wird erkannt und geklickt
- [ ] Disney+: Intro-Skip Button wird erkannt und geklickt
- [ ] Disney+: Recap-Skip Button wird erkannt und geklickt
- [ ] Disney+: "Next Episode" Button wird erkannt und geklickt
- [ ] Amazon Prime: Intro-Skip Button wird erkannt und geklickt
- [ ] Amazon Prime: Recap-Skip Button wird erkannt und geklickt
- [ ] Amazon Prime: "Next Episode" Button wird erkannt und geklickt
- [ ] YouTube: Ad-Skip Button wird erkannt (optional)
- [ ] YouTube: "Next Video" Button wird erkannt und geklickt
- [ ] Crunchyroll: Intro/Recap-Skip Buttons werden erkannt
- [ ] Crunchyroll: "Next Episode" Button wird erkannt und geklickt
- [ ] Generische Seiten mit "Skip" Buttons
- [ ] Debouncing funktioniert (nicht mehrfach klicken)
- [ ] Button wird nur geklickt wenn sichtbar
- [ ] Recap-Skip kann unabhängig von Intro-Skip aktiviert werden
- [ ] Auto-Play Next kann unabhängig aktiviert werden
- [ ] Notifications werden korrekt angezeigt
- [ ] Statistiken werden korrekt getrackt
- [ ] Performance OK (keine FPS-Drops)

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
    "recapEnabled": true,              // NEU: Recap-Skip
    "autoPlayNext": true,              // NEU: Auto-Play nächste Folge
    "introMethod": "button",           // "button" oder "time"
    "introButtonClick": true,
    "introFallbackSeconds": 10,
    "clickDelay": 500,
    "checkInterval": 1000,
    "showNotifications": true,         // NEU: Notifications anzeigen
    "debugMode": false
  },
  "stats": {
    "introsSkipped": 0,
    "recapsSkipped": 0,                // NEU: Recap Stats
    "episodesAutoPlayed": 0,           // NEU: Auto-Play Stats
    "totalTimeSaved": 0
  }
}
```