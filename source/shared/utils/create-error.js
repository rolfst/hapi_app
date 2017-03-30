const Boom = require('boom');
const { pick } = require('lodash');
const errors = require('../configs/errors.json');

const ownStackEntryRegex = /^\s*at createError.*$/;

const createError = (code, developerMessage) => {
  const FILTER_PROPERTIES = ['type', 'detail', 'code'];
  const error = pick(errors[code.toString()], FILTER_PROPERTIES);

  if (!error) throw new Error(`Specify a valid HTTP status code, received ${code}`);

  const boomError = Boom.create(error.code, developerMessage || error.detail, {
    errorType: error.type,
    errorCode: code.toString(),
  });

  // We modify the stacktrace so our entry point isn't createError()
  const fullStack = boomError.stack.split('\n');

  // Now find the first 'at createError' line, remove it then fall out
  for (let stackIdx = 0, stackLen = fullStack.length; stackIdx < stackLen; stackIdx += 1) {
    if (ownStackEntryRegex.test(fullStack[stackIdx])) {
      fullStack.splice(stackIdx, 1);
      break;
    }
  }

  // Put it back like nothing happened
  boomError.stack = fullStack.join('\n');

  return boomError;
};

module.exports = createError;
