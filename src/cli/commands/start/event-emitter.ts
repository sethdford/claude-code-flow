/**
 * Simple EventEmitter implementation for process management
 */

// Define a generic event handler type that can accept any arguments
type EventHandler<T extends unknown[] = unknown[]> = (...args: T) => void;

// Define event map interface for type safety
interface EventMap {
  [event: string]: unknown[];
}

export class EventEmitter<T extends EventMap = EventMap> {
  private events: Map<keyof T, EventHandler[]> = new Map();

  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void {
    let handlers = this.events.get(event) as EventHandler<T[K]>[] | undefined;
    if (!handlers) {
      handlers = [];
      this.events.set(event, handlers);
    }
    handlers.push(handler);
  }

  emit<K extends keyof T>(event: K, ...args: T[K]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => (handler as EventHandler<T[K]>)(...args));
    }
  }

  off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void {
    const handlers = this.events.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler as EventHandler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  once<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void {
    const onceHandler: EventHandler<T[K]> = (...args) => {
      handler(...args);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }
}