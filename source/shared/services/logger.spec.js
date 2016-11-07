import { assert } from 'chai';
import * as Logger from './logger';
import mockConsole from 'std-mocks';
import createError from '../utils/create-error';

describe('Logger', () => {
  beforeEach(() => {
    mockConsole.use();
  });

  afterEach(() => {
    mockConsole.restore();
    mockConsole.flush();
  });

  it('should log on info level', () => {
    const logger = Logger.getLogger('infoLogger');
    logger.info('hi');

    const output = mockConsole.flush();
    const logMsg = JSON.parse(output.stdout[0]);

    assert.equal(logMsg.name, 'infoLogger');
    assert.equal(logMsg.level, 30);
    assert.equal(logMsg.msg, 'hi');
    assert.notProperty(logMsg, 'err');
  });

  it('should log on info level', () => {
    const logger = Logger.getLogger('infoLogger');
    const message = { artifacts: { requestId: 'rid:001' } };
    logger.info('hi', { message });

    const output = mockConsole.flush();
    const logMsg = JSON.parse(output.stdout[0]);

    assert.equal(logMsg.name, 'infoLogger');
    assert.equal(logMsg.level, 30);
    assert.equal(logMsg.requestId, 'rid:001');
    assert.equal(logMsg.msg, 'hi');
    assert.notProperty(logMsg, 'err');
  });

  it('should log on debug level', () => {
    const logger = Logger.getLogger('debugLogger');
    const message = { artifacts: { requestId: 'rid:002' } };
    logger.debug('hi', { message });

    const output = mockConsole.flush();
    const logMsg = JSON.parse(output.stdout[0]);

    assert.equal(logMsg.name, 'debugLogger');
    assert.equal(logMsg.level, 20);
    assert.equal(logMsg.requestId, 'rid:002');
    assert.equal(logMsg.msg, 'hi');
    assert.notProperty(logMsg, 'err');
  });

  it('should log on debug level with multiple context objects', () => {
    const logger = Logger.getLogger('debugLogger');
    const extraObject = { extra: 'extraobject' };
    const extraObject2 = { extra: 'extraobject2', nested: { greetings: 'hello' } };

    logger.debug('hi', {
      extraObject,
      extraObject2,
      message: { artifacts: { requestId: 'rid:002' } },
    });

    const output = mockConsole.flush();
    const logMsg = JSON.parse(output.stdout[0]);

    assert.equal(logMsg.name, 'debugLogger');
    assert.equal(logMsg.level, 20);
    assert.equal(logMsg.requestId, 'rid:002');
    assert.equal(logMsg.msg, 'hi');
    assert.lengthOf(Object.keys(logMsg.context), 2);
    assert.deepEqual(logMsg.context, { extraObject, extraObject2 });
    assert.equal(logMsg.context.extraObject2.nested.greetings, 'hello');
    assert.notProperty(logMsg, 'err');
  });

  it('should log on warning level without error', () => {
    const logger = Logger.getLogger('warnLogger');
    const message = { message: { artifacts: { requestId: 'rid:002' } } };

    logger.warn('warning', message);

    const output = mockConsole.flush();
    const logMsg = JSON.parse(output.stdout[0]);

    assert.equal(logMsg.name, 'warnLogger');
    assert.equal(logMsg.level, 40);
    assert.equal(logMsg.requestId, 'rid:002');
    assert.equal(logMsg.msg, 'warning');
    assert.notProperty(logMsg, 'err');
  });

  it('should log on warning level with error', () => {
    const logger = Logger.getLogger('warnLogger');
    const message = { artifacts: { requestId: 'rid:003' } };
    let err;

    try {
      throw createError('10006');
    } catch (e) {
      err = e;
      logger.warn('warning', { message, err: e });
    }

    const output = mockConsole.flush();
    const logMsg = JSON.parse(output.stdout[0]);

    assert.equal(logMsg.name, 'warnLogger');
    assert.property(logMsg, 'err');
    assert.equal(logMsg.err.output.statusCode, err.output.statusCode);
    assert.equal(logMsg.err.data.errorCode, err.data.errorCode);
    assert.equal(logMsg.level, 40);
    assert.equal(logMsg.requestId, 'rid:003');
    assert.equal(logMsg.msg, 'warning');
    assert.lengthOf(Object.keys(logMsg.context), 0);
  });

  it('should log on warning level with error without artifacts', () => {
    const logger = Logger.getLogger('warnLogger');
    const message = { artifacts: undefined };
    let err;

    try {
      throw createError('10006');
    } catch (e) {
      err = e;
      logger.warn('warning', { message, err: e });
    }

    const output = mockConsole.flush();
    const logMsg = JSON.parse(output.stdout[0]);

    assert.equal(logMsg.name, 'warnLogger');
    assert.property(logMsg, 'err');
    assert.equal(logMsg.err.output.statusCode, err.output.statusCode);
    assert.equal(logMsg.err.data.errorCode, err.data.errorCode);
    assert.equal(logMsg.level, 40);
    assert.equal(logMsg.msg, 'warning');
    assert.lengthOf(Object.keys(logMsg.context), 0);
  });

  it('should log on error level without error', () => {
    const logger = Logger.getLogger('errorLogger');
    const message = { artifacts: { requestId: 'rid:002' } };

    logger.error('error', { message });

    const output = mockConsole.flush();
    const logMsg = JSON.parse(output.stdout[0]);

    assert.equal(logMsg.name, 'errorLogger');
    assert.equal(logMsg.level, 50);
    assert.equal(logMsg.requestId, 'rid:002');
    assert.equal(logMsg.msg, 'error');
    assert.notProperty(logMsg, 'err');
  });

  it('should log on error level with error', () => {
    const logger = Logger.getLogger('errorLogger');
    const message = { artifacts: { requestId: 'rid:002' } };
    let err;

    try {
      throw createError('10006');
    } catch (e) {
      err = e;
      logger.error('error', { message, err: e });
    }

    const output = mockConsole.flush();
    const logMsg = JSON.parse(output.stdout[0]);

    assert.equal(logMsg.name, 'errorLogger');
    assert.property(logMsg, 'err');
    assert.equal(logMsg.err.output.statusCode, err.output.statusCode);
    assert.equal(logMsg.err.data.errorCode, err.data.errorCode);
    assert.equal(logMsg.level, 50);
    assert.equal(logMsg.requestId, 'rid:002');
    assert.equal(logMsg.msg, 'error');
  });

  it('should log on error level with error and no artifacts', () => {
    const logger = Logger.getLogger('errorLogger');
    const message = { artifacts: undefined };
    let err;

    try {
      throw createError('10006');
    } catch (e) {
      err = e;
      logger.error('error', { message, err: e });
    }

    const output = mockConsole.flush();
    const logMsg = JSON.parse(output.stdout[0]);

    assert.equal(logMsg.name, 'errorLogger');
    assert.property(logMsg, 'err');
    assert.equal(logMsg.err.output.statusCode, err.output.statusCode);
    assert.equal(logMsg.err.data.errorCode, err.data.errorCode);
    assert.equal(logMsg.level, 50);
    assert.equal(logMsg.msg, 'error');
  });

  it('should log on error level with error and multiple context objects', () => {
    const logger = Logger.getLogger('errorLogger');
    const message = { artifacts: { requestId: 'rid:002' } };
    const extraObject = { extra: 'extraobject' };
    const extraObject2 = { extra: 'extraobject2', nested: { greetings: 'hello' } };
    let err;

    try {
      throw createError('10006');
    } catch (e) {
      err = e;
      logger.error('error', {
        extraObject,
        extraObject2,
        message,
        err: e,
      });
    }

    const output = mockConsole.flush();
    const logMsg = JSON.parse(output.stdout[0]);

    assert.equal(logMsg.name, 'errorLogger');
    assert.property(logMsg, 'err');
    assert.equal(logMsg.err.output.statusCode, err.output.statusCode);
    assert.equal(logMsg.err.data.errorCode, err.data.errorCode);
    assert.equal(logMsg.level, 50);
    assert.equal(logMsg.requestId, 'rid:002');
    assert.equal(logMsg.msg, 'error');
    assert.lengthOf(Object.keys(logMsg.context), 2);
    assert.deepEqual(logMsg.context, { extraObject, extraObject2 });
    assert.equal(logMsg.context.extraObject2.nested.greetings, 'hello');
  });

  it('should log a fatal message', () => {
    const logger = Logger.getLogger('fatalLogger');

    try {
      throw new Error('unrecoverable error');
    } catch (e) {
      logger.fatal('fatal', e);
    }

    const output = mockConsole.flush();
    const logMsg = JSON.parse(output.stdout[0]);

    assert.equal(logMsg.name, 'fatalLogger');
    assert.equal(logMsg.level, 60);
    assert.equal(logMsg.msg, 'fatal');
    assert.property(logMsg, 'err');
    assert.equal(logMsg.err.message, 'unrecoverable error');
  });
});
