import { assert } from 'chai';
import createError from './create-error';

describe('createError', () => {
  it('creates correct error object', () => {
    const actual = createError('400');
    const expected = {
      type: 'bad_request',
      detail: 'The request cannot be fulfilled due to bad syntax.',
      is_error: true,
      status_code: 400,
    };

    assert.deepEqual(actual, expected);
  });

  it('created correct error object with overwritten developer message', () => {
    const actual = createError('400', 'My developer message.');
    const expected = {
      type: 'bad_request',
      detail: 'My developer message.',
      is_error: true,
      status_code: 400,
    };

    assert.deepEqual(actual, expected);
  });
});
