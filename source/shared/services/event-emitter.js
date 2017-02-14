import NativeEventEmitter from 'events';
import * as Logger from './logger';

class EventEmitter extends NativeEventEmitter {
  constructor() {
    super();

    this.logger = Logger.createLogger('SHARED/eventEmitter');
  }

  setLogger(logger) {
    this.logger = logger;
  }

  asyncOn(eventName, fn) {
    const that = this;
    return this.on(eventName, (...args) => {
      return fn.apply(this, args).catch(err =>
        that.logger.error('Error while emitter event', { eventName, err }));
    });
  }
}

export default {
  create: () => new EventEmitter(),
};
