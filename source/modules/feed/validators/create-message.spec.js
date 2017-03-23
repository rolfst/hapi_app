const { assert } = require('chai');
const Joi = require('joi');
const scheme = require('./create-message');

describe('Validator: create-message', () => {
  it('should succeed when only files property is provided', () => {
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
    const actual = Joi.validate(payload, scheme.payload);

    assert.isNull(actual.error);
  });

  it('should succeed when both text and files are provided', () => {
    const payload = { text: 'just a text', files: ['123'] };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNull(actual.error);
  });

  it('should succeed when only a text is provided', () => {
    const payload = { text: 'just a text' };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNull(actual.error);
  });

  it('should succeed when only an empty text value is provided', async () => {
    const payload = { text: '' };
    const actual = Joi.validate(payload, scheme.payload);

    assert.isNull(actual.error);
  });

  it('should return error when no param is provided', () => {
    const payload = null;
    const actual = Joi.validate({ payload }, scheme);

    assert.isNotNull(actual.error);
  });

  it('should return error when unknown param is provided', () => {
    const payload = { unknown: 'hi' };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNotNull(actual.error);
  });

  it('should only allow poll_question when poll_options is provided', () => {
    const payload = { poll_question: 'hi' };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNotNull(actual.error);
  });

  it('should only allow poll_options when poll_question is provided', () => {
    const payload = { poll_options: ['hi'] };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNotNull(actual.error);
  });


  it('should only allow poll_options and poll_question together', () => {
    const payload = { poll_options: ['hi'], poll_question: 'hi' };
    const actual = Joi.validate(payload, scheme.payload);

    assert.isNull(actual.error);
  });
});
