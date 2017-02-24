import { assert } from 'chai';
import Joi from 'joi';
import * as testHelper from '../../../shared/test-utils/helpers';
import scheme from './create-message';

describe('Validator: create-message', () => {
  it('should succeed when only an attachment is provided', async () => {
    const hapiFile = testHelper.hapiFile('image.jpg');
    const payload = { attachments: [hapiFile] };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNull(actual.error);
  });

  it('should succeed when only an attachment is provided', async () => {
    const hapiFile = testHelper.hapiFile('image.jpg');
    const payload = { text: 'just a text', attachments: [hapiFile] };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNull(actual.error);
  });

  it('should succeed when only a text is provided', async () => {
    const payload = { text: 'just a text' };
    const actual = Joi.validate({ payload }, scheme);

    assert.isNull(actual.error);
  });

  it('should succeed when no param is provided', async () => {
    const actual = Joi.validate({}, scheme);

    assert.ifError(actual.error[0]);
  });
});
