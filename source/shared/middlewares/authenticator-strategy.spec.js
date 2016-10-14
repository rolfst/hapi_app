import { assert } from 'chai';
import sinon from 'sinon';
import createError from '../utils/create-error';
import tokenUtil from '../utils/token';
import * as userRepo from '../../modules/core/repositories/user';
import * as strategy from '../middlewares/authenticator-strategy';

describe('authenticatorStrategy', () => {
  const user = { id: 1337, username: 'johndoe@example.com' };

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(userRepo, 'findUserById').returns(user);
  });

  afterEach(() => (sandbox.restore()));

  it('should return correct user credentials', async () => {
    sandbox.stub(tokenUtil, 'decode').returns({ sub: user.id });
    const result = await strategy.authenticate(1, 'foo');

    assert.deepEqual(result.credentials, user);
  });

  it('should find user by token sub', async () => {
    sandbox.stub(tokenUtil, 'decode').returns({ sub: user.id });
    await strategy.authenticate(1, 'foo');

    assert(userRepo.findUserById.calledWith(user.id));
    assert(userRepo.findUserById.calledOnce);
  });

  it('should return integration from token as artifacts', async () => {
    const integrations = { integrations: [{ name: 'Foo' }] };
    sandbox.stub(tokenUtil, 'decode').returns({ integrations: [{ name: 'Foo' }] });
    const result = await strategy.authenticate(1, 'foo');

    assert.deepEqual(result.artifacts, integrations);
  });

  it('should throw error when user cannot be authenticated', async () => {
    userRepo.findUserById.restore();
    sandbox.stub(userRepo, 'findUserById').returns(Promise.reject(createError('10004')));
    sandbox.stub(tokenUtil, 'decode').returns({ sub: null });

    const promise = strategy.authenticate(1, 'foo');

    return assert.isRejected(promise, new RegExp(createError('10004').message));
  });

  it('should throw error when token is empty', () => {
    const promise = strategy.authenticate(1, null);

    return assert.isRejected(promise, new RegExp(createError('401').message));
  });
});
