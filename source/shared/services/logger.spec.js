const { assert } = require('chai');
const stream = require('stream');
const sinon = require('sinon');
const bunyan = require('bunyan');
const loggerService = require('./logger');
const createError = require('../utils/create-error');

describe('Logger', () => {
  let loggerStub;
  let logger;
  const defaultMessage = { artifacts: { requestId: 'rid:002' } };

  before(() => {
    loggerStub = sinon.stub(bunyan.createLogger({ name: 'TestLogger' }));
    logger = loggerService.createLogger(loggerStub);
  });

  it('should log on info level', () => {
    loggerStub.info.reset();
    logger.info('hi', { foo: 'baz' });

    const expectedArgs = [{ foo: 'baz' }, 'hi'];

    assert.equal(loggerStub.info.callCount, 1);
    assert.deepEqual(loggerStub.info.firstCall.args, expectedArgs);
  });

  it('should replace Streams in payload', () => {
    const filteredObject = loggerService.removeStreamsFromContext({
      context: {
        payload: {
          foo: 'Ok',
          file: new stream.Readable({ objectMode: true }),
        },
      },
    });

    const expectedObject = {
      context: {
        payload: {
          file: 'Readable Stream',
          foo: 'Ok',
        },
      },
    };

    assert.deepEqual(filteredObject, expectedObject);
  });

  it('should log on debug level', () => {
    loggerStub.debug.reset();
    logger.debug('hi', { message: defaultMessage });

    const expectedArgs = [{
      message: { artifacts: { requestId: 'rid:002' } },
    }, 'hi'];

    assert.equal(loggerStub.debug.callCount, 1);
    assert.notProperty(loggerStub.debug.firstCall.args, 'err');
    assert.deepEqual(loggerStub.debug.firstCall.args, expectedArgs);
  });

  it('should log on debug level with multiple context objects', () => {
    loggerStub.debug.reset();
    const extraObject = { extra: 'extraobject' };
    const extraObject2 = { extra: 'extraobject2', nested: { greetings: 'hello' } };
    logger.debug('hi', { context: { extraObject, extraObject2 }, message: defaultMessage });

    const expectedArgs = [{
      message: { artifacts: { requestId: 'rid:002' } },
      context: { extraObject, extraObject2 },
    }, 'hi'];

    assert.equal(loggerStub.debug.callCount, 1);
    assert.notProperty(loggerStub.debug.firstCall.args, 'err');
    assert.lengthOf(Object.keys(loggerStub.debug.firstCall.args[0].context), 2);
    assert.deepEqual(loggerStub.debug.firstCall.args, expectedArgs);
  });

  it('should log on warning level without error', () => {
    loggerStub.warn.reset();
    logger.warn('hi', { message: defaultMessage });

    const expectedArgs = [{
      message: { artifacts: { requestId: 'rid:002' } },
    }, 'hi'];

    assert.equal(loggerStub.warn.callCount, 1);
    assert.notProperty(loggerStub.warn.firstCall.args, 'err');
    assert.deepEqual(loggerStub.warn.firstCall.args, expectedArgs);
  });

  it('should log on warning level with error', () => {
    loggerStub.warn.reset();

    try {
      throw createError('10006', defaultMessage);
    } catch (e) {
      logger.warn('warning', e);
    }

    assert.equal(loggerStub.warn.callCount, 1);
  });

  it('should log on error level without error', () => {
    loggerStub.error.reset();
    logger.error('error', { message: defaultMessage });

    const expectedArgs = [{
      message: { artifacts: { requestId: 'rid:002' } },
    }, 'error'];

    assert.equal(loggerStub.error.callCount, 1);
    assert.deepEqual(loggerStub.error.firstCall.args, expectedArgs);
  });

  it('should log on error level with error', () => {
    loggerStub.error.reset();

    try {
      throw createError('10006', defaultMessage);
    } catch (e) {
      logger.error('error', e);
    }

    assert.equal(loggerStub.error.callCount, 1);
  });

  it('should log a fatal message', () => {
    loggerStub.fatal.reset();

    try {
      throw new Error('Unrecoverable error');
    } catch (e) {
      logger.fatal('fatal', e);
    }

    assert.equal(loggerStub.fatal.callCount, 1);
    assert.deepEqual(loggerStub.fatal.firstCall.args[0].message, 'Unrecoverable error');
  });
});
