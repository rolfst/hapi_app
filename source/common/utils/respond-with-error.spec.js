import { assert } from 'chai';
import Boom from 'boom';
import createError from 'common/utils/create-error';
import respondWithError from 'common/utils/respond-with-error';

describe('respondWithError', () => {
  it('creates correct Boom object', () => {
    const message = 'No user found for given username and password.';
    const title = 'WrongCredentials';

    const boom = Boom.badData('No user found for given username and password.');
    const error = createError(boom, title);

    const response = respondWithError(error);

    assert.equal(response.error.status_code, 422);
    assert.equal(response.error.title, title);
    assert.equal(response.error.detail, message);
  });
});
