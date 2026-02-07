export interface SwipeHandlerOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export class SwipeHandler {
  private element: HTMLElement;
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private isDragging = false;
  private options: SwipeHandlerOptions;

  constructor(element: HTMLElement, options: SwipeHandlerOptions) {
    this.element = element;
    this.options = { threshold: 100, ...options };
    this.attach();
  }

  private attach() {
    this.element.addEventListener('touchstart', this.handleTouchStart);
    this.element.addEventListener('touchmove', this.handleTouchMove);
    this.element.addEventListener('touchend', this.handleTouchEnd);
    
    // Für Desktop-Testing auch Mouse-Events
    this.element.addEventListener('mousedown', this.handleMouseDown);
  }

  private handleTouchStart = (e: TouchEvent) => {
    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;
    this.isDragging = true;
    this.element.style.transition = 'none';
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isDragging) return;

    this.currentX = e.touches[0].clientX - this.startX;
    const currentY = e.touches[0].clientY - this.startY;

    // Nur horizontal swipen
    if (Math.abs(this.currentX) > Math.abs(currentY)) {
      e.preventDefault();
      this.element.style.transform = `translateX(${this.currentX}px)`;
      
      // Visuelles Feedback
      if (this.currentX < -50) {
        this.element.style.backgroundColor = 'rgba(214, 48, 49, 0.1)';
      } else {
        this.element.style.backgroundColor = '';
      }
    }
  };

  private handleTouchEnd = () => {
    if (!this.isDragging) return;

    this.element.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s';
    
    const threshold = this.options.threshold || 100;

    if (this.currentX < -threshold && this.options.onSwipeLeft) {
      // Swipe Left Animation
      this.element.style.transform = 'translateX(-100%)';
      this.element.style.opacity = '0';
      setTimeout(() => {
        this.options.onSwipeLeft!();
      }, 300);
    } else if (this.currentX > threshold && this.options.onSwipeRight) {
      this.options.onSwipeRight();
      this.reset();
    } else {
      this.reset();
    }

    this.isDragging = false;
    this.currentX = 0;
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.startX = e.clientX;
    this.isDragging = true;
    this.element.style.transition = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      this.currentX = e.clientX - this.startX;
      this.element.style.transform = `translateX(${this.currentX}px)`;
      
      if (this.currentX < -50) {
        this.element.style.backgroundColor = 'rgba(214, 48, 49, 0.1)';
      } else {
        this.element.style.backgroundColor = '';
      }
    };

    const handleMouseUp = () => {
      this.handleTouchEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  private reset() {
    this.element.style.transform = '';
    this.element.style.backgroundColor = '';
    this.element.style.opacity = '';
  }

  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('mousedown', this.handleMouseDown);
  }
}
