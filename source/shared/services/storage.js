import R from 'ramda';
import Promise from 'bluebird';
import AWS from 'aws-sdk';
import createError from '../utils/create-error';
import * as Logger from './logger';

const logger = Logger.getLogger('SHARED/service/upload');

const location = {
  testing: 'development',
  development: 'development',
  production: 'production',
  acceptance: 'acc',
};

const getStorageClient = () => {
  AWS.config.setPromisesDependency(Promise);

  const options = {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
    region: process.env.S3_REGION,
  };

  return new AWS.S3(options);
};

/**
 * Upload a fileStream to Amazon S3 Storage
 * @param {Stream} fileStream - Stream containing the file to upload
 * @param {string} prefix - The prefix that will be prepended to the filename
 * @method upload
 * @return {external:Promise.<String>} Returning the filename
 */
export function upload(fileStream, prefix = null) {
  const environment = location[process.env.API_ENV];
  const fileExtension = fileStream.hapi.filename.split('.')[1];
  const generatedFileName = Math.random().toString(20).substr(2, 10);
  const newFilename = `${generatedFileName}.${fileExtension}`;
  const uploadPath = prefix ?
    `${environment}/${prefix}/${newFilename}` :
    `${environment}/${newFilename}`;

  return new Promise((fulfill, reject) => {
    fileStream.on('readable', (buffer) => {
      const params = {
        Bucket: process.env.S3_BUCKET,
        Key: uploadPath,
        Body: buffer,
      };

      logger.info('Uploading file to S3', { params: R.omit(['Body'], params) });

      getStorageClient().putObject(params).promise()
        .then((response) => {
          logger.info('S3 response', { response });

          if (response.ETag) fulfill(newFilename);
        })
        .catch(err => {
          logger.error('Error with S3', { err });

          reject(createError('30001', err));
        });
    });
  });
}
