import stream from 'stream';
import { assert } from 'chai';
import sinon from 'sinon';
import * as uploadService from './index';
import * as impl from './implementation';

describe('Service: upload', () => {
  let sandbox;

  beforeEach(async () => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return a url in bucket', async () => {
    sandbox.stub(impl, 'createS3').returns({
      putObject: () => ({
        promise: () => Promise.resolve({ ETag: '2322aab33cd302e' }),
      }),
    });

    const imageStream = new stream.PassThrough();
    imageStream.end(new Buffer('image'));
    const result = await uploadService.upload({
      path: '/attachments/image.jpg', stream: imageStream }, {});

    assert.equal(result, '/attachments/image.jpg');
  });

  it('should throw an exception', async () => {
    sandbox.stub(impl, 'createS3').returns({
      putObject: () => ({
        promise: () => Promise.reject('Error in S3'),
      }),
    });

    const imageStream = new stream.PassThrough();
    imageStream.end(new Buffer('image'));
    const result = uploadService.upload({
      path: '/attachments/image.jpg', stream: imageStream }, {});

    return assert.isRejected(result, /Error: Error in S3/);
  });
});
