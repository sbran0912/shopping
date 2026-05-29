# Einkaufsliste REST API

Eine einfache REST API in Go ohne Framework für die Verwaltung von Einkaufslisten mit SQLite (ohne CGO).

## Installation

```bash
# Dependencies installieren
go mod download

# Datenbank initialisieren
sqlite3 einkaufsliste.db < init.sql

# Server starten
go run main.go
```

Der Server läuft dann auf `http://localhost:8080`

## API Endpoints

### Artikel (Stammdaten)

#### Alle Artikel abrufen
```bash
GET /artikel
```

**Beispiel:**
```bash
curl http://localhost:8080/artikel
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Milch"
  },
  {
    "id": 2,
    "name": "Brot"
  }
]
```

#### Einzelnen Artikel abrufen
```bash
GET /artikel/{id}
```

**Beispiel:**
```bash
curl http://localhost:8080/artikel/1
```

#### Neuen Artikel erstellen
```bash
POST /artikel
Content-Type: application/json

{
  "name": "Schokolade"
}
```

**Beispiel:**
```bash
curl -X POST http://localhost:8080/artikel \
  -H "Content-Type: application/json" \
  -d '{"name":"Schokolade"}'
```

#### Artikel löschen
```bash
DELETE /artikel/{id}
```

**Beispiel:**
```bash
curl -X DELETE http://localhost:8080/artikel/21
```

---

### Einkaufslisten

#### Alle Listen abrufen
```bash
GET /listen
```

**Beispiel:**
```bash
curl http://localhost:8080/listen
```

**Response:**
```json
[
  {
    "id": 1,
    "bezeichnung": "Wocheneinkauf Samstag",
    "erstellt_am": "2026-02-07T10:30:00Z"
  }
]
```

#### Einzelne Liste abrufen
```bash
GET /listen/{id}
```

**Beispiel:**
```bash
curl http://localhost:8080/listen/1
```

#### Neue Liste erstellen
```bash
POST /listen
Content-Type: application/json

{
  "bezeichnung": "Montagseinkauf"
}
```

**Beispiel:**
```bash
curl -X POST http://localhost:8080/listen \
  -H "Content-Type: application/json" \
  -d '{"bezeichnung":"Montagseinkauf"}'
```

#### Liste löschen
```bash
DELETE /listen/{id}
```

**Beispiel:**
```bash
curl -X DELETE http://localhost:8080/listen/2
```

---

### Einkaufspositionen

#### Alle Positionen einer Liste abrufen
```bash
GET /listen/{liste_id}/positionen
```

**Beispiel:**
```bash
curl http://localhost:8080/listen/1/positionen
```

**Response:**
```json
[
  {
    "id": 1,
    "liste_id": 1,
    "artikel_name": "Milch",
    "bemerkung": "3 Packungen, laktosefrei",
    "erledigt": false
  },
  {
    "id": 2,
    "liste_id": 1,
    "artikel_name": "Eier",
    "bemerkung": "10er Packung vom Bio-Hof",
    "erledigt": false
  }
]
```

#### Einzelne Position abrufen
```bash
GET /positionen/{id}
```

**Beispiel:**
```bash
curl http://localhost:8080/positionen/1
```

#### Neue Position zu einer Liste hinzufügen
```bash
POST /listen/{liste_id}/positionen
Content-Type: application/json

{
  "artikel_name": "Käse",
  "bemerkung": "Gouda, mittelalt"
}
```

**Beispiel:**
```bash
curl -X POST http://localhost:8080/listen/1/positionen \
  -H "Content-Type: application/json" \
  -d '{"artikel_name":"Käse","bemerkung":"Gouda, mittelalt"}'
```

#### Position aktualisieren (PATCH/PUT)
```bash
PATCH /positionen/{id}
Content-Type: application/json

{
  "erledigt": true
}
```

Oder mehrere Felder gleichzeitig:
```json
{
  "artikel_name": "Käse",
  "bemerkung": "Emmentaler statt Gouda",
  "erledigt": false
}
```

**Beispiele:**
```bash
# Position als erledigt markieren
curl -X PATCH http://localhost:8080/positionen/1 \
  -H "Content-Type: application/json" \
  -d '{"erledigt":true}'

# Bemerkung ändern
curl -X PATCH http://localhost:8080/positionen/2 \
  -H "Content-Type: application/json" \
  -d '{"bemerkung":"12er Packung statt 10er"}'
```

#### Position löschen
```bash
DELETE /positionen/{id}
```

**Beispiel:**
```bash
curl -X DELETE http://localhost:8080/positionen/5
```

---

## Datenmodell

### Artikel
```json
{
  "id": 1,
  "name": "Milch"
}
```

### Einkaufsliste
```json
{
  "id": 1,
  "bezeichnung": "Wocheneinkauf Samstag",
  "erstellt_am": "2026-02-07T10:30:00Z"
}
```

### Einkaufsposition
```json
{
  "id": 1,
  "liste_id": 1,
  "artikel_name": "Milch",
  "bemerkung": "3 Packungen, laktosefrei",
  "erledigt": false
}
```

---

## Workflow-Beispiel

```bash
# 1. Neue Einkaufsliste erstellen
curl -X POST http://localhost:8080/listen \
  -H "Content-Type: application/json" \
  -d '{"bezeichnung":"Dienstag Abendessen"}'
# Response: {"id":2,"bezeichnung":"Dienstag Abendessen","erstellt_am":"..."}

# 2. Positionen hinzufügen
curl -X POST http://localhost:8080/listen/2/positionen \
  -H "Content-Type: application/json" \
  -d '{"artikel_name":"Spaghetti","bemerkung":"500g"}'

curl -X POST http://localhost:8080/listen/2/positionen \
  -H "Content-Type: application/json" \
  -d '{"artikel_name":"Tomatensoße","bemerkung":"2 Gläser"}'

# 3. Liste abrufen
curl http://localhost:8080/listen/2/positionen

# 4. Position als erledigt markieren
curl -X PATCH http://localhost:8080/positionen/6 \
  -H "Content-Type: application/json" \
  -d '{"erledigt":true}'

# 5. Liste löschen wenn fertig
curl -X DELETE http://localhost:8080/listen/2
```

---

## Technische Details

- **Go Version**: 1.21+
- **SQLite Driver**: `modernc.org/sqlite` (pure Go, kein CGO)
- **Port**: 8080
- **Datenbank**: `einkaufsliste.db` (SQLite)

## Besonderheiten

- Keine externen Web-Frameworks verwendet (nur Go stdlib)
- CGO-freie SQLite-Implementierung
- Einfaches Routing über `http.HandleFunc`
- JSON für Request/Response
- Sortierung: Listen nach Erstellungsdatum, Positionen nach Status (unerledigt zuerst)
