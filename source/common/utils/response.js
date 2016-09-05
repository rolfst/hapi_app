import { isArray } from 'lodash';

export const error = errorObject => ({
  error: {
    type: errorObject.output.payload.type,
    detail: errorObject.output.payload.message,
    status_code: errorObject.output.statusCode,
  },
});

export const serialize = response => {
  return (isArray(response)) ? response.map(item => item.toJSON()) : response.toJSON();
};
