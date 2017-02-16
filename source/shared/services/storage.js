import R from 'ramda';
import fs from 'fs';
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
 * @param {object} file - Object containing file meta data
 * @param {string} file.filename
 * @param {object} file.headers
 * @param {string} prefix - The prefix that will be prepended to the filename
 * @method upload
 * @return {external:Promise.<String>} Returning the filename
 */
export function upload(file, prefix = null) {
  const environment = location[process.env.API_ENV];
  const fileExtension = file.filename.split('.')[1];
  const generatedFileName = Math.random().toString(20).substr(2, 15);
  const newFilename = `${generatedFileName}.${fileExtension}`;
  const uploadPath = prefix ?
    `${environment}/${prefix}/${newFilename}` :
    `${environment}/${newFilename}`;

  return new Promise((fulfill, reject) => {
    fs.readFile(file.path, (fsErr, fileData) => {
      if (fsErr) return reject(fsErr);

      const params = {
        Bucket: process.env.S3_BUCKET,
        Key: uploadPath,
        Body: fileData,
        ContentDisposition: file.headers['content-disposition'],
        ContentType: file.headers['content-type'],
      };

      logger.info('Uploading file to S3', { params: R.omit(['Body'], params) });

      getClient().putObject(params).promise()
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
