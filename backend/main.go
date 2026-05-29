package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

// Models
type Artikel struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Einkaufsliste struct {
	ID          int       `json:"id"`
	Bezeichnung string    `json:"bezeichnung"`
	ErstelltAm  time.Time `json:"erstellt_am"`
}

type Einkaufsposition struct {
	ID          int    `json:"id"`
	ListeID     int    `json:"liste_id"`
	ArtikelName string `json:"artikel_name"`
	Bemerkung   string `json:"bemerkung,omitempty"`
	Erledigt    bool   `json:"erledigt"`
}

type CreateListeRequest struct {
	Bezeichnung string `json:"bezeichnung"`
}

type CreatePositionRequest struct {
	ArtikelName string `json:"artikel_name"`
	Bemerkung   string `json:"bemerkung,omitempty"`
}

type UpdatePositionRequest struct {
	ArtikelName string `json:"artikel_name,omitempty"`
	Bemerkung   string `json:"bemerkung,omitempty"`
	Erledigt    *bool  `json:"erledigt,omitempty"`
}

var db *sql.DB

func main() {
	var err error
	db, err = sql.Open("sqlite", "./einkaufsliste.db")
	if err != nil {
		log.Fatal("Fehler beim Öffnen der Datenbank:", err)
	}
	defer db.Close()

	// CORS Middleware
	corsHandler := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			
			next(w, r)
		}
	}

	// Routes with CORS
	http.HandleFunc("/artikel", corsHandler(handleArtikel))
	http.HandleFunc("/artikel/", corsHandler(handleArtikelByID))
	http.HandleFunc("/listen", corsHandler(handleListen))
	http.HandleFunc("/listen/", corsHandler(handleListenByID))
	http.HandleFunc("/listen/{id}/positionen", corsHandler(handlePositionen))
	http.HandleFunc("/positionen/", corsHandler(handlePositionenByID))

	log.Println("Server läuft auf http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// ===== ARTIKEL ENDPOINTS =====

func handleArtikel(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getArtikel(w, r)
	case http.MethodPost:
		createArtikel(w, r)
	default:
		http.Error(w, "Methode nicht erlaubt", http.StatusMethodNotAllowed)
	}
}

func handleArtikelByID(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path, "/artikel/")
	if id == 0 {
		http.Error(w, "Ungültige ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getArtikelByID(w, r, id)
	case http.MethodDelete:
		deleteArtikel(w, r, id)
	default:
		http.Error(w, "Methode nicht erlaubt", http.StatusMethodNotAllowed)
	}
}

func getArtikel(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name FROM artikel ORDER BY name")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	artikel := []Artikel{}
	for rows.Next() {
		var a Artikel
		if err := rows.Scan(&a.ID, &a.Name); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		artikel = append(artikel, a)
	}

	respondJSON(w, artikel)
}

