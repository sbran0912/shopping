# Einkaufsliste Frontend - Vanilla TypeScript

Modernes Frontend mit **reinem TypeScript** - ohne Framework, ohne Decorators, ohne Magic!

## ✨ Features

- ✅ **Vanilla TypeScript** - Pure JavaScript, keine Framework-Abstraktion
- ✅ **Swipe-to-Delete** - Wische nach links um Artikel zu löschen (Touch + Mouse)
- ✅ **Autocomplete** - Vorschläge aus Artikel-Datenbank
- ✅ **Smooth Animationen** - CSS-basierte Transitions
- ✅ **Modulare Architektur** - Saubere Komponenten-Struktur
- ✅ **TypeScript** - Volle Typsicherheit
- ✅ **Responsive** - Mobile & Desktop

## 🚀 Installation

```bash
cd frontend-vanilla

# Dependencies installieren
npm install

# Dev-Server starten (Backend muss auf :8080 laufen!)
npm run dev
```

Die App läuft dann auf `http://localhost:3000`

## 📦 Voraussetzungen

- Node.js 18+
- Backend-API auf Port 8080

## 🎯 Warum Vanilla TypeScript?

### Vorteile
- ✅ **Keine Decorators** - Pure JavaScript/TypeScript
- ✅ **Keine Magic** - Du siehst genau was passiert
- ✅ **Klein** - Nur dein Code, kein Framework-Overhead
- ✅ **Schnell** - Native DOM-APIs sind super performant
- ✅ **Lerneffekt** - Verstehe wie Browser wirklich funktionieren
- ✅ **Flexibel** - Volle Kontrolle über alles

### Nachteile
- ❌ Etwas mehr Boilerplate als mit Framework
- ❌ Kein Virtual DOM (aber bei dieser App-Größe irrelevant)
- ❌ State Management manuell (aber sehr einfach gehalten)

## 📂 Projektstruktur

```
src/
├── components/           # UI Komponenten
│   ├── AddPositionForm.ts   # Formular mit Autocomplete
│   ├── ListCard.ts          # Listenkarte
│   ├── Modal.ts             # Modal Dialog
│   ├── PositionItem.ts      # Artikel mit Swipe
│   └── styles.css           # Component Styles
├── utils/                # Utilities
│   ├── dom.ts               # DOM Helper Functions
│   └── swipe.ts             # Swipe Gesture Handler
├── App.ts                # Haupt-App-Klasse
├── api.ts                # API Client
├── main.ts               # Entry Point
└── styles.css            # Global Styles
```

## 🎨 Architektur-Prinzipien

### Komponenten-Pattern
Jede Komponente ist eine TypeScript-Klasse mit `render()` Methode:

```typescript
export class MyComponent {
  constructor(private data: SomeType) {}

  render(): HTMLElement {
    const element = el('div', { className: 'my-component' });
    // ... DOM erstellen
    return element;
  }
}
```

### DOM Helpers
Statt `document.createElement` überall:

```typescript
import { el } from './utils/dom';

// Vorher:
const div = document.createElement('div');
div.className = 'card';
div.textContent = 'Hello';

// Nachher:
const div = el('div', { className: 'card' }, 'Hello');
```

### State Management
Einfach und transparent:

```typescript
class App {
  private listen: Einkaufsliste[] = [];  // State
  private selectedListe: Einkaufsliste | null = null;

  async selectListe(liste: Einkaufsliste) {
    this.selectedListe = liste;
    this.positionen = await api.getPositionen(liste.id);
    this.render();  // Re-render bei State-Änderung
  }
}
```

## 🎯 Swipe-to-Delete

Native Touch-Events mit eigener `SwipeHandler` Klasse:

```typescript
// In PositionItem.ts
this.swipeHandler = new SwipeHandler(element, {
  onSwipeLeft: () => {
    // Artikel löschen
    this.onDelete(this.position.id);
  },
  threshold: 100  // Min. Pixel zum Triggern
});
```

**Features:**
- ✅ Touch-Events (Mobile)
- ✅ Mouse-Events (Desktop-Testing)
- ✅ Visuelles Feedback (Roter Hintergrund)
- ✅ Animation beim Löschen
- ✅ Threshold-basiert

**Verwendung:**
- **Mobile:** Nach links wischen zum Löschen
- **Desktop:** Klicken + nach links ziehen

## 🎨 Design

Gleiche warme Ästhetik wie Lit-Version:

