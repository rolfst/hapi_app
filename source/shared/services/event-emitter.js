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

const createEmitter = () => new EventEmitter();

export default createEmitter;
