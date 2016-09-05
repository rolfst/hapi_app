import { assert } from 'chai';
import Boom from 'boom';
import createError from 'common/utils/create-error';
import * as responseUtil from 'common/utils/response';

describe('responseUtil', () => {
  describe('error', () => {
    it('creates correct Boom object', () => {
      const message = 'No user found for given username and password.';
      const type = 'WrongCredentials';

      const boom = Boom.badData('No user found for given username and password.');
      const error = createError(boom, type);

      const response = responseUtil.error(error);

      assert.equal(response.error.status_code, 422);
      assert.equal(response.error.type, type);
      assert.equal(response.error.detail, message);
    });
  });
});
