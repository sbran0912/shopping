import { el } from '../utils/dom';
import type { Einkaufsliste } from '../api';

export class ListCard {
  constructor(
    private liste: Einkaufsliste,
    private selected: boolean,
    private onSelect: () => void
  ) {}

  render(): HTMLElement {
    const date = new Date(this.liste.erstellt_am).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const card = el('button', {
      className: `list-group-item list-group-item-action ${this.selected ? 'active' : ''}`,
      onclick: this.onSelect
    });

    const content = el('div', { className: 'd-flex w-100 justify-content-between align-items-center' });
    
    content.appendChild(
      el('h6', { className: 'mb-1 fw-bold' }, this.liste.bezeichnung)
    );
    
    const dateSmall = el('small', { 
      className: this.selected ? 'text-white-50' : 'text-muted' 
    }, `📅 ${date}`);
    
    content.appendChild(dateSmall);
    card.appendChild(content);
    return card;
  }
}