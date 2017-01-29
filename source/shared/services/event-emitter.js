import NativeEventEmitter from 'events';

class EventEmitter extends NativeEventEmitter {
  constructor() {
    super();

    this.asyncOn = function (eventName, fn) {
      return this.on(eventName, (...args) =>
        setImmediate(() => fn.apply(this, args)));
    };
  }
}

export default EventEmitter;
