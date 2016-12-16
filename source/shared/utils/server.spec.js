import { assert } from 'chai';
import sinon from 'sinon';
import * as loggerService from '../services/logger';
import createError from './create-error';
import * as unit from './server';

describe('serverUtil', () => {
  describe('transformBoomToErrorResponse', () => {
    it('creates correct error payload object', () => {
      const error = createError('400');
      const actual = unit.transformBoomToErrorResponse(error);
      const expected = {
        type: 'bad_request',
        detail: 'The request cannot be fulfilled due to bad syntax.',
        error_code: '400',
        status_code: 400,
      };

      assert.deepEqual(actual, expected);
    });

    it('created correct error payload object with overwritten developer message', () => {
      const error = createError('400', 'My developer message.');
      const actual = unit.transformBoomToErrorResponse(error);
      const expected = {
        type: 'bad_request',
        detail: 'My developer message.',
        error_code: '400',
        status_code: 400,
      };

      assert.deepEqual(actual, expected);
    });
  });

  describe('onPreResponse', () => {
    it.skip('should log on runtimeException', () => {
      const loggerStub = sinon.stub(loggerService.createLogger('Foo'));
      sinon.stub(loggerService, 'createLogger').returns(loggerStub);

      const reply = () => ({ code: () => {} });

      try {
        1 / i; // eslint-disable-line
      } catch (err) {
        const req = { response: err };
        unit.onPreResponse(req, reply);

        assert.equal(loggerStub.error.callCount, 1);
        assert.equal(loggerStub.error.firstCall.args[0], 'Error from application');
        assert.equal(loggerStub.error.firstCall.args[1].err.message, 'i is not defined');
      }
    });
  });
});
