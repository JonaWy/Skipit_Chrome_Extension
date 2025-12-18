# Design-Überarbeitung: Video Speed Controller+ im Apple-Stil

## Design-Philosophie
Gestalte die gesamte Extension (Popup, Options Page, OSD) im minimalistischen, cleanen Apple-Design-Stil. Fokus auf Klarheit, Eleganz, Weißraum und subtile Animationen.

---

## POPUP (popup.html & popup.css)

### Layout & Struktur
```
┌─────────────────────────────┐
│   Video Speed Controller+   │  ← Header (klein, dünn)
├─────────────────────────────┤
│                             │
│         2.00x               │  ← Große, zentrale Speed-Anzeige
│                             │
│    ●────────●────────○      │  ← Minimaler Slider
│   0.25x         4.0x        │
│                             │
├─────────────────────────────┤
│   Presets                   │  ← Section-Header
│                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  │1.25│ │1.50│ │2.00│ │2.50││  ← Preset-Cards
│  └────┘ └────┘ └────┘ └────┘│
│                             │
├─────────────────────────────┤
│      ⚙ Einstellungen        │  ← Footer-Link
└─────────────────────────────┘
```

### Design-Spezifikationen

#### Farbschema
**Light Mode (Standard):**
- Background: `#FFFFFF` (reines Weiß)
- Primärfarbe: `#007AFF` (Apple Blau)
- Text Primary: `#1D1D1F` (fast Schwarz)
- Text Secondary: `#6E6E73` (Grau)
- Borders: `#D2D2D7` (hellgrau)
- Hover Background: `#F5F5F7` (sehr helles Grau)

**Dark Mode (optional, später):**
- Background: `#000000` (reines Schwarz)
- Primärfarbe: `#0A84FF` (helleres Blau)
- Text Primary: `#F5F5F7` (off-white)
- Text Secondary: `#98989D` (mittleres Grau)
- Borders: `#38383A` (dunkelgrau)
- Hover Background: `#1C1C1E` (sehr dunkles Grau)

#### Typografie
- **Font Family**: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif`
- **Header (Title)**: 
  - Font-size: `13px`
  - Font-weight: `600` (Semibold)
  - Color: Text Secondary
  - Letter-spacing: `0.5px`
  - Text-transform: `uppercase`
  - Margin-bottom: `20px`
  
- **Speed Display (große Zahl)**:
  - Font-size: `56px`
  - Font-weight: `300` (Light)
  - Color: Text Primary
  - Letter-spacing: `-1px`
  
- **Section Headers (z.B. "Presets")**:
  - Font-size: `11px`
  - Font-weight: `600` (Semibold)
  - Color: Text Secondary
  - Text-transform: `uppercase`
  - Letter-spacing: `0.8px`
  - Margin-bottom: `12px`
  
- **Preset Values**:
  - Font-size: `20px`
  - Font-weight: `500` (Medium)
  - Color: Text Primary

#### Spacing & Dimensions
- **Popup-Breite**: `340px`
- **Popup-Höhe**: Auto (ca. 450px)
- **Padding Container**: `24px`
- **Border-Radius (Cards)**: `12px`
- **Border-Radius (Buttons)**: `10px`
- **Gap zwischen Elementen**: `20px`
- **Gap zwischen Presets**: `10px`

#### Slider Design
- **Track**:
  - Height: `4px`
  - Background: `#D2D2D7` (inaktiv), `#007AFF` (aktiv)
  - Border-radius: `2px`
  
- **Thumb (Griff)**:
  - Width/Height: `20px`
  - Background: `#FFFFFF`
  - Border: `2px solid #007AFF`
  - Box-shadow: `0 2px 8px rgba(0, 0, 0, 0.12)`
  - Cursor: `pointer`
  - Transition: `transform 0.2s ease`
  - Hover: `transform: scale(1.1)`

- **Min/Max Labels**:
  - Font-size: `11px`
  - Color: Text Secondary
  - Position: Under slider, left and right aligned

#### Preset Cards
```css
.preset-card {
  background: #F5F5F7;              /* Light background */
  border: 1px solid transparent;     /* No visible border */
  border-radius: 12px;
  padding: 16px 12px;
  min-width: 70px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-card:hover {
  background: #E8E8ED;              /* Slightly darker on hover */
  transform: translateY(-2px);      /* Subtle lift */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.preset-card:active {
  transform: scale(0.96);           /* Subtle press effect */
}

.preset-card.active {
  background: #007AFF;              /* Blue when selected */
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}
```

#### Footer (Einstellungen-Link)
```css
.footer-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  color: #007AFF;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.footer-link:hover {
  background: #F5F5F7;
}

.footer-link:active {
  opacity: 0.6;
}
```

