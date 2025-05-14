/**
 * A simple event emitter class for handling events and callbacks
 */
export class EventEmitter {
  private events: Record<string, Function[]> = {};

  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Callback function
   */
  public on(event: string, callback: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Unsubscribe from an event
   * @param event Event name
   * @param callback Callback function
   */
  public off(event: string, callback: Function): void {
    if (!this.events[event]) {
      return;
    }
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  /**
   * Emit an event
   * @param event Event name
   * @param args Arguments to pass to callback
   */
  public emit(event: string, ...args: any[]): void {
    if (!this.events[event]) {
      return;
    }
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event callback for ${event}:`, error);
      }
    });
  }

  /**
   * Subscribe to an event and unsubscribe after it fires once
   * @param event Event name
   * @param callback Callback function
   */
  public once(event: string, callback: Function): void {
    const onceCallback = (...args: any[]) => {
      callback(...args);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * Remove all event listeners
   * @param event Optional event name to clear only specific event
   */
  public clear(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
} 