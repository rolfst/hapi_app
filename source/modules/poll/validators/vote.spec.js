import { assert } from 'chai';
import Joi from 'joi';
import scheme from './vote';

describe('Validator: vote', () => {
  it('should succeed when receiving option_ids', () => {
    const payload = { option_ids: ['1', '2'] };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNull(actual.error);
  });

  it('should fail when option_ids doesn\'t exist', () => {
    const payload = { options: [] };
    const actual = Joi.validate({ payload }, scheme);

    assert.ifError(actual.error[0]);
  });

  it('should fail when option_ids is empty', () => {
    const payload = { option_ids: [] };
    const actual = Joi.validate({ payload }, scheme);

    assert.ifError(actual.error[0]);
  });
});