### Farbschema
- **Primär**: Orange Gradient (#ff9a56 → #ff6b35)
- **Hintergrund**: Cremefarbener Gradient
- **Text**: Dunkelbraun (#2c1810)

### Typografie
- **Headlines**: Fraunces (Serif, Bold)
- **Body**: DM Sans (Sans-Serif)

### Animationen
- Slide-Ins für neue Elemente
- Hover-Effekte mit Transform
- Checkbox Pop-Animation
- Swipe-Feedback

## 🔌 API Integration

```typescript
// src/api.ts
export class ApiService {
  async getListen(): Promise<Einkaufsliste[]> {
    const res = await fetch('/listen');
    return res.json();
  }
}

export const api = new ApiService();
```

Vite leitet alle API-Requests an `localhost:8080` weiter.

## 🏗️ Build

```bash
# TypeScript kompilieren + Production Build
npm run build

# Build testen
npm run preview
```

Output landet in `dist/`

## 🎓 Code-Beispiele

### Komponente erstellen
```typescript
export class MyCard {
  constructor(private title: string) {}

  render(): HTMLElement {
    return el('div', { 
      className: 'card',
      onclick: () => console.log('Clicked!')
    },
      el('h3', {}, this.title),
      el('p', {}, 'Some content')
    );
  }
}
```

### In App verwenden
```typescript
class App {
  render() {
    const container = el('div', { className: 'container' });
    
    this.items.forEach(item => {
      const card = new MyCard(item.title);
      container.appendChild(card.render());
    });
    
    document.body.appendChild(container);
  }
}
```

### Event Handling
```typescript
const button = el('button', {
  className: 'btn-primary',
  onclick: () => this.handleClick()
}, 'Click me');

// Oder klassisch:
button.addEventListener('click', () => this.handleClick());
```

## 🐛 Debugging

### Browser DevTools
```javascript
// Console
console.log('Current state:', app);

// Elemente inspizieren
document.querySelector('.position-item');

// Events tracken
monitorEvents(document.querySelector('.btn-add'));
```

### TypeScript Fehler
```bash
# Type-Check ohne Build
npx tsc --noEmit
```

## 🚀 Performance

### Optimierungen
- Native DOM-APIs (kein Virtual DOM nötig)
- Event Delegation wo sinnvoll
- CSS-only Animationen
- Lazy Re-Rendering (nur bei State-Änderung)

### Bundle Size
```bash
npm run build

# dist/ Ordner inspizieren
ls -lh dist/assets/
```

Typischerweise ~50-70KB gzipped (nur dein Code!)

## 📱 Mobile Support

### Touch-Events
- Swipe-Gesten nativ implementiert
- Touch-Feedback via CSS `:active`
- Viewport Meta-Tag für richtiges Scaling

### Responsive Design
```css
@media (max-width: 968px) {
  .container {
    grid-template-columns: 1fr;
  }
}
```

## 🧪 Testing

### Manuelles Testing
1. Backend starten: `go run main.go`
2. Frontend starten: `npm run dev`
3. Browser öffnen: `http://localhost:3000`

### Features testen
- ✅ Liste erstellen
- ✅ Artikel hinzufügen
- ✅ Artikel abhaken
- ✅ Swipe zum Löschen (Mobile/Desktop)
- ✅ Autocomplete
- ✅ Liste löschen

## 🔄 Vergleich zu Lit

| Feature | Vanilla TS | Lit |
|---------|-----------|-----|
| Bundle Size | ~50KB | ~60KB |
| Decorators | ❌ Nein | ✅ Ja |
| Shadow DOM | ❌ Nein | ✅ Ja |
| Learning Curve | Niedrig | Mittel |
| Flexibilität | Maximum | Hoch |
| Boilerplate | Etwas mehr | Weniger |

## 💡 Tipps

### State Updates
Immer `render()` nach State-Änderung aufrufen:

```typescript
async addItem(item: Item) {
  this.items = [...this.items, item];
  this.render();  // Wichtig!
}
```

### Memory Leaks vermeiden
Event Listener aufräumen wenn nötig:

```typescript
destroy() {
  if (this.swipeHandler) {
    this.swipeHandler.destroy();
  }
}
```

### Performance
Nur neu-rendern was sich geändert hat:

```typescript
// Statt alles neu zu rendern:
render() {
  clearElement(this.container);
  this.container.appendChild(this.buildUI());
}

// Besser: Nur einzelne Items updaten
updateItem(id: number) {
  const element = this.container.querySelector(`[data-id="${id}"]`);
  // ... nur dieses Element updaten
}
```

## 📚 Weitere Ressourcen

- [MDN Web Docs](https://developer.mozilla.org/de/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)

## 🎉 Fazit

Vanilla TypeScript ist perfekt für:
- ✅ Lern-Projekte
- ✅ Kleine bis mittlere Apps
- ✅ Wenn du volle Kontrolle willst
- ✅ Performance-kritische Anwendungen
- ✅ Wenn du keine Decorators magst! 😊

**Du hast die Wahl!** Vanilla TS = volle Kontrolle, Lit = mehr Convenience.
