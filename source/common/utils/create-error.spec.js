import { assert } from 'chai';
import Boom from 'boom';
import createError from 'common/utils/create-error';

describe('createError', () => {
  it('creates correct Boom object', () => {
    const boom = Boom.badData('No user found for given username and password.');
    const error = createError(boom, 'WrongCredentials');

    assert.equal(error.output.payload.type, 'WrongCredentials');
  });
});
