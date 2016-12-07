import { assert } from 'chai';
import sinon from 'sinon';
import mockConsole from 'std-mocks';
import createError from '../utils/create-error';
import tokenUtil from '../utils/token';
import * as userRepo from '../../modules/core/repositories/user';
import strategy, { authenticate } from './authenticator-strategy';

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

    it('should log an error', async () => {
      const request = {
        params: { networkdId: 1 },
        raw: { req: { headers: { 'x-api-token': 'foo' } } },
        url: { path: [] },
      };

      const mockReply = () => ({
        takeover: () => ({ code: () => {} }),
      });

      mockConsole.use();

      await strategy().authenticate(request, mockReply);

      const output = mockConsole.flush();
      const logMsg = JSON.parse(output.stdout[0]);

      mockConsole.restore();

      assert.equal(logMsg.name, 'SHARED/middleware/authenticatorStrategy');
      assert.equal(logMsg.errorCode, '10004');
    });
  });
});
