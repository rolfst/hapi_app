import Boom from 'boom';
import { pick } from 'lodash';
import errors from '../configs/errors.json';

const createError = (code, developerMessage) => {
  const FILTER_PROPERTIES = ['type', 'detail', 'code'];
  const error = pick(errors[code.toString()], FILTER_PROPERTIES);

  if (!error) throw new Error(`Specify a valid HTTP status code, received ${code}`);

  return Boom.create(error.code, developerMessage || error.detail, {
    errorType: error.type,
    errorCode: code.toString(),
  });
};

export default createError;