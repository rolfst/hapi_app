import { assert } from 'chai';
import Joi from 'joi';
import scheme from './create-message';

describe('Validator: create-message', () => {
  it('should succeed when only files property is provided', async () => {
    const payload = { files: ['123'] };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNull(actual.error);
  });

  it('should succeed when both text and files are provided', async () => {
    const payload = { text: 'just a text', files: ['123'] };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNull(actual.error);
  });

  it('should succeed when only a text is provided', async () => {
    const payload = { text: 'just a text' };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNull(actual.error);
  });

  it('should return error when no param is provided', async () => {
    const payload = { };
    const actual = Joi.validate({ payload }, scheme);

    assert.ifError(actual.error[0]);
  });

  it('should return error when unknown param is provided', async () => {
    const payload = { unknown: 'hi' };
    const actual = Joi.validate(payload, scheme);

    assert.ifError(actual.error[0]);
  });

  it('should fail when no param is provided', async () => {
    const actual = Joi.validate({}, scheme);

    assert.ifError(actual.error);
  });
});
