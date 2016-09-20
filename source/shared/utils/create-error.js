import { pick } from 'lodash';
import errors from '../configs/errors.json';

const createError = (code, developerMessage) => {
  const FILTER_PROPERTIES = ['type', 'detail', 'code'];
  const error = pick(errors[code.toString()], FILTER_PROPERTIES);

  if (!error) throw new Error(`Specify a valid HTTP status code, received ${code}`);

  return {
    type: error.type,
    detail: developerMessage || error.detail,
    is_error: true,
    status_code: error.code,
  };
};

export default createError;
