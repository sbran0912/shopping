.PHONY: help build run test clean init-db

help: ## Zeigt diese Hilfe an
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

init-db: ## Initialisiert die Datenbank
	@echo "Initialisiere Datenbank..."
	@sqlite3 einkaufsliste.db < init.sql
	@echo "✓ Datenbank erfolgreich erstellt"

build: ## Kompiliert die Anwendung
	@echo "Kompiliere..."
	@go build -o einkaufsliste-api main.go
	@echo "✓ Build erfolgreich"

run: ## Startet den Server
	@echo "Starte Server..."
	@go run main.go

deps: ## Installiert Dependencies
	@echo "Installiere Dependencies..."
	@go mod tidy
	@echo "✓ Dependencies installiert"

clean: ## Löscht Build-Artefakte und Datenbank
	@echo "Räume auf..."
	@rm -f einkaufsliste-api
	@rm -f einkaufsliste.db
	@echo "✓ Aufgeräumt"

test-api: ## Testet die API (Server muss laufen)
	@echo "Teste API..."
	@curl -s http://localhost:8080/artikel | jq .
	@echo "\n✓ API läuft"

setup: deps init-db ## Vollständiges Setup (deps + db)
	@echo "✓ Setup abgeschlossen"
