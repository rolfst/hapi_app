const { assert } = require('chai');
const createError = require('./create-error');
const responseUtil = require('./response');

describe('responseUtil', () => {
  describe('error', () => {
    it('creates correct error object', () => {
      const error = createError('400');
      const actual = responseUtil.error(error);

      assert.deepEqual(actual, { error });
    });
  });
});
