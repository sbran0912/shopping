import { api } from './api';
import type { Einkaufsliste, Einkaufsposition, Artikel } from './api';
import { ListCard } from './components/ListCard';
import { PositionItem } from './components/PositionItem';
import { AddPositionForm } from './components/AddPositionForm';
import { Modal } from './components/Modal';
import { el, clearElement } from './utils/dom';
import './styles.css';
import './components/styles.css';

export class App {
  private container: HTMLElement;
  private listen: Einkaufsliste[] = [];
  private selectedListe: Einkaufsliste | null = null;
  private positionen: Einkaufsposition[] = [];
  private artikel: Artikel[] = [];
  private error: string | null = null;
  private loading = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init() {
    await this.loadData();
    this.render();
  }

  private async loadData() {
    this.loading = true;
    this.error = null;
    try {
      [this.listen, this.artikel] = await Promise.all([
        api.getListen(),
        api.getArtikel()
      ]);
      if (this.listen.length > 0 && !this.selectedListe) {
        await this.selectListe(this.listen[0]);
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      this.error = error instanceof Error ? error.message : 'Unbekannter Fehler';
    }
    this.loading = false;
    this.render();
  }

  private async selectListe(liste: Einkaufsliste) {
    this.selectedListe = liste;
    this.loading = true;
    this.render();
    
    try {
      this.positionen = await api.getPositionen(liste.id);
    } catch (error) {
      console.error('Fehler beim Laden der Positionen:', error);
    }
    
    this.loading = false;
    this.render();
  }

  private async createListe(bezeichnung: string) {
    try {
      const newListe = await api.createListe(bezeichnung);
      this.listen = [...this.listen, newListe];
      await this.selectListe(newListe);
      this.render();
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
      alert('Fehler beim Erstellen der Liste');
    }
  }

  private async deleteListe() {
    if (!this.selectedListe) return;

    try {
      await api.deleteListe(this.selectedListe.id);
      this.listen = this.listen.filter(l => l.id !== this.selectedListe!.id);
      this.selectedListe = null;
      this.positionen = [];
      
      if (this.listen.length > 0) {
        await this.selectListe(this.listen[0]);
      } else {
        this.render();
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Liste');
    }
  }

  private async togglePosition(id: number, erledigt: boolean) {
    try {
      await api.updatePosition(id, { erledigt: !erledigt });
      this.positionen = this.positionen.map(p =>
        p.id === id ? { ...p, erledigt: !erledigt } : p
      );
      this.render();
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    }
  }

  private async deletePosition(id: number) {
    try {
      await api.deletePosition(id);
      this.positionen = this.positionen.filter(p => p.id !== id);
      this.render();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  }

  private async addPosition(artikelName: string, bemerkung: string) {
    if (!this.selectedListe) return;

    try {
      const newPosition = await api.createPosition(
        this.selectedListe.id,
        artikelName,
        bemerkung
      );
      this.positionen = [...this.positionen, newPosition];
      this.render();
    } catch (error) {
      console.error('Fehler beim Hinzufügen:', error);
      alert('Fehler beim Hinzufügen der Position');
    }
  }

  private getStats() {
    const total = this.positionen.length;
    const done = this.positionen.filter(p => p.erledigt).length;
    const open = total - done;
    return { total, done, open };
  }

  private renderHeader() {
    const header = el('div', { className: 'container py-4 text-center' });
    header.style.animation = 'slideDown 0.8s ease-out';
    
    header.appendChild(
      el('h1', { className: 'display-5 fw-bold text-primary' }, '🛒 Einkaufsliste')
    );
    header.appendChild(
      el('p', { className: 'lead text-muted' }, 'Organisiere deine Einkäufe')
    );

    return header;
  }

  private renderErrorBanner() {
    if (!this.error) return null;

    return el('div', { className: 'alert alert-danger m-3 shadow-sm' },
      el('h4', { className: 'alert-heading' }, '⚠️ Verbindungsfehler'),
      el('p', { className: 'mb-0' }, this.error),
      el('div', { className: 'mt-2 small text-muted' },
        el('strong', {}, 'So behebst du das Problem:'),
        document.createTextNode(' 1. Stelle sicher, dass das Backend läuft: '),
        el('code', {}, 'go run main.go'),
        el('br'),
        document.createTextNode('2. Backend sollte auf Port 8080 laufen'),
        el('br'),
        document.createTextNode('3. Überprüfe die Console für Details')
      )
    );
  }

  private renderSidebar() {
    const sidebar = el('div', { className: 'col-md-4 col-lg-3 bg-light p-0 sidebar-wrapper' });

    const sidebarHeader = el('div', { className: 'd-flex justify-content-between align-items-center p-3 border-bottom bg-white' },
      el('h5', { className: 'm-0' }, 'Meine Listen'),
      el('button', {
        className: 'btn btn-primary btn-sm',
        onclick: () => this.showNewListModal()
      }, '+ Neu')
    );

    sidebar.appendChild(sidebarHeader);

    if (this.loading && this.listen.length === 0) {
      sidebar.appendChild(
        el('div', { className: 'p-4 text-center text-muted' }, 'Lade Listen...')
      );
    } else if (this.listen.length === 0) {
      sidebar.appendChild(
        el('div', { className: 'text-center p-5 text-muted' },
          el('div', { className: 'h1' }, '📝'),
          el('p', {}, 'Noch keine Listen vorhanden')
        )
      );
    } else {
      const listsContainer = el('div', { className: 'list-group list-group-flush' });
      this.listen.forEach(liste => {
        const card = new ListCard(
          liste,
          this.selectedListe?.id === liste.id,
          () => this.selectListe(liste)
        );
        listsContainer.appendChild(card.render());
      });
      sidebar.appendChild(listsContainer);
    }

    return sidebar;
  }

  private renderMainContent() {
    const main = el('div', { className: 'col-md-8 col-lg-9 p-3 p-md-4' });

    if (!this.selectedListe) {
      main.appendChild(
        el('div', { className: 'text-center mt-5 text-muted' },
          el('div', { className: 'display-1 mb-3' }, '🛒'),
          el('h3', {}, 'Wähle eine Liste'),
          el('p', {}, 'oder erstelle eine neue')
        )
      );
      return main;
    }

    // Header
    const contentHeader = el('div', { className: 'd-flex justify-content-between align-items-center mb-4' },
      el('h2', { className: 'm-0' }, this.selectedListe.bezeichnung),
      el('button', {
        className: 'btn btn-outline-danger btn-sm',
        onclick: () => this.deleteListe()
      }, '🗑️ Liste löschen')
    );
    main.appendChild(contentHeader);

    // Stats
    if (this.positionen.length > 0) {
      const stats = this.getStats();
      const statsEl = el('div', { className: 'row g-3 mb-4' },
        el('div', { className: 'col-4 text-center' },
          el('div', { className: 'p-3 bg-white rounded shadow-sm border' },
            el('div', { className: 'h4 mb-0 fw-bold text-primary' }, stats.total.toString()),
            el('div', { className: 'small text-muted' }, 'Gesamt')
          )
        ),
        el('div', { className: 'col-4 text-center' },
          el('div', { className: 'p-3 bg-white rounded shadow-sm border' },
            el('div', { className: 'h4 mb-0 fw-bold text-danger' }, stats.open.toString()),
            el('div', { className: 'small text-muted' }, 'Offen')
          )
        ),
        el('div', { className: 'col-4 text-center' },
          el('div', { className: 'p-3 bg-white rounded shadow-sm border' },
            el('div', { className: 'h4 mb-0 fw-bold text-success' }, stats.done.toString()),
            el('div', { className: 'small text-muted' }, 'Erledigt')
          )
        )
      );
      main.appendChild(statsEl);
    }

    // Add Form
    const addForm = new AddPositionForm(
      this.artikel,
      (name, bemerkung) => this.addPosition(name, bemerkung)
    );
    main.appendChild(addForm.render());

    // Positions
    if (this.loading) {
      main.appendChild(el('div', { className: 'text-center p-4 text-muted' }, 'Lade Positionen...'));
    } else if (this.positionen.length === 0) {
      main.appendChild(
        el('div', { className: 'text-center p-5 text-muted' },
          el('p', {}, 'Noch keine Artikel in dieser Liste')
        )
      );
    } else {
      const positionsContainer = el('div', { className: 'list-group mt-3' });
      this.positionen.forEach(pos => {
        const item = new PositionItem(
          pos,
          (id, erledigt) => this.togglePosition(id, erledigt),
          (id) => this.deletePosition(id)
        );
        positionsContainer.appendChild(item.render());
      });
      main.appendChild(positionsContainer);
    }

    return main;
  }

  private showNewListModal() {
    const modal = new Modal(
      'Neue Liste erstellen',
      'z.B. Wocheneinkauf',
      (value) => this.createListe(value)
    );
    this.container.appendChild(modal.render());
  }

  render() {
    clearElement(this.container);

    this.container.appendChild(this.renderHeader());

    const errorBanner = this.renderErrorBanner();
    if (errorBanner) {
      this.container.appendChild(errorBanner);
    }

    const containerDiv = el('div', { className: 'container-lg' });
    const row = el('div', { className: 'row g-0 shadow-sm rounded overflow-hidden border my-4 bg-white' });
    row.appendChild(this.renderSidebar());
    row.appendChild(this.renderMainContent());
    containerDiv.appendChild(row);
    
    this.container.appendChild(containerDiv);
  }
}
