import { el, clearElement } from '../utils/dom';
import type { Artikel } from '../api';

export class AddPositionForm {
  private artikelInput: HTMLInputElement | null = null;
  private bemerkungInput: HTMLInputElement | null = null;
  private suggestionsContainer: HTMLElement | null = null;

  constructor(
    private artikel: Artikel[],
    private onAdd: (name: string, bemerkung: string) => void
  ) {}

  render(): HTMLElement {
    const form = el('form', { className: 'card p-3 mb-3 bg-light border-0' });
    const row = el('div', { className: 'row g-2' });

    // Artikel Input Group
    const colArtikel = el('div', { className: 'col-md-6 position-relative' });
    this.artikelInput = el('input', {
      type: 'text',
      className: 'form-control',
      placeholder: 'Artikel hinzufügen...',
      required: true,
      autocomplete: 'off'
    }) as HTMLInputElement;

    this.artikelInput.addEventListener('input', () => this.handleArtikelInput());
    this.artikelInput.addEventListener('focus', () => this.showSuggestions());
    this.artikelInput.addEventListener('blur', () => {
      setTimeout(() => this.hideSuggestions(), 200);
    });

    colArtikel.appendChild(this.artikelInput);

    // Suggestions Dropdown
    this.suggestionsContainer = el('div', { className: 'list-group position-absolute w-100 shadow-sm' });
    this.suggestionsContainer.style.zIndex = '1000';
    this.suggestionsContainer.style.display = 'none';
    colArtikel.appendChild(this.suggestionsContainer);
    
    row.appendChild(colArtikel);

    // Bemerkung Input
    const colBemerkung = el('div', { className: 'col-md-4' });
    this.bemerkungInput = el('input', {
      type: 'text',
      className: 'form-control',
      placeholder: 'Bemerkung (optional)'
    }) as HTMLInputElement;
    colBemerkung.appendChild(this.bemerkungInput);
    row.appendChild(colBemerkung);

    // Submit Button
    const colBtn = el('div', { className: 'col-md-2' });
    const submitBtn = el('button', {
      type: 'submit',
      className: 'btn btn-primary w-100'
    }, '+');
    colBtn.appendChild(submitBtn);
    row.appendChild(colBtn);

    form.appendChild(row);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    return form;
  }

  private handleArtikelInput() {
    if (!this.artikelInput || !this.suggestionsContainer) return;
    const value = this.artikelInput.value.toLowerCase();
    const matches = this.artikel
      .filter(a => a.name.toLowerCase().includes(value))
      .slice(0, 5);
    
    this.renderSuggestions(matches);
  }

  private showSuggestions() {
    if (this.artikelInput && this.artikelInput.value) {
      this.handleArtikelInput();
    }
  }

  private hideSuggestions() {
    if (this.suggestionsContainer) {
      this.suggestionsContainer.style.display = 'none';
    }
  }

  private renderSuggestions(matches: Artikel[]) {
    if (!this.suggestionsContainer) return;
    
    clearElement(this.suggestionsContainer);
    
    if (matches.length === 0) {
      this.suggestionsContainer.style.display = 'none';
      return;
    }

    matches.forEach(match => {
      const item = el('button', {
        type: 'button',
        className: 'list-group-item list-group-item-action',
        onclick: () => this.selectArtikel(match.name)
      }, match.name);
      this.suggestionsContainer!.appendChild(item);
    });

    this.suggestionsContainer.style.display = 'block';
  }

  private selectArtikel(name: string) {
    if (this.artikelInput) {
      this.artikelInput.value = name;
      this.hideSuggestions();
      this.bemerkungInput?.focus();
    }
  }

  private handleSubmit() {
    if (!this.artikelInput || !this.bemerkungInput) return;
    const name = this.artikelInput.value.trim();
    const bemerkung = this.bemerkungInput.value.trim();

    if (name) {
      this.onAdd(name, bemerkung);
      this.artikelInput.value = '';
      this.bemerkungInput.value = '';
      this.hideSuggestions();
    }
  }
}