# SkipIt - Dokumentation

SkipIt ist eine Browser-Erweiterung für Google Chrome zur Optimierung der Videowiedergabe. Die Erweiterung ermöglicht das automatisierte Überspringen von Segmenten (Intros, Rückblicke) und bietet eine erweiterte Steuerung der Wiedergabegeschwindigkeit.

## Kernfunktionen

### Automatisierung
- Automatisches Überspringen von Intros, Rückblicken und Abspannen auf unterstützten Plattformen.
- Unterstützte Dienste: Netflix, Disney+, Amazon Prime Video, Crunchyroll, Apple TV+ und Paramount+.

### Geschwindigkeitssteuerung
- Anpassung der Wiedergaberate zwischen 0,25x und 4,0x.
- Unterstützung für alle HTML5-Videoplayer (einschließlich YouTube und Vimeo).
- Acht konfigurierbare Presets für den Schnellzugriff.
- Speicherung der Geschwindigkeitseinstellungen pro Domäne.

## Bedienung und Tastaturkürzel

Die Steuerung erfolgt über das Popup-Interface oder folgende Tastenkombinationen:

- **+ / NumPad +**: Erhöht die Geschwindigkeit um 0,25x.
- **- / NumPad -**: Verringert die Geschwindigkeit um 0,25x.
- **1 bis 8**: Aktiviert das entsprechende Geschwindigkeits-Preset.

## Installation

### Chrome Web Store
Die Installation erfolgt regulär über den Chrome Web Store.

### Manuelle Installation (Entwicklermodus)
1. Repository klonen oder herunterladen.
2. `chrome://extensions/` im Browser öffnen und den "Entwicklermodus" aktivieren.
3. "Entpackte Erweiterung laden" wählen und das Projektverzeichnis selektieren.

## Technische Spezifikationen

- **Manifest-Version**: 3
- **Berechtigungen**: Erfordert Zugriff auf `storage` zur Sicherung von Präferenzen sowie Host-Berechtigungen für Video-Inhalte.
- **Datenschutz**: Sämtliche Daten (Statistiken und Einstellungen) werden lokal gespeichert oder via Chrome Sync synchronisiert. Es findet keine Übertragung an externe Server statt.

## Lizenz

Dieses Projekt ist freie Software und kann unter Berücksichtigung der Repository-Richtlinien verwendet und modifiziert werden.
