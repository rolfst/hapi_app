const Boom = require('boom');
const { pick } = require('lodash');
const errors = require('../configs/errors.json');

const ownStackEntryRegex = /^\s*at createError.*$/;
const matchesRegex = (stackEntry) => ownStackEntryRegex.test(stackEntry);
const stripCreateErrorFromStacktrace = (error) => {
  const newError = error;
  const newStack = error.stack.split('\n');

  // Now find the first 'at createError' line, remove it then fall out
  for (let stackIdx = 0, stackLen = newStack.length; stackIdx < stackLen; stackIdx += 1) {
    if (matchesRegex(newStack[stackIdx])) {
      newStack.splice(stackIdx, 1);
      break;
    }
  }

  // Put it back like nothing happened
  newError.stack = newStack.join('\n');

  return newError;
};

const createError = (code, developerMessage) => {
  const FILTER_PROPERTIES = ['type', 'detail', 'code'];
  const error = pick(errors[code.toString()], FILTER_PROPERTIES);

  if (!error) throw new Error(`Specify a valid HTTP status code, received ${code}`);

  const boomError = Boom.create(error.code, developerMessage || error.detail, {
    errorType: error.type,
    errorCode: code.toString(),
  });

  // We modify the stacktrace so our entry point isn't createError()
  return stripCreateErrorFromStacktrace(boomError);
};

module.exports = createError;
