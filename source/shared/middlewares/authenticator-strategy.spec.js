const { assert } = require('chai');
const sinon = require('sinon');
const createError = require('../utils/create-error');
const tokenUtil = require('../utils/token');
const loggerService = require('../services/logger');
const userRepo = require('../../modules/core/repositories/user');
const strategy, { authenticate } = require('./authenticator-strategy');

describe('Middleware: AuthenticatorStrategy', () => {
  describe('Business logic', () => {
    const user = { id: 1337, username: 'johndoe@example.com' };
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(userRepo, 'findUserById').returns(user);
    });

    afterEach(() => (sandbox.restore()));

    it('should return correct user credentials', async () => {
      sandbox.stub(tokenUtil, 'decode').returns({ sub: user.id });
      const result = await authenticate(1, 'foo');

      assert.deepEqual(result.credentials, user);
    });

    it('should find user by token sub', async () => {
      sandbox.stub(tokenUtil, 'decode').returns({ sub: user.id });
      await authenticate(1, 'foo');

      assert(userRepo.findUserById.calledWith(user.id));
      assert(userRepo.findUserById.calledOnce);
    });

    it('should return integration from token as artifacts', async () => {
      const integrations = { integrations: [{ name: 'Foo' }] };
      sandbox.stub(tokenUtil, 'decode').returns({ integrations: [{ name: 'Foo' }] });
      const result = await authenticate(1, 'foo');

      assert.deepEqual(result.artifacts, integrations);
    });

    it('should throw error when user cannot be authenticated', async () => {
      userRepo.findUserById.restore();
      sandbox.stub(userRepo, 'findUserById').returns(Promise.reject(createError('10004')));
      sandbox.stub(tokenUtil, 'decode').returns({ sub: null });

      const promise = authenticate(1, 'foo');

      return assert.isRejected(promise, new RegExp(createError('10004').message));
    });

    it('should throw error when token is empty', () => {
      const promise = authenticate(1, null);

      return assert.isRejected(promise, new RegExp(createError('401').message));
    });
  });

  describe('Meta request info', () => {
    const user = { id: 1337, username: 'johndoe@example.com' };
    let sandbox;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(userRepo, 'findUserById').returns(Promise.reject(createError('10004')));
      sandbox.stub(tokenUtil, 'decode').returns({ sub: user.id });
    });

    afterEach(() => sandbox.restore());

    it.skip('should log an error', async () => {
      const request = {
        params: { networkdId: 1 },
        raw: { req: { headers: { 'x-api-token': 'foo' } } },
        url: { path: [] },
      };

      const loggerStub = sandbox.stub(loggerService.createLogger('Foo'));
      sandbox.stub(loggerService, 'createLogger').returns(loggerStub);
      const mockReply = () => ({
        takeover: () => ({ code: () => {} }),
      });

      await strategy().authenticate(request, mockReply);

      assert.equal(loggerStub.error.callCount, 1);
      assert.equal(loggerStub.error.firstCall.args[0],
        'Error in Authenticator Strategy');

      assert.equal(loggerStub.error.firstCall.args[1].err.message,
        'No user found for given username and password.');
    });
  });
});
