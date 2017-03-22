const R = require('ramda');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const createError = require('../utils/create-error');
const Logger = require('./logger');

const logger = Logger.getLogger('SHARED/service/upload');

const getEnvironmentLocation = () => {
  const mapping = {
    testing: 'development',
    development: 'development',
    production: 'production',
    acceptance: 'acc',
  };

  return mapping[process.env.API_ENV];
};

const getClient = () => {
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
function upload(file, prefix = null) {
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

  return getClient().upload(params).promise()
    .then(data => {
      logger.info('Amazon S3 response', { response: data });

      return newFilename;
    })
    .catch(err => {
      logger.error('Error while uploading to Amazon S3', { err });

      throw createError('30001', err);
    });
}

exports.getClient = getClient;
exports.getEnvironmentLocation = getEnvironmentLocation;
exports.upload = upload;
