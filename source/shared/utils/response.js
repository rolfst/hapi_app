const { map, isString, isArray, forIn, mapKeys, snakeCase, isObject } = require('lodash');

const transformSnakeCase = (obj) => {
  if (isString(obj)) return obj;

  const snakeResult = mapKeys(obj, (value, key) => {
    return snakeCase(key);
  });

  const result = {};

  forIn(snakeResult, (value, key) => {
    const val = snakeResult[key];

    if (isObject(val) && !isArray(val)) {
      result[key] = transformSnakeCase(val);
    } else if (isArray(val)) {
      result[key] = map(val, transformSnakeCase);
    } else {
      result[key] = val;
    }
  });

  return result;
};

export const error = errorObject => ({ error: errorObject });

export const serialize = response => {
  return (isArray(response)) ? response.map(item => item.toJSON()) : response.toJSON();
};

export const toSnakeCase = (response) => {
  return isArray(response) ? response.map(transformSnakeCase) : transformSnakeCase(response);
};
