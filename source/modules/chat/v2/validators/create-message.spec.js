const { assert } = require('chai');
const Joi = require('joi');
const scheme = require('./create-message');

describe('Validator: create-message', () => {
  it('should succeed when only files property is provided', async () => {
    const payload = { files: ['123'] };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNull(actual.error);
  });

  it('should succeed when only files property and an empty text property are provided', () => {
    const payload = { text: '', files: ['123'] };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNull(actual.error);
  });

  it('should succeed when only files property and an empty text property are provided', () => {
    const payload = { text: null, files: ['123'] };
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

  it('should succeed when only an empty text value is provided', async () => {
    const payload = { text: '' };
    const actual = Joi.validate(payload, scheme.payload);

    assert.isNull(actual.error);
  });

  it('should return error when no param is provided', async () => {
    const payload = { };
    const actual = Joi.validate(payload, scheme.payload);

    assert.isNotNull(actual.error);
  });

  it('should return error when an unknown param is provided', async () => {
    const payload = { unknown: 'hi' };
    const actual = Joi.validate(payload, scheme.payload);

    assert.isNotNull(actual.error);
  });
});