#### Animationen
```css
/* Fade in beim Öffnen */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container {
  animation: fadeIn 0.3s ease;
}

/* Alle Übergänge smooth */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## OPTIONS PAGE (options.html & options.css)

### Layout & Struktur
```
┌────────────────────────────────────────────┐
│  ← Zurück    Video Speed Controller+       │  ← Header mit Back-Button
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Tastaturkürzel                      │ │  ← Card 1
│  │  ──────────────                      │ │
│  │  [S] Schneller    [A] Langsamer      │ │
│  │  [D] Reset        [Z] 0.5x           │ │
│  │  ...                                 │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Auto-Skip Einstellungen             │ │  ← Card 2
│  │  ──────────────                      │ │
│  │  ○ Intro überspringen                │ │
│  │  ○ Zusammenfassungen überspringen    │ │
│  │  ○ Nächste Folge automatisch         │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Statistiken                         │ │  ← Card 3
│  │  ──────────────                      │ │
│  │  Intros übersprungen: 247            │ │
│  │  Recaps übersprungen: 89             │ │
│  │  Folgen auto-gestartet: 156          │ │
│  │                                      │ │
│  │  [Zurücksetzen]                      │ │
│  └──────────────────────────────────────┘ │
│                                            │
└────────────────────────────────────────────┘
```

### Design-Spezifikationen

#### Layout
- **Max-Width**: `720px`
- **Margin**: `0 auto` (zentriert)
- **Padding**: `40px 24px`
- **Background**: `#FAFAFA` (sehr helles Grau, wie macOS Settings)

#### Header
```css
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #D2D2D7;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: transparent;
  color: #007AFF;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s ease;
}

.back-button:hover {
  background: #F5F5F7;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1D1D1F;
  letter-spacing: -0.5px;
}
```

#### Settings Cards
```css
.settings-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #E5E5EA;
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F5F5F7;
}
```

#### Toggle Switches (Apple-Style)
```css
.toggle-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.toggle-label {
  font-size: 15px;
  color: #1D1D1F;
  font-weight: 400;
}

/* Custom Toggle Switch */
.toggle-switch {
  position: relative;
  width: 51px;
  height: 31px;
  background: #E5E5EA;
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.toggle-switch.active {
  background: #34C759;  /* Apple Green */
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 27px;
  height: 27px;
  background: #FFFFFF;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.toggle-switch.active::after {
  transform: translateX(20px);
}
```

#### Input Fields
```css
.input-field {
  width: 100%;
  padding: 10px 12px;
  background: #F5F5F7;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 15px;
  color: #1D1D1F;
  font-family: inherit;
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  background: #FFFFFF;
  border-color: #007AFF;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}
```

#### Buttons
```css
/* Primary Button */
.primary-button {
  padding: 10px 20px;
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-button:hover {
  background: #0051D5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.primary-button:active {
  transform: scale(0.98);
}

/* Secondary Button */
.secondary-button {
  padding: 10px 20px;
  background: #F5F5F7;
  color: #1D1D1F;
  border: 1px solid #D2D2D7;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-button:hover {
  background: #E8E8ED;
}

.secondary-button:active {
  transform: scale(0.98);
}
```

#### Statistiken Display
```css
.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F5F5F7;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 15px;
  color: #1D1D1F;
}

.stat-value {
  font-size: 17px;
  font-weight: 600;
  color: #007AFF;
}
```

---

## ON-SCREEN DISPLAY (OSD)

### Design-Spezifikationen

```css
.speed-osd {
  /* Position */
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 999999;
  
  /* Layout */
  padding: 12px 20px;
  min-width: 80px;
  
  /* Styling */
  background: rgba(0, 0, 0, 0.85);  /* Translucent black */
  backdrop-filter: blur(20px);       /* Apple's frosted glass effect */
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  
  /* Typography */
  font-size: 20px;
  font-weight: 500;
  color: #FFFFFF;
  text-align: center;
  
  /* Shadow */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  
  /* Animation */
  animation: osdFadeIn 0.2s ease, osdFadeOut 0.2s ease 2.3s forwards;
}

@keyframes osdFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes osdFadeOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
}
```

### Alternative: iOS-Style Notification
```css
.notification-osd {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 999999;
  
  display: flex;
  align-items: center;
  gap: 12px;
  
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  
  animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1),
             slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) 2.7s forwards;
}

.notification-icon {
  font-size: 24px;
}

.notification-text {
  font-size: 14px;
  font-weight: 500;
  color: #1D1D1F;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(400px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(400px);
  }
}
```

---

## ICONS & GRAFIK

### Icon-System
Verwende **SF Symbols Style** Icons (einfache, dünne Linien):
- Settings: `⚙` oder SVG Gear Icon
- Back Arrow: `‹` oder `←`
- Checkmark: `✓`
- Plus/Minus: `+` / `−`

### Icon-Größen
- Small: `16px`
- Medium: `20px`
- Large: `24px`

