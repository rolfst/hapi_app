import NativeEventEmitter from 'events';

class EventEmitter extends NativeEventEmitter {
  constructor() {
    super();

    this.asyncOn = (eventName, fn) => {
      return this.on(eventName, () => setImmediate(fn));
    };
  }
}

export default EventEmitter;
