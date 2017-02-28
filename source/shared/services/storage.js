import R from 'ramda';
import fs from 'fs';
import Promise from 'bluebird';
import AWS from 'aws-sdk';
import createError from '../utils/create-error';
import * as Logger from './logger';

const logger = Logger.getLogger('SHARED/service/upload');

export const getEnvironmentLocation = () => {
  const mapping = {
    testing: 'development',
    development: 'development',
    production: 'production',
    acceptance: 'acc',
  };

  return mapping[process.env.API_ENV];
};

export const getClient = () => {
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
 * @param {Stream} file - Stream containing file
 * @param {string} file.hapi.filename
 * @param {object} file.hapi.headers
 * @param {string} prefix - The prefix that will be prepended to the filename
 * @method upload
 * @return {external:Promise.<String>} Returning the filename
 */
export function upload(file, prefix = null) {
  const environment = getEnvironmentLocation();
  const fileExtension = R.last(file.hapi.filename.split('.'));
  const generatedFileName = Math.random().toString(20).substr(2, 15);
  const newFilename = `${generatedFileName}.${fileExtension}`;
  const uploadPath = prefix ?
    `${environment}/${prefix}/${newFilename}` :
    `${environment}/${newFilename}`;

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: uploadPath,
    Body: file,
    ContentType: file.hapi.headers['content-type'],
  };

  return new Promise((success, reject) => {
    getClient().upload(params, (err, data) => {
      if (err) {
        logger.error('Error while uploading to Amazon S3', { err });

        return reject(createError('30001', err));
      }

      logger.info('Amazon S3 response', { response: data });

      return success(newFilename);
    });
  });
}
