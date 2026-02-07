-- 1. Vorschlagstabelle (Stammdaten)
CREATE TABLE IF NOT EXISTS artikel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- 2. Die Einkaufslisten
CREATE TABLE IF NOT EXISTS einkaufsliste (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bezeichnung TEXT NOT NULL,
    erstellt_am DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Die Positionen (mit Freitext-Name und Bemerkung)
CREATE TABLE IF NOT EXISTS einkaufspositionen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    liste_id INTEGER,
    artikel_name TEXT NOT NULL,
    bemerkung TEXT,
    erledigt INTEGER DEFAULT 0,
    FOREIGN KEY (liste_id) REFERENCES einkaufsliste(id)
);

-- Befüllen der 20 gängigsten Nahrungsmittel
INSERT OR IGNORE INTO artikel (name) VALUES 
('Milch'), ('Brot'), ('Eier'), ('Butter'), ('Äpfel'), 
('Bananen'), ('Kartoffeln'), ('Zwiebeln'), ('Nudeln'), ('Reis'), 
('Tomaten'), ('Gurken'), ('Käse'), ('Kaffee'), ('Zucker'), 
('Mehl'), ('Hähnchenbrust'), ('Joghurt'), ('Paprika'), ('Öl');

-- Beispiel-Einkaufsliste
INSERT OR IGNORE INTO einkaufsliste (id, bezeichnung) VALUES (1, 'Wocheneinkauf Samstag');

INSERT OR IGNORE INTO einkaufspositionen (liste_id, artikel_name, bemerkung) VALUES 
(1, 'Milch', '3 Packungen, laktosefrei'),
(1, 'Eier', '10er Packung vom Bio-Hof'),
(1, 'Bananen', '5 Stück, noch etwas grün'),
(1, 'Dinkelmehl', 'Type 630 für den Kuchen'),
(1, 'Glutenfreie Pasta', '2 Packungen (Sonderangebot beachten)');
