import { assert } from 'chai';
import sinon from 'sinon';
import Promise from 'bluebird';
import blueprints from 'common/test-utils/blueprints';
import
  * as makeAuthenticationPromises
from 'modules/authentication/services/make-authentication-promises';
import systemUnderTest from 'modules/authentication/services/authenticate-integrations';

describe('authenticateIntegrations', () => {
  it('should fail when there is no adapter found', () => {
    const stubbedPromises = [
      Promise.resolve('foo'),
      Promise.reject('bar'),
      Promise.reject('baz'),
      Promise.resolve('qaz'),
    ];

    const stub = sinon.stub(makeAuthenticationPromises, 'default').returns(stubbedPromises);
    const actual = systemUnderTest({}, blueprints.users.admin);

    stub.restore();

    return assert.eventually.deepEqual(actual, ['foo', 'qaz']);
  });
});
