
import Promise from 'bluebird';
import AWS from 'aws-sdk';

AWS.config.setPromisesDependency(Promise);

export function createS3() {
  const options = {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
    region: process.env.S3_REGION,
  };

  return new AWS.S3(options);
}