func getArtikelByID(w http.ResponseWriter, r *http.Request, id int) {
	var a Artikel
	err := db.QueryRow("SELECT id, name FROM artikel WHERE id = ?", id).Scan(&a.ID, &a.Name)
	if err == sql.ErrNoRows {
		http.Error(w, "Artikel nicht gefunden", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, a)
}

func createArtikel(w http.ResponseWriter, r *http.Request) {
	var a Artikel
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		http.Error(w, "Ungültige Anfrage", http.StatusBadRequest)
		return
	}

	if a.Name == "" {
		http.Error(w, "Name ist erforderlich", http.StatusBadRequest)
		return
	}

	result, err := db.Exec("INSERT INTO artikel (name) VALUES (?)", a.Name)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE") {
			http.Error(w, "Artikel existiert bereits", http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	a.ID = int(id)

	w.WriteHeader(http.StatusCreated)
	respondJSON(w, a)
}

func deleteArtikel(w http.ResponseWriter, r *http.Request, id int) {
	result, err := db.Exec("DELETE FROM artikel WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "Artikel nicht gefunden", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ===== EINKAUFSLISTEN ENDPOINTS =====

func handleListen(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getListen(w, r)
	case http.MethodPost:
		createListe(w, r)
	default:
		http.Error(w, "Methode nicht erlaubt", http.StatusMethodNotAllowed)
	}
}

func handleListenByID(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if strings.Contains(path, "/positionen") {
		return // Wird von handlePositionen behandelt
	}

	id := extractID(path, "/listen/")
	if id == 0 {
		http.Error(w, "Ungültige ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getListeByID(w, r, id)
	case http.MethodDelete:
		deleteListe(w, r, id)
	default:
		http.Error(w, "Methode nicht erlaubt", http.StatusMethodNotAllowed)
	}
}

func getListen(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, bezeichnung, erstellt_am FROM einkaufsliste ORDER BY erstellt_am DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	listen := []Einkaufsliste{}
	for rows.Next() {
		var l Einkaufsliste
		if err := rows.Scan(&l.ID, &l.Bezeichnung, &l.ErstelltAm); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		listen = append(listen, l)
	}

	respondJSON(w, listen)
}

func getListeByID(w http.ResponseWriter, r *http.Request, id int) {
	var l Einkaufsliste
	err := db.QueryRow("SELECT id, bezeichnung, erstellt_am FROM einkaufsliste WHERE id = ?", id).
		Scan(&l.ID, &l.Bezeichnung, &l.ErstelltAm)
	if err == sql.ErrNoRows {
		http.Error(w, "Liste nicht gefunden", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, l)
}

func createListe(w http.ResponseWriter, r *http.Request) {
	var req CreateListeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Ungültige Anfrage", http.StatusBadRequest)
		return
	}

	if req.Bezeichnung == "" {
		http.Error(w, "Bezeichnung ist erforderlich", http.StatusBadRequest)
		return
	}

	result, err := db.Exec("INSERT INTO einkaufsliste (bezeichnung) VALUES (?)", req.Bezeichnung)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	
	var l Einkaufsliste
	db.QueryRow("SELECT id, bezeichnung, erstellt_am FROM einkaufsliste WHERE id = ?", id).
		Scan(&l.ID, &l.Bezeichnung, &l.ErstelltAm)

	w.WriteHeader(http.StatusCreated)
	respondJSON(w, l)
}

func deleteListe(w http.ResponseWriter, r *http.Request, id int) {
	// Erst die Positionen löschen
	db.Exec("DELETE FROM einkaufspositionen WHERE liste_id = ?", id)
	
	result, err := db.Exec("DELETE FROM einkaufsliste WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "Liste nicht gefunden", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ===== POSITIONEN ENDPOINTS =====

func handlePositionen(w http.ResponseWriter, r *http.Request) {
	// Extrahiere Listen-ID aus /listen/{id}/positionen
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		http.Error(w, "Ungültige URL", http.StatusBadRequest)
		return
	}

	listeID, err := strconv.Atoi(parts[1])
	if err != nil {
		http.Error(w, "Ungültige Listen-ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getPositionen(w, r, listeID)
	case http.MethodPost:
		createPosition(w, r, listeID)
	default:
		http.Error(w, "Methode nicht erlaubt", http.StatusMethodNotAllowed)
	}
}

func handlePositionenByID(w http.ResponseWriter, r *http.Request) {
	id := extractID(r.URL.Path, "/positionen/")
	if id == 0 {
		http.Error(w, "Ungültige ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getPositionByID(w, r, id)
	case http.MethodPut, http.MethodPatch:
		updatePosition(w, r, id)
	case http.MethodDelete:
		deletePosition(w, r, id)
	default:
		http.Error(w, "Methode nicht erlaubt", http.StatusMethodNotAllowed)
	}
}

func getPositionen(w http.ResponseWriter, r *http.Request, listeID int) {
	rows, err := db.Query(`
		SELECT id, liste_id, artikel_name, bemerkung, erledigt 
		FROM einkaufspositionen 
		WHERE liste_id = ?
		ORDER BY erledigt, id`, listeID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	positionen := []Einkaufsposition{}
	for rows.Next() {
		var p Einkaufsposition
		var bemerkung sql.NullString
		var erledigt int
		if err := rows.Scan(&p.ID, &p.ListeID, &p.ArtikelName, &bemerkung, &erledigt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		p.Bemerkung = bemerkung.String
		p.Erledigt = erledigt == 1
		positionen = append(positionen, p)
	}

	respondJSON(w, positionen)
}

func getPositionByID(w http.ResponseWriter, r *http.Request, id int) {
	var p Einkaufsposition
	var bemerkung sql.NullString
	var erledigt int
	
	err := db.QueryRow(`
		SELECT id, liste_id, artikel_name, bemerkung, erledigt 
		FROM einkaufspositionen 
		WHERE id = ?`, id).Scan(&p.ID, &p.ListeID, &p.ArtikelName, &bemerkung, &erledigt)
	
	if err == sql.ErrNoRows {
		http.Error(w, "Position nicht gefunden", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	p.Bemerkung = bemerkung.String
	p.Erledigt = erledigt == 1

	respondJSON(w, p)
}

func createPosition(w http.ResponseWriter, r *http.Request, listeID int) {
	var req CreatePositionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Ungültige Anfrage", http.StatusBadRequest)
		return
	}

	if req.ArtikelName == "" {
		http.Error(w, "Artikel-Name ist erforderlich", http.StatusBadRequest)
		return
	}

	result, err := db.Exec(`
		INSERT INTO einkaufspositionen (liste_id, artikel_name, bemerkung) 
		VALUES (?, ?, ?)`, listeID, req.ArtikelName, req.Bemerkung)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	
	var p Einkaufsposition
	var bemerkung sql.NullString
	var erledigt int
	db.QueryRow(`
		SELECT id, liste_id, artikel_name, bemerkung, erledigt 
		FROM einkaufspositionen 
		WHERE id = ?`, id).Scan(&p.ID, &p.ListeID, &p.ArtikelName, &bemerkung, &erledigt)
	
	p.Bemerkung = bemerkung.String
	p.Erledigt = erledigt == 1

	w.WriteHeader(http.StatusCreated)
	respondJSON(w, p)
}

func updatePosition(w http.ResponseWriter, r *http.Request, id int) {
	var req UpdatePositionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Ungültige Anfrage", http.StatusBadRequest)
		return
	}

	// Baue Update-Query dynamisch
	updates := []string{}
	args := []interface{}{}

	if req.ArtikelName != "" {
		updates = append(updates, "artikel_name = ?")
		args = append(args, req.ArtikelName)
	}
	if req.Bemerkung != "" {
		updates = append(updates, "bemerkung = ?")
		args = append(args, req.Bemerkung)
	}
	if req.Erledigt != nil {
		updates = append(updates, "erledigt = ?")
		erledigt := 0
		if *req.Erledigt {
			erledigt = 1
		}
		args = append(args, erledigt)
	}

	if len(updates) == 0 {
		http.Error(w, "Keine Update-Felder angegeben", http.StatusBadRequest)
		return
	}

	args = append(args, id)
	query := "UPDATE einkaufspositionen SET " + strings.Join(updates, ", ") + " WHERE id = ?"

	result, err := db.Exec(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "Position nicht gefunden", http.StatusNotFound)
		return
	}

	// Aktualisierte Position abrufen
	var p Einkaufsposition
	var bemerkung sql.NullString
	var erledigt int
	db.QueryRow(`
		SELECT id, liste_id, artikel_name, bemerkung, erledigt 
		FROM einkaufspositionen 
		WHERE id = ?`, id).Scan(&p.ID, &p.ListeID, &p.ArtikelName, &bemerkung, &erledigt)
	
	p.Bemerkung = bemerkung.String
	p.Erledigt = erledigt == 1

	respondJSON(w, p)
}

func deletePosition(w http.ResponseWriter, r *http.Request, id int) {
	result, err := db.Exec("DELETE FROM einkaufspositionen WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "Position nicht gefunden", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ===== HELPER FUNCTIONS =====

func extractID(path, prefix string) int {
	idStr := strings.TrimPrefix(path, prefix)
	idStr = strings.Split(idStr, "/")[0]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0
	}
	return id
}

func respondJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
