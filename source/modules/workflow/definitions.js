const Joi = require('joi');

exports.ETriggerTypes = {
  DIRECT: 'direct',
  DATETIME: 'datetime',
};

exports.EConditionOperators = {
  EQUAL: '==',
  GREATER_THAN: '>',
  LESS_THAN: '<',
  GREATER_THAN_OR_EQUAL: '>=',
  LESS_THAN_OR_EQUAL: '<=',
  NOT: '!=',
  IN: 'in',
  NOT_IN: 'not_in',
  CONTAINS: 'like',
  IS: 'IS',
};

exports.EActionTypes = {
  MESSAGE: 'message',
};

// Amount of ms to wait before starting another iteration of the workflow processor
exports.WORKER_INTERVAL = 1000;

// Maximum users to concurrently take action on
exports.CONCURRENT_USERS = 10;

exports.TRIGGER_SCHEME = Joi.object().keys({
  type: Joi.string().required().valid(Object.values(exports.ETriggerTypes)),
  value: Joi.alternatives().when('type', {
    is: exports.ETriggerTypes.DATETIME,
    then: Joi.string().required(),
    otherwise: Joi.string(),
  }),
});

exports.TRIGGERS_SCHEME = Joi.array().items(exports.TRIGGER_SCHEME);

exports.CONDITION_SCHEME = Joi.object().keys({
  field: Joi.string().required(),
  operator: Joi.string().required().valid(Object.values(exports.EConditionOperators)),
  value: Joi.string().required(),
});

exports.CONDITIONS_SCHEME = Joi.array().items(exports.CONDITION_SCHEME);

exports.ACTION_SCHEME = Joi.object().keys({
  type: Joi.string().required().valid(Object.values(exports.EActionTypes)),
  meta: Joi.alternatives(Joi.string(), Joi.object()).required(),
});

exports.ACTIONS_SCHEME = Joi.array().items(exports.ACTION_SCHEME);
