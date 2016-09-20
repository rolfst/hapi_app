import { assert } from 'chai';
import createError from './create-error';
import * as responseUtil from './response';

describe('responseUtil', () => {
  describe('error', () => {
    it('creates correct error object', () => {
      const error = createError('400');
      const actual = responseUtil.error(error);

      assert.deepEqual(actual, { error });
    });
  });
});
