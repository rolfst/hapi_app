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

const error = errorObject => ({ error: errorObject });

const serialize = response => {
  return (isArray(response)) ? response.map(item => item.toJSON()) : response.toJSON();
};

const toSnakeCase = (response) => {
  return isArray(response) ? response.map(transformSnakeCase) : transformSnakeCase(response);
};

// exports of functions
exports.error = error;
exports.serialize = serialize;
exports.toSnakeCase = toSnakeCase;
