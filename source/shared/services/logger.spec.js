import { assert } from 'chai';
import sinon from 'sinon';
import bunyan from 'bunyan';
import * as loggerService from './logger';
import createError from '../utils/create-error';

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

    const expectedArgs = [{
      err: null,
      message: {},
      context: { foo: 'baz' },
    }, 'hi'];

    assert.equal(loggerStub.info.callCount, 1);
    assert.deepEqual(loggerStub.info.firstCall.args, expectedArgs);
  });

  it('should log on debug level', () => {
    loggerStub.debug.reset();
    logger.debug('hi', { message: defaultMessage });

    const expectedArgs = [{
      err: null,
      message: { artifacts: { requestId: 'rid:002' } },
      context: {},
    }, 'hi'];

    assert.equal(loggerStub.debug.callCount, 1);
    assert.notProperty(loggerStub.debug.firstCall.args, 'err');
    assert.deepEqual(loggerStub.debug.firstCall.args, expectedArgs);
  });

  it('should log on debug level with multiple context objects', () => {
    loggerStub.debug.reset();
    const extraObject = { extra: 'extraobject' };
    const extraObject2 = { extra: 'extraobject2', nested: { greetings: 'hello' } };
    logger.debug('hi', { extraObject, extraObject2, message: defaultMessage });

    const expectedArgs = [{
      err: null,
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
      err: null,
      message: { artifacts: { requestId: 'rid:002' } },
      context: {},
    }, 'hi'];

    assert.equal(loggerStub.warn.callCount, 1);
    assert.notProperty(loggerStub.warn.firstCall.args, 'err');
    assert.deepEqual(loggerStub.warn.firstCall.args, expectedArgs);
  });

  it('should log on warning level with error', () => {
    let error;
    loggerStub.warn.reset();

    try {
      throw createError('10006');
    } catch (e) {
      error = e;
      logger.warn('warning', { message: defaultMessage, err: e });
    }

    const expectedArgs = [{
      err: error.stack,
      message: { artifacts: { requestId: 'rid:002' } },
      context: {
        statusCode: error.output.statusCode,
        errorCode: error.data.errorCode,
      },
    }, 'warning'];

    assert.equal(loggerStub.warn.callCount, 1);
    assert.deepEqual(loggerStub.warn.firstCall.args, expectedArgs);
  });

  it('should log on warning level with error without artifacts', () => {
    let error;
    const message = { artifacts: undefined };
    loggerStub.warn.reset();

    try {
      throw createError('10006');
    } catch (e) {
      error = e;
      logger.warn('warning', { message, err: e });
    }

    const expectedArgs = [{
      err: error.stack,
      message: {},
      context: {
        statusCode: error.output.statusCode,
        errorCode: error.data.errorCode,
      },
    }, 'warning'];

    assert.equal(loggerStub.warn.callCount, 1);
    assert.deepEqual(loggerStub.warn.firstCall.args, expectedArgs);
  });

  it('should log on error level without error', () => {
    loggerStub.error.reset();
    logger.error('error', { message: defaultMessage });

    const expectedArgs = [{
      err: null,
      message: { artifacts: { requestId: 'rid:002' } },
      context: {},
    }, 'error'];

    assert.equal(loggerStub.error.callCount, 1);
    assert.deepEqual(loggerStub.error.firstCall.args, expectedArgs);
  });

  it('should log on error level with error', () => {
    let error;
    loggerStub.error.reset();

    try {
      throw createError('10006');
    } catch (e) {
      error = e;
      logger.error('error', { message: defaultMessage, err: e });
    }

    const expectedArgs = [{
      err: error.stack,
      message: { artifacts: { requestId: 'rid:002' } },
      context: {
        statusCode: error.output.statusCode,
        errorCode: error.data.errorCode,
      },
    }, 'error'];

    assert.equal(loggerStub.error.callCount, 1);
    assert.deepEqual(loggerStub.error.firstCall.args, expectedArgs);
  });

  it('should log on error level with error and no artifacts', () => {
    let error;
    const message = { artifacts: undefined };
    loggerStub.error.reset();

    try {
      throw createError('10006');
    } catch (e) {
      error = e;
      logger.error('error', { message, err: e });
    }

    const expectedArgs = [{
      err: error.stack,
      message: {},
      context: {
        statusCode: error.output.statusCode,
        errorCode: error.data.errorCode,
      },
    }, 'error'];

    assert.equal(loggerStub.error.callCount, 1);
    assert.deepEqual(loggerStub.error.firstCall.args, expectedArgs);
  });

  it('should log on error level with error and multiple context objects', () => {
    let error;
    const extraObject = { extra: 'extraobject' };
    const extraObject2 = { extra: 'extraobject2', nested: { greetings: 'hello' } };
    loggerStub.error.reset();

    try {
      throw createError('10006');
    } catch (e) {
      error = e;
      logger.error('error', { message: defaultMessage, extraObject, extraObject2, err: e });
    }

    const expectedArgs = [{
      err: error.stack,
      message: { artifacts: { requestId: 'rid:002' } },
      context: {
        extraObject,
        extraObject2,
        statusCode: error.output.statusCode,
        errorCode: error.data.errorCode,
      },
    }, 'error'];

    assert.equal(loggerStub.error.callCount, 1);
    assert.notProperty(loggerStub.error.firstCall.args, 'err');
    assert.lengthOf(Object.keys(loggerStub.error.firstCall.args[0].context), 4);
    assert.deepEqual(loggerStub.error.firstCall.args, expectedArgs);
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
