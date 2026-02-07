import { el } from '../utils/dom';

export class Modal {
  private modalElement: HTMLElement | null = null;
  private inputElement: HTMLInputElement | null = null;

  constructor(
    private title: string,
    private placeholder: string,
    private onSubmit: (value: string) => void
  ) {}

  render(): HTMLElement {
    // Backdrop
    const backdrop = el('div', { 
      className: 'modal-backdrop fade show',
      onclick: () => this.close()
    });

    // Modal Container
    const modal = el('div', { 
      className: 'modal fade show d-block',
      tabIndex: -1,
      role: 'dialog',
      onclick: (e: Event) => {
        if (e.target === modal) this.close();
      }
    });

    const dialog = el('div', { className: 'modal-dialog modal-dialog-centered' });
    const content = el('div', { className: 'modal-content shadow' });

    // Header
    const header = el('div', { className: 'modal-header' });
    header.appendChild(el('h5', { className: 'modal-title' }, this.title));
    const closeBtn = el('button', { 
      type: 'button', 
      className: 'btn-close',
      onclick: () => this.close()
    });
    header.appendChild(closeBtn);
    content.appendChild(header);

    // Body
    const body = el('div', { className: 'modal-body' });
    const form = el('form', {
      onsubmit: (e: Event) => {
        e.preventDefault();
        this.handleSubmit();
      }
    });
    
    this.inputElement = el('input', {
      type: 'text',
      className: 'form-control',
      placeholder: this.placeholder,
      required: true
    }) as HTMLInputElement;
    
    form.appendChild(this.inputElement);
    body.appendChild(form);
    content.appendChild(body);

    // Footer
    const footer = el('div', { className: 'modal-footer' });
    const cancelBtn = el('button', {
      type: 'button',
      className: 'btn btn-secondary',
      onclick: () => this.close()
    }, 'Abbrechen');
    
    const submitBtn = el('button', {
      type: 'button',
      className: 'btn btn-primary',
      onclick: () => this.handleSubmit()
    }, 'Erstellen');

    footer.appendChild(cancelBtn);
    footer.appendChild(submitBtn);
    content.appendChild(footer);

    dialog.appendChild(content);
    modal.appendChild(dialog);

    // Wrapper to hold both backdrop and modal
    const wrapper = el('div', {});
    wrapper.appendChild(backdrop);
    wrapper.appendChild(modal);
    
    this.modalElement = wrapper;

    // Focus input after render
    setTimeout(() => this.inputElement?.focus(), 100);

    return wrapper;
  }

  private handleSubmit() {
    if (!this.inputElement) return;
    const value = this.inputElement.value.trim();
    if (value) {
      this.onSubmit(value);
      this.close();
    }
  }

  private close() {
    if (this.modalElement && this.modalElement.parentElement) {
      this.modalElement.parentElement.removeChild(this.modalElement);
    }
  }
}