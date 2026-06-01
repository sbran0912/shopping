# Einkaufsliste Frontend mit Bun 🚀

Dieses Projekt verwendet standardmäßig **npm** als Paketmanager und **Vite** als Build-Tool.
Hier erfährst du, wie du stattdessen **Bun** (v1.3.13) nutzen kannst – inklusive automatischer `.env`-Verarbeitung.

---

## 📥 Installation von Bun

Falls Bun noch nicht installiert ist:

```bash
curl -fsSL https://bun.sh/install | bash
```

Oder via Homebrew:

```bash
brew install oven-sh/bun/bun
```

Prüfen mit:
```bash
bun --version
```

---

## 🧹 Migration von npm zu Bun

Um von npm auf Bun zu wechseln, musst du einmalig die `node_modules` neu installieren:

```bash
# Alte node_modules entfernen
rm -rf node_modules package-lock.json

# Mit Bun installieren (erzeugt bun.lock)
bun install
```

> **Hinweis:** `bun install` ist ca. 10–20× schneller als `npm install`.

---

## 🌍 Umgebungsvariablen / .env-Dateien

Bun und Vite lesen automatisch die passende `.env`-Datei:

| Datei | Wann geladen |
|---|---|
| `.env` | Immer (Entwicklung & Fallback) |
| `.env.production` | Wenn `NODE_ENV=production` gesetzt ist |
| `.env.local` | Überschreibt alle anderen, nie im Git |

### Aktuelle Konfiguration

| Datei | Inhalt |
|---|---|
| `.env` | `VITE_API_URL=http://localhost:8080` (lokale Entwicklung) |
| `.env.production` | `VITE_API_URL=https://sbran.de/einkauf/api` (Produktion) |

> **Wichtig:** Variablen müssen mit `VITE_` prefix beginnen, damit Vite sie im Client-Code (`import.meta.env.VITE_*`) verfügbar macht.

---

## 🏗️ Build mit Bun

### 🔧 Entwicklung

```bash
bun run dev
```
→ Lädt `.env` → `VITE_API_URL=http://localhost:8080`

### 📦 Production-Build

**Option A – NODE_ENV direkt setzen (empfohlen):**

```bash
NODE_ENV=production bun run build
```

**Option B – NODE_ENV im package.json festlegen:**

Ändere in `package.json` das Build-Skript:

```json
"scripts": {
  "build": "NODE_ENV=production tsc && vite build --base=./"
}
```

Dann reicht:
```bash
bun run build
```

**Option C – Vite macht es automatisch** 🤯

Vite setzt intern `NODE_ENV=production`, sobald du `vite build` ausführst.
Selbst ohne explizites Setzen wird `.env.production` korrekt geladen.
→ `bun run build` funktioniert also auch ohne `NODE_ENV=production` davor.

---

## 📂 Ausgabe

Der Build erzeugt das fertige Frontend im Ordner `dist/`:

```bash
ls -la dist/
```

Prüfen, ob die Production-URL im Build landet:
```bash
grep -r "sbran.de" dist/
```

---

## 🚀 Preview des Production-Builds

```bash
bun run preview
```
→ Startet einen lokalen Server, der den Inhalt von `dist/` ausliefert.

---

## ⚙️ Alle Skripte auf einen Blick

```bash
bun install          # Abhängigkeiten installieren (schnell!)
bun run dev          # Entwicklungsserver starten
NODE_ENV=production bun run build   # Für Produktion bauen
bun run preview      # Build lokal testen
```

---

## 🧪 Warum Bun?

- **Blitzschnell** – Installieren, Bauen, Testen in Sekunden
- **Integriertes .env-Handling** – kein `dotenv`-Package nötig
- **Drop-in-Replacement** – funktioniert mit bestehenden `package.json`-Skripten
- **All-in-One** – kann TypeScript nativ ausführen (ohne `tsc`)

> **Hinweis:** Dieses Projekt verwendet aktuell `tsc` vor dem Build.
> Mit `bun build --target=bun` könntest du TypeScript sogar ohne `tsc` direkt bündeln –
> für Vite-Projekte wird aber weiterhin der Standard-Workflow empfohlen.
