import { EventEmitter } from 'events';

class EventManager extends EventEmitter {
  private static instance: EventManager;

  private constructor() {
    super();
  }

  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }
}

export const eventManager = EventManager.getInstance();

// 事件类型常量
export const EVENT_TYPES = {
  SHOW_EXPERIENCE_ANIMATION: 'SHOW_EXPERIENCE_ANIMATION',
  HIDE_EXPERIENCE_ANIMATION: 'HIDE_EXPERIENCE_ANIMATION',
} as const;
