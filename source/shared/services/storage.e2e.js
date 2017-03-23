const { assert } = require('chai');
const stream = require('stream');
const sinon = require('sinon');
const AWS = require('aws-sdk');
const Storage = require('./storage');

describe('Service: Storage', () => {
  let sandbox;

  class HapiReadable extends stream.Readable {
    constructor(opts) {
      super(opts);

      this.hapi = {};
      this.hapi.headers = {};
      this.hapi.filename = 'image.jpg';
      this.hapi.headers['content-type'] = 'image/jpeg';
    }
  }

  const file = new HapiReadable();

  beforeEach(async () => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return a url in bucket', async () => {
    sandbox.stub(AWS, 'S3').returns({
      upload: () => ({
        promise: () => Promise.resolve({ ETag: '2322aab33cd302e' }),
      }),
    });

    const result = await Storage.upload(file);

    assert.isDefined(result);
    assert.match(result, /(.jpg)/);
  });

  it('should throw an exception', async () => {
    sandbox.stub(AWS, 'S3').returns({
      upload: () => ({
        promise: () => Promise.reject('Error in S3'),
      }),
    });

    const result = Storage.upload(file);

    return assert.isRejected(result, 'Error in S3');
  });
});
