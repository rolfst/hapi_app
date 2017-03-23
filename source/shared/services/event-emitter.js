const NativeEventEmitter = require('events');
const Promise = require('bluebird');
const Logger = require('./logger');

class EventEmitter extends NativeEventEmitter {
  constructor() {
    super();

    this.logger = Logger.createLogger('SHARED/eventEmitter');
  }

  setLogger(logger) {
    this.logger = logger;
  }

  asyncOn(eventName, callback) {
    const that = this;
    return this.on(eventName, (...args) => {
      return Promise.try(() => callback(...args)).catch((err) =>
        that.logger.error('Error while emitting event', { eventName, err }));
    });
  }
}

exports.create = () => new EventEmitter();
