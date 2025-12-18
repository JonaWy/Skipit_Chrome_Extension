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
- **Intro Skip**: Automatisch ersten X Sekunden überspringen (konfigurierbar)
- **Outro Skip**: Automatisch letzte Y Sekunden überspringen (konfigurierbar)
- **Stille-Detektion**: Optional Stille-Passagen automatisch schneller abspielen
- **Per-Website-Einstellungen**: Verschiedene Skip-Einstellungen für verschiedene Domains

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
    "introSeconds": 10,
    "outroEnabled": false,
    "outroSeconds": 15,
    "silenceEnabled": false
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
   - `timeupdate` Event Listener auf Videos
   - Intro: Bei Start auf gespeicherte Sekunde springen
   - Outro: Bei Annäherung ans Ende auf Ende springen
   - Settings aus Storage laden

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