import { el } from '../utils/dom';
import type { Einkaufsposition } from '../api';
import { SwipeHandler } from '../utils/swipe';

export class PositionItem {
  constructor(
    private position: Einkaufsposition,
    private onToggle: (id: number, erledigt: boolean) => void,
    private onDelete: (id: number) => void
  ) {}

  render(): HTMLElement {
    const container = el('div', {
      className: `list-group-item d-flex justify-content-between align-items-center position-relative overflow-hidden ${this.position.erledigt ? 'bg-light text-muted' : ''}`
    });

    // Checkbox Wrapper
    const checkWrapper = el('div', { className: 'form-check m-0 d-flex align-items-center flex-grow-1' });
    
    const checkbox = el('input', {
      className: 'form-check-input me-3 fs-5',
      type: 'checkbox',
      checked: this.position.erledigt,
      onchange: (e: Event) => {
        e.stopPropagation();
        this.onToggle(this.position.id, this.position.erledigt);
      }
    });
    // Prevent click on row from toggling checkbox twice if we add row click handler later
    checkbox.onclick = (e) => e.stopPropagation();

    checkWrapper.appendChild(checkbox);

    // Text Content
    const content = el('div', {});
    const titleClass = this.position.erledigt ? 'text-decoration-line-through' : 'fw-medium';
    content.appendChild(el('div', { className: titleClass }, this.position.artikel_name));
    
    if (this.position.bemerkung) {
      content.appendChild(el('small', { className: 'text-muted d-block' }, this.position.bemerkung));
    }

    checkWrapper.appendChild(content);
    container.appendChild(checkWrapper);

    // Delete Button
    const deleteBtn = el('button', {
      className: 'btn btn-outline-danger btn-sm border-0',
      onclick: (e: Event) => {
        e.stopPropagation();
        this.onDelete(this.position.id);
      }
    }, '🗑️');
    
    container.appendChild(deleteBtn);

    // Swipe Logic (keeping custom logic but adapting styles)
    new SwipeHandler(container, {
      onSwipeLeft: () => {
        this.onDelete(this.position.id);
      },
      threshold: 100
    });

    return container;
  }
}