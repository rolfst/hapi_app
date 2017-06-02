const { assert } = require('chai');
const FormData = require('form-data');
const streamToPromise = require('stream-to-promise');
const sinon = require('sinon');
const testHelper = require('../../../shared/test-utils/helpers');
const attachmentService = require('../services/attachment/index');

describe('Service: Attachment', () => {
  let admin;
  let sandbox;
  let network;

  function postRequest(url, form, headers, token) {
    return global.server.inject({
      method: 'POST',
      url,
      payload: form,
      headers: Object.assign({
        'X-API-Token': token,
      }, headers),
    });
  }

  describe('create', () => {
    before(async () => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(attachmentService, 'create').returns(Promise.resolve({}));

      admin = await testHelper.createUser();
      network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
    });

    after(async () => {
      sandbox.restore();
      return testHelper.cleanAll();
    });

    it('should create a attachment', async () => {
      const ENDPOINT_URL = `/v2/networks/${network.id}/files`;
      const form = new FormData();
      form.append('file', Buffer('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64').toString());
      const promisiedStream = await streamToPromise(form);
      const { statusCode } = await postRequest(
        ENDPOINT_URL, promisiedStream, form.getHeaders(), admin.token);

      assert.equal(statusCode, 200);
    });

    it('should create a attachment without having a network', async () => {
      const ENDPOINT_URL = '/v2/files';
      const form = new FormData();
      form.append('file', Buffer('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64').toString());
      const promisiedStream = await streamToPromise(form);
      const { statusCode } = await postRequest(
        ENDPOINT_URL, promisiedStream, form.getHeaders(), admin.token);

      assert.equal(statusCode, 200);
    });
  });
});
