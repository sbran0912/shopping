# Einkaufsliste Frontend 🛒

Dies ist das Frontend für die Einkaufslisten-Applikation. Es handelt sich um eine performante Single Page Application (SPA), die mit **TypeScript** und nativem DOM-Zugriff entwickelt wurde, um maximale Geschwindigkeit und geringen Overhead zu gewährleisten.

## ✨ Features

- **Listenverwaltung**: Erstellen, Auswählen und Löschen von mehreren Einkaufslisten (z.B. "Wocheneinkauf", "Baumarkt").
- **Artikel-Management**: Hinzufügen von Artikeln mit optionalen Bemerkungen.
- **Smart Input**: Autovervollständigung für Artikelnamen basierend auf dem Katalog.
- **Status-Tracking**: Einfaches Abhaken von erledigten Positionen mit Live-Statistik (Offen vs. Erledigt).
- **Mobile Experience**: 
  - Responsive Design.
  - **Swipe-to-Delete**: Wische Artikel nach links, um sie zu löschen (wie in nativen Apps).

## 🛠 Technologie-Stack

- **Sprache**: TypeScript
- **Core**: Vanilla JS / DOM API (Kein schwergewichtiges Framework wie React/Angular)
- **Styling**: CSS & Bootstrap
- **Build Tool**: Vite

## 🚀 Installation & Start

Stelle sicher, dass [Node.js](https://nodejs.org/) auf deinem System installiert ist.

1. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```
   Die App ist anschließend unter der in der Konsole angezeigten URL erreichbar (meist `http://localhost:5173`).

3. **Für Produktion bauen**
   ```bash
   npm run build
   ```

## 🔌 Backend-Verbindung

Das Frontend erwartet ein laufendes Backend (Go-Server).
- Standard-Port: `8080`
- Falls Verbindungsfehler auftreten ("⚠️ Verbindungsfehler"), stelle sicher, dass der Server läuft und unter der konfigurierten Adresse erreichbar ist.
- Die API-Basis-URL kann in `src/api.ts` (bzw. der entsprechenden Konfigurationsdatei) angepasst werden.

## 📂 Projektstruktur

```text
src/
├── components/    # UI-Komponenten (ListCard, PositionItem, Modal, etc.)
├── utils/         # Hilfsfunktionen (DOM-Manipulation, Swipe-Handler)
├── App.ts         # Hauptlogik der Anwendung
└── styles.css     # Globale Styles
```