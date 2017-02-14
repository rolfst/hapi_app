import R from 'ramda';
import createError from '../../../../shared/utils/create-error';
import * as Logger from '../../../../shared/services/logger';
import * as impl from './implementation';

const logger = Logger.getLogger('UPLOAD/service/upload');

const location = {
  testing: 'local',
  production: 'production',
  acc: 'acc',
};

export async function upload(image, message) {
  const s3 = impl.createS3();
  const environment = location[process.env.API_ENV];
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: `${environment}${image.path}`,
    Body: image.stream,
  };

  logger.info('Uploading file to S3', { params: R.omit(['BODY'], params), message });

  return s3.putObject(params).promise()
    .then((response) => {
      logger.info('S3 response', { response, message });

      if (response.ETag) return image.path;
    })
    .catch(err => {
      logger.error('Error with S3', { err, message });

      throw createError('30001', err);
    });
}