### Icon-Farben
- Primary Action: `#007AFF`
- Secondary: `#6E6E73`
- Success: `#34C759` (Green)
- Warning: `#FF9500` (Orange)
- Error: `#FF3B30` (Red)

---

## MICRO-INTERACTIONS

### Hover States
- **Duration**: `0.2s`
- **Easing**: `ease` oder `cubic-bezier(0.4, 0, 0.2, 1)`
- **Changes**: Background color, transform (subtle)

### Active/Press States
- **Transform**: `scale(0.96)` bis `scale(0.98)`
- **Opacity**: Reduce to `0.6` - `0.8`
- **Duration**: `0.1s`

### Focus States
- **Outline**: None (verwende stattdessen Box-Shadow)
- **Box-Shadow**: `0 0 0 4px rgba(0, 122, 255, 0.1)`
- **Background**: Slightly lighter/darker

### Loading States (falls benötigt)
```css
.loading {
  position: relative;
  pointer-events: none;
  opacity: 0.6;
}

.loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  left: 50%;
  margin: -8px 0 0 -8px;
  border: 2px solid transparent;
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## RESPONSIVE VERHALTEN

### Popup
- Feste Breite: `340px`
- Skaliert nicht (Chrome Extension Standard)

### Options Page
- **Desktop (>768px)**: Max-width `720px`, zentriert
- **Tablet (481-768px)**: Max-width `100%`, padding `32px 20px`
- **Mobile (<480px)**: Padding `24px 16px`, kleinere Font-Sizes

---

## ACCESSIBILITY

### Kontrast-Ratios
- Text Primary auf White: Mindestens `4.5:1`
- Text Secondary auf White: Mindestens `4.5:1`
- Primary Blue auf White: Mindestens `4.5:1`

### Focus Indicators
- Alle interaktiven Elemente müssen sichtbare Focus States haben
- Keyboard Navigation muss vollständig funktionieren
- Tab-Order logisch und intuitiv

### Screen Reader Support
- Alle Buttons haben `aria-label` wenn nur Icons
- Toggles haben `aria-checked` States
- Form-Felder haben `<label>` associations

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Popup Redesign
- [ ] Neue CSS-Datei mit Apple Design-System Variables
- [ ] HTML-Struktur vereinfachen und aufräumen
- [ ] Speed Display groß und zentriert
- [ ] Slider im Apple-Style
- [ ] Preset Cards mit hover/active states
- [ ] Footer mit Einstellungen-Link
- [ ] Fade-in Animation beim Öffnen

### Phase 2: Options Page Redesign
- [ ] Card-basiertes Layout
- [ ] Apple-Style Toggle Switches
- [ ] Input Fields mit Focus States
- [ ] Buttons im Apple-Style
- [ ] Statistiken-Display clean und übersichtlich
- [ ] Back-Button für Navigation

### Phase 3: OSD Redesign
- [ ] Frosted Glass Effect (backdrop-filter)
- [ ] Smooth Fade-in/Fade-out
- [ ] Optional: iOS-Style Notification variant

### Phase 4: Polish
- [ ] Alle Transitions smooth (0.2s ease)
- [ ] Hover States überall wo clickable
- [ ] Active/Press feedback überall
- [ ] Dark Mode vorbereiten (CSS Variables)
- [ ] Accessibility testen (Keyboard, Screen Reader)

---

## CSS VARIABLES SETUP

Verwende CSS Custom Properties für einfaches Theming:

```css
:root {
  /* Colors */
  --color-primary: #007AFF;
  --color-primary-hover: #0051D5;
  --color-success: #34C759;
  --color-warning: #FF9500;
  --color-error: #FF3B30;
  
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #FAFAFA;
  --color-bg-tertiary: #F5F5F7;
  
  --color-text-primary: #1D1D1F;
  --color-text-secondary: #6E6E73;
  --color-text-tertiary: #98989D;
  
  --color-border: #D2D2D7;
  --color-border-light: #E5E5EA;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  
  /* Transitions */
  --transition-fast: 0.1s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
  --transition-smooth: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-lg: 17px;
  --font-size-xl: 20px;
  --font-size-2xl: 28px;
  --font-size-3xl: 56px;
}
```

---

## WICHTIGE HINWEISE

1. **Weniger ist mehr**: Entferne überflüssige Elemente, fokussiere auf das Wesentliche
2. **Konsistenz**: Alle Abstände, Farben, Radien aus dem Design-System
3. **Subtilität**: Animationen und Effekte dezent, nicht übertrieben
4. **Performance**: backdrop-filter kann Performance-intensiv sein, sparsam einsetzen
5. **Testing**: Auf verschiedenen Displays testen (Retina vs. Non-Retina)
6. **Accessibility**: Nicht nur schön, sondern auch benutzbar für alle

---

## REFERENZEN FÜR INSPIRATION

- Apple Music Web Player
- macOS System Settings
- iOS Settings App
- Apple.com Produktseiten
- Safari Extension Popups