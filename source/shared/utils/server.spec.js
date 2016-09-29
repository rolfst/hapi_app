import { assert } from 'chai';
import createError from './create-error';
import * as unit from './server';

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
