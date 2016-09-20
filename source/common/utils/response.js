import { isArray } from 'lodash';

export const error = errorObject => ({ error: errorObject });

export const serialize = response => {
  return (isArray(response)) ? response.map(item => item.toJSON()) : response.toJSON();
};
