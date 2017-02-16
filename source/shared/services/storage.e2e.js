import fs from 'fs';
import { assert } from 'chai';
import sinon from 'sinon';
import AWS from 'aws-sdk';
import * as Storage from './storage';

describe('Service: Storage', () => {
  let sandbox;

  const filePath = `${process.cwd()}/image.jpg`;

  const hapiFile = {
    filename: 'image.jpg',
    path: `${process.cwd()}/image.jpg`,
    headers: {
      'content-disposition': 'form-data; name="attachments"; filename="image.jpg"',
      'content-type': 'image/jpg',
    },
  };

  before(() => fs.writeFileSync(filePath, new Buffer('foo')));
  after(() => fs.unlinkSync(filePath));

  beforeEach(async () => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return a url in bucket', async () => {
    sandbox.stub(AWS, 'S3').returns({
      putObject: () => ({
        promise: () => Promise.resolve({ ETag: '2322aab33cd302e' }),
      }),
    });

    const result = await Storage.upload(hapiFile, {});

    assert.isDefined(result);
    assert.match(result, /(.jpg)/);
  });

  it('should throw an exception', async () => {
    sandbox.stub(AWS, 'S3').returns({
      putObject: () => ({
        promise: () => Promise.reject('Error in S3'),
      }),
    });

    const result = Storage.upload(hapiFile, {});

    return assert.isRejected(result, /Error: Error in S3/);
  });
});
