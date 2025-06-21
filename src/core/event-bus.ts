/**
 * Event bus implementation for Claude-Flow
 */

import { SystemEvents, EventMap } from "../utils/types.js";
import { TypedEventEmitter } from "../utils/helpers.js";

export interface IEventBus {
  emit(event: string, data?: unknown): void;
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler: (data: unknown) => void): void;
  once(event: string, handler: (data: unknown) => void): void;
}

/**
 * Internal typed event bus
 */
class TypedEventBus extends TypedEventEmitter<EventMap> {
  private eventCounts = new Map<keyof EventMap, number>();
  private lastEventTimes = new Map<keyof EventMap, number>();
  private debug: boolean;

  constructor(debug = false) {
    super();
    this.debug = debug;
  }

  /**
   * Emits an event with logging
   */
  override emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    if (this.debug) {
      console.debug(`[EventBus] Emitting event: ${String(event)}`, data);
    }
    
    // Track event metrics
    const count = this.eventCounts.get(event) ?? 0;
    this.eventCounts.set(event, count + 1);
    this.lastEventTimes.set(event, Date.now());
    
    super.emit(event, data);
  }

  /**
   * Get event statistics
   */
  getEventStats(): { event: string; count: number; lastEmitted: Date | null }[] {
    const stats: { event: string; count: number; lastEmitted: Date | null }[] = [];
    
    for (const [event, count] of this.eventCounts.entries()) {
      const lastTime = this.lastEventTimes.get(event);
      stats.push({
        event: String(event),
        count,
        lastEmitted: lastTime ? new Date(lastTime) : null,
      });
    }
    
    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * Reset event statistics
   */
  resetStats(): void {
    this.eventCounts.clear();
    this.lastEventTimes.clear();
  }
}

/**
 * Global event bus for system-wide communication
 */
export class EventBus implements IEventBus {
  private static instance: EventBus;
  private typedBus: TypedEventBus;

  private constructor(debug = false) {
    this.typedBus = new TypedEventBus(debug);
  }

  /**
   * Gets the singleton instance of the event bus
   */
  static getInstance(debug = false): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(debug);
    }
    return EventBus.instance;
  }

  /**
   * Emits an event
   */
  emit(event: string, data?: unknown): void {
    // Type-safe emission for known events
    if (event in SystemEvents) {
      this.typedBus.emit(event as keyof EventMap, data);
    } else {
      // For custom events, emit as-is
      // Cast to keyof EventMap for custom events - this is safe because we're extending the event system
      this.typedBus.emit(event as keyof EventMap, data);
    }
  }

  /**
   * Registers an event handler
   */
  on(event: string, handler: (data: unknown) => void): void {
    this.typedBus.on(event as keyof EventMap, handler as (data: EventMap[keyof EventMap]) => void);
  }

  /**
   * Removes an event handler
   */
  off(event: string, handler: (data: unknown) => void): void {
    this.typedBus.off(event as keyof EventMap, handler as (data: EventMap[keyof EventMap]) => void);
  }

  /**
   * Registers a one-time event handler
   */
  once(event: string, handler: (data: unknown) => void): void {
    this.typedBus.once(event as keyof EventMap, handler as (data: EventMap[keyof EventMap]) => void);
  }

  /**
   * Waits for an event to occur
   */
  async waitFor(event: string, timeoutMs?: number): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const handler = (data: unknown) => {
        if (timer) clearTimeout(timer);
        resolve(data);
      };

      let timer: NodeJS.Timeout | undefined;
      if (timeoutMs) {
        timer = setTimeout(() => {
          this.off(event, handler);
          reject(new Error(`Timeout waiting for event: ${event}`));
        }, timeoutMs);
      }

      this.once(event, handler);
    });
  }

  /**
   * Creates a filtered event listener
   */
  onFiltered(
    event: string,
    filter: (data: unknown) => boolean,
    handler: (data: unknown) => void,
  ): void {
    this.on(event, (data) => {
      if (filter(data)) {
        handler(data);
      }
    });
  }

  /**
   * Get event statistics
   */
  getEventStats(): { event: string; count: number; lastEmitted: Date | null }[] {
    return this.typedBus.getEventStats();
  }

  /**
   * Reset event statistics
   */
  resetStats(): void {
    this.typedBus.resetStats();
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    this.typedBus.removeAllListeners(event as keyof EventMap | undefined);
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();