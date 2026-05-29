export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  innerHTML?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (innerHTML) element.innerHTML = innerHTML;
  return element;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Partial<HTMLElementTagNameMap[K]> & { className?: string; children?: (Node | string)[] },
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  
  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value as string;
      } else if (key === 'children') {
        // Handled below
      } else if (key.startsWith('on') && typeof value === 'function') {
        const event = key.substring(2).toLowerCase();
        element.addEventListener(event, value as EventListener);
      } else {
        (element as any)[key] = value;
      }
    });

    if (props.children) {
      children = [...props.children, ...children];
    }
  }

  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });

  return element;
}

export function clearElement(element: HTMLElement) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
